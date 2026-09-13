-- v1 metering: identity, balance, deposits and daily caps.
--
-- `ledgers` and `receipts` have existed since 0001 but no code ever wrote them,
-- so the site claimed "a receipt on every metered call" with nothing behind it.
-- This migration adds the missing pieces and the atomic RPCs that make a charge
-- and a credit safe under concurrency.

-- ── Identity ─────────────────────────────────────────────────────────
create table if not exists public.agents (
  agent_id   text primary key,                -- ag_…
  label      text not null default '',
  state      text not null default 'active' check (state in ('active', 'blocked')),
  created_at timestamptz not null default now()
);

-- Only the hash of a credential is stored. The secret is shown once, at issue.
create table if not exists public.api_keys (
  key_hash     text primary key,              -- sha256 hex of the presented secret
  agent_id     text not null references public.agents (agent_id) on delete cascade,
  label        text not null default '',
  created_at   timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at   timestamptz
);
create index if not exists api_keys_agent_idx on public.api_keys (agent_id);

-- ── Deposits ─────────────────────────────────────────────────────────
-- What we ask the customer to pay. `reference` is the reconciliation key: it
-- rides along as a read-only account on the Solana Pay transfer, and validators
-- index transactions by it, so getSignaturesForAddress(reference) finds it.
create table if not exists public.deposit_intents (
  deposit_id text primary key,                -- dep_…
  agent_id   text not null references public.agents (agent_id) on delete cascade,
  rail       text not null default 'solana' check (rail in ('solana', 'manual')),
  network    text not null,
  mint       text not null default '',        -- '' means native SOL
  symbol     text not null,
  amount_ui  numeric(20, 9) not null check (amount_ui > 0),
  reference  text not null unique,
  state      text not null default 'open'
             check (state in ('open', 'paid', 'credited', 'expired', 'unmatched')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists deposit_intents_open_idx on public.deposit_intents (state, expires_at);
create index if not exists deposit_intents_agent_idx on public.deposit_intents (agent_id, created_at desc);

-- One row per on-chain transfer we credited. The signature is the primary key:
-- that is the duplicate-credit guard, and it is load bearing. A webhook is
-- at-least-once and the same transfer can be presented twice before
-- confirmation, so the insert must be able to fail.
create table if not exists public.deposits (
  signature     text primary key,
  deposit_id    text not null references public.deposit_intents (deposit_id) on delete cascade,
  agent_id      text not null references public.agents (agent_id) on delete cascade,
  mint          text not null default '',
  amount_atomic bigint not null check (amount_atomic > 0),
  amount_micros bigint not null check (amount_micros > 0),
  rate_micros   bigint not null default 0,    -- USD micros per whole token
  slot          bigint,
  commitment    text not null default 'confirmed' check (commitment in ('confirmed', 'finalized')),
  credited_at   timestamptz not null default now()
);
create index if not exists deposits_agent_idx on public.deposits (agent_id, credited_at desc);

-- ── Usage, for the caps ──────────────────────────────────────────────
create table if not exists public.usage_counters (
  agent_id text not null references public.agents (agent_id) on delete cascade,
  day      date not null default current_date,
  calls    integer not null default 0,
  micros   bigint not null default 0,
  primary key (agent_id, day)
);

-- Distinct beats per day, so "50 beats a day" is a count rather than an array scan.
create table if not exists public.usage_beats (
  agent_id text not null references public.agents (agent_id) on delete cascade,
  day      date not null default current_date,
  beat_id  text not null,
  primary key (agent_id, day, beat_id)
);

-- ── receipts: Solana rail, the real verb names, and free calls ───────
alter table public.receipts drop constraint if exists receipts_call_check;
alter table public.receipts drop constraint if exists receipts_rail_check;
alter table public.receipts drop constraint if exists receipts_amount_micros_check;
alter table public.receipts
  add constraint receipts_call_check
    check (call in ('poll', 'delta', 'briefing', 'resolve', 'brief', 'watch', 'deposit')),
  add constraint receipts_rail_check
    check (rail in ('manual', 'prepaid', 'x402', 'solana', 'acp', 'stripe')),
  -- resolve is free to 100 calls a day, so a receipt can legitimately be zero.
  add constraint receipts_amount_micros_check check (amount_micros >= 0);
create index if not exists receipts_agent_call_idx
  on public.receipts (agent_id, call, settled_at desc);

-- ── Atomic charge ────────────────────────────────────────────────────
-- Caps, debit, receipt and counters in one transaction. Returns ok=false with a
-- machine-readable reason instead of raising, so the API can map it to the
-- right error code without string matching.
create or replace function public.charge_call(
  p_agent_id text,
  p_micros bigint,
  p_call text,
  p_beat_id text,
  p_receipt_id text,
  p_daily_cap_micros bigint,
  p_daily_beat_cap integer,
  p_rail text default 'prepaid'
) returns table (
  ok boolean,
  reason text,
  balance_micros bigint,
  daily_micros bigint,
  daily_beats integer
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_state text;
  v_today_micros bigint;
  v_today_beats integer;
  v_balance bigint;
  v_new_beat boolean := false;
begin
  select a.state into v_state from public.agents a where a.agent_id = p_agent_id;
  if v_state is null then
    return query select false, 'invalid_credential', null::bigint, null::bigint, null::integer;
    return;
  end if;
  if v_state <> 'active' then
    return query select false, 'blocked', null::bigint, null::bigint, null::integer;
    return;
  end if;

  select coalesce(uc.micros, 0) into v_today_micros
    from public.usage_counters uc
   where uc.agent_id = p_agent_id and uc.day = current_date;
  v_today_micros := coalesce(v_today_micros, 0);

  select count(*) into v_today_beats
    from public.usage_beats ub
   where ub.agent_id = p_agent_id and ub.day = current_date;

  if p_beat_id is not null and p_beat_id <> '' then
    select not exists (
      select 1 from public.usage_beats ub
       where ub.agent_id = p_agent_id and ub.day = current_date and ub.beat_id = p_beat_id
    ) into v_new_beat;
  end if;

  if p_daily_cap_micros is not null and v_today_micros + p_micros > p_daily_cap_micros then
    return query select false, 'daily_cap', null::bigint, v_today_micros, v_today_beats;
    return;
  end if;

  if v_new_beat and p_daily_beat_cap is not null and v_today_beats >= p_daily_beat_cap then
    return query select false, 'beat_cap', null::bigint, v_today_micros, v_today_beats;
    return;
  end if;

  update public.ledgers l
     set balance_micros = l.balance_micros - p_micros,
         updated_at = now()
   where l.agent_id = p_agent_id
     and l.balance_micros >= p_micros
  returning l.balance_micros into v_balance;

  if v_balance is null then
    return query select false, 'insufficient_balance', null::bigint, v_today_micros, v_today_beats;
    return;
  end if;

  insert into public.receipts (receipt_id, agent_id, call, beat_id, amount_micros, rail)
  values (p_receipt_id, p_agent_id, p_call, coalesce(p_beat_id, ''), p_micros, p_rail);

  insert into public.usage_counters (agent_id, day, calls, micros)
  values (p_agent_id, current_date, 1, p_micros)
  on conflict (agent_id, day) do update
    set calls = public.usage_counters.calls + 1,
        micros = public.usage_counters.micros + excluded.micros;

  if v_new_beat then
    insert into public.usage_beats (agent_id, day, beat_id)
    values (p_agent_id, current_date, p_beat_id)
    on conflict do nothing;
    v_today_beats := v_today_beats + 1;
  end if;

  return query select true, null::text, v_balance, v_today_micros + p_micros, v_today_beats;
end;
$$;

-- ── Credit, used by the deposit watcher ──────────────────────────────
create or replace function public.credit_balance(p_agent_id text, p_micros bigint)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_balance bigint;
begin
  insert into public.ledgers (agent_id, balance_micros)
  values (p_agent_id, p_micros)
  on conflict (agent_id) do update
    set balance_micros = public.ledgers.balance_micros + excluded.balance_micros,
        updated_at = now()
  returning public.ledgers.balance_micros into v_balance;
  return v_balance;
end;
$$;

-- Credit a verified deposit exactly once. The unique signature is what makes
-- this safe to call twice; the second call returns null and changes nothing.
create or replace function public.record_deposit(
  p_signature text,
  p_deposit_id text,
  p_agent_id text,
  p_mint text,
  p_amount_atomic bigint,
  p_amount_micros bigint,
  p_rate_micros bigint,
  p_slot bigint,
  p_commitment text
) returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_balance bigint;
begin
  insert into public.deposits (
    signature, deposit_id, agent_id, mint, amount_atomic,
    amount_micros, rate_micros, slot, commitment
  )
  values (
    p_signature, p_deposit_id, p_agent_id, p_mint, p_amount_atomic,
    p_amount_micros, p_rate_micros, p_slot, p_commitment
  )
  on conflict (signature) do nothing;

  if not found then
    return null;  -- already credited
  end if;

  v_balance := public.credit_balance(p_agent_id, p_amount_micros);

  insert into public.receipts (receipt_id, agent_id, call, beat_id, amount_micros, rail)
  values ('r_dep_' || substr(p_signature, 1, 24), p_agent_id, 'deposit', '', p_amount_micros, 'solana');

  update public.deposit_intents
     set state = 'credited'
   where deposit_id = p_deposit_id;

  return v_balance;
end;
$$;

-- ── Lock everything down; only the service role may call these ───────
alter table public.agents enable row level security;
alter table public.api_keys enable row level security;
alter table public.deposit_intents enable row level security;
alter table public.deposits enable row level security;
alter table public.usage_counters enable row level security;
alter table public.usage_beats enable row level security;

revoke all on public.agents, public.api_keys, public.deposit_intents,
  public.deposits, public.usage_counters, public.usage_beats
  from anon, authenticated;
grant all on public.agents, public.api_keys, public.deposit_intents,
  public.deposits, public.usage_counters, public.usage_beats
  to service_role;

revoke execute on function public.charge_call(text, bigint, text, text, text, bigint, integer, text)
  from public, anon, authenticated;
revoke execute on function public.credit_balance(text, bigint) from public, anon, authenticated;
revoke execute on function public.record_deposit(text, text, text, text, bigint, bigint, bigint, bigint, text)
  from public, anon, authenticated;
grant execute on function public.charge_call(text, bigint, text, text, text, bigint, integer, text) to service_role;
grant execute on function public.credit_balance(text, bigint) to service_role;
grant execute on function public.record_deposit(text, text, text, text, bigint, bigint, bigint, bigint, text) to service_role;
