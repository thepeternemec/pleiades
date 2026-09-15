# Deployment and portability

**Short answer: no, Supabase is not required.** It is a deployment target, not an
architectural dependency. The repo was built that way on purpose — the Edge Functions under
`supabase/functions/` are *generated* from ordinary Node sources by
`scripts/sync-supabase.mjs`, so the same code already runs as a plain Node service.

This document records what Supabase genuinely provides, how tightly the code is coupled to it,
and what moving would actually cost.

---

## 1. What Supabase provides today

| Capability | What it is used for | Portable? |
| --- | --- | --- |
| **Postgres** | Every table: beats, packs, pack_items, articles_raw, ledgers, receipts, agents, api_keys, deposit_intents, deposits, usage_counters, usage_beats, webhooks, news_articles | ✅ Any Postgres |
| **Edge Functions (Deno)** | `api` (REST), `worker` (ingestion), `news-api`, `news-worker` | ✅ Node mirror exists |
| **PostgREST** | The `supabase-js` query builder talks to it | ⚠️ See §4 |
| **Realtime** | `packs` inserts → `@pleiades/realtime` → WebSocket to clients | ⚠️ Replaceable |
| **pg_cron + pg_net** | Fires the ingestion worker on a schedule | ✅ Any scheduler |
| **Vault** | Stores the worker token | ✅ Env var |
| **RLS + roles** | Grants to `anon` / `authenticated` / `service_role` | ⚠️ Supabase-only roles |
| **Auth** | *Not used.* Identity is the custom `agents` / `api_keys` tables | ✅ Already independent |

Note that the last row matters: nothing depends on Supabase Auth, so there is no user
directory to migrate.

---

## 2. How coupled the code actually is

Measured, not estimated:

| Measure | Count |
| --- | --- |
| Files importing `@supabase/supabase-js` | 9 |
| PostgREST query-builder call sites (`.from()`, `.rpc()`) | 25, all in `packages/db/src` |
| Migrations using Supabase-only SQL | 3 of 9 |
| Supabase-only features used | `vault`, `pg_net`, `pg_cron`, `service_role`/`anon`/`authenticated` roles, `supabase_realtime` |

The 25 call sites are the whole story. They are ordinary selects, inserts, updates, an
`.eq()`, an `.order()`, a `.limit()` and three `.rpc()` calls. None of them is clever.

---

## 3. What moves with no changes at all

- `packages/contracts` — every wire shape, the Solana Pay builder, the deposit verification rules
- `packages/sdk`, `packages/realtime`
- `apps/api` — a Hono app; runs anywhere Node runs (`npm run dev` already does this)
- `apps/worker` — the ingestion logic in Node
- `apps/web` — Next.js, already on Vercel
- All 37 tests

The database functions `charge_call()`, `credit_balance()` and `record_deposit()` are plain
PL/pgSQL, so they move as-is. That is deliberate: the caps, the debit, the receipt and the usage
counters commit in one transaction, and that guarantee should survive any host.

---

## 4. What has to change

Only two things are real work.

**a. The data layer, if you leave PostgREST behind.** Two routes:

- **Keep PostgREST.** It is open source — one container, no code change at all. This turns a
  migration into a config task.
- **Replace it.** Rewrite the 25 call sites against `pg`, Kysely or Drizzle. Estimate: a day,
  maybe two with the `.rpc()` calls and error mapping. The queries are simple enough that this
  is mechanical rather than risky.

**b. Everything else is small:**

| Item | Replacement |
| --- | --- |
| `pg_cron` + `pg_net` | Vercel Cron, GitHub Actions, a systemd timer, or a `setInterval` in the worker process |
| `vault.create_secret` | an environment variable |
| Grants to `anon` / `authenticated` / `service_role` | drop those lines and run the app as a single role. They are defence in depth, not the security boundary — the API is the only client and it authenticates with its own `api_keys` table |
| Supabase Realtime | `LISTEN`/`NOTIFY` plus a small WebSocket server, or polling. The site already polls `/v1/stats` every 20 seconds, so realtime is an optimisation rather than a requirement |
| `gen_random_bytes` | `pgcrypto`, or generate the value in the app |

---

## 5. The options

**A. Stay on Supabase** — *recommended for now*

Postgres, compute, cron, realtime and secrets in one place, already deployed and verified. No
migration work. The trade-offs are cold starts and CPU limits on Edge Functions, and vendor
coupling.

**B. Managed Postgres + Node API elsewhere** — *best cost/benefit if you outgrow edge functions*

Keep a managed Postgres (Neon, Supabase's own Postgres, RDS) and run `apps/api` on Fly, Render
or Railway, with Vercel Cron or GitHub Actions for ingestion. You get a normal Node runtime with
no cold-start or CPU ceiling. Work: §4a plus pointing the cron at the Node worker.

**C. Self-hosted Supabase** — *keep every line, own the ops*

Supabase is open source and ships a Docker Compose stack. Zero code change. You take on backups,
upgrades, monitoring and on-call.

**D. Fully self-hosted** — *maximum control, most work*

Postgres + PostgREST (or direct SQL) + the Node API + a scheduler on a single VPS. This is the
€5-a-month answer, and it is realistic for this codebase because the compute is light: the API
is a thin query layer over Postgres, and ingestion is a scheduled job.

---

## 6. Recommendation

**Stay on Supabase until it constrains you, and keep the exit cheap.**

The exit is already cheap — that is what the generated `_shared` layer buys. Two habits keep it
that way:

1. **Keep database logic in SQL, not in the host.** Caps, uniqueness and the duplicate-credit
   guard live in Postgres functions. They are the parts that would be dangerous to get wrong
   twice, and they are the parts that move for free.
2. **Keep the Node mirror honest.** `apps/api` and `apps/worker` are the canonical sources, and
   CI already fails on drift between them and the deployed Edge Functions. That check is what
   keeps the second deployment target real rather than theoretical.

The signal to move is concrete: Edge Function CPU or duration limits, or cron unreliability.
Neither has bitten yet.

---

## 7. What does not change, whichever way you go

- The public API contract — same routes, same shapes
- The site and the docs, which never mention the host
- Billing: the metered ledger and the receipts are unaffected by where the API runs, and so is
  the optional stablecoin rail
- The price card and the caps
