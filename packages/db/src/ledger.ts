import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The ledger: balance, metering and receipts.
 *
 * Every mutation goes through a Postgres function (`charge_call`,
 * `credit_balance`, `record_deposit`) so caps, the debit, the receipt and the
 * usage counters commit or roll back together. Nothing here does
 * read-then-write, because that races.
 */

export const DEFAULT_DAILY_CAP_MICROS = 500_000; // $0.50
export const DEFAULT_DAILY_BEAT_CAP = 50;
const LOW_BALANCE_MICROS = 500_000; // nudge when under $0.50

export interface ChargeResult {
  ok: boolean;
  reason: string | null;
  balanceMicros: number | null;
  dailyMicros: number;
  dailyBeats: number;
}

export interface BalanceSnapshot {
  agentId: string;
  balanceMicros: number;
  callsToday: number;
  microsToday: number;
  beatsToday: number;
}

function newReceiptId(): string {
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 20);
  return `r_${random}`;
}

/** Current balance plus today's usage. */
export async function getBalance(
  db: SupabaseClient,
  agentId: string,
): Promise<BalanceSnapshot | null> {
  const [ledger, counters, beats] = await Promise.all([
    db.from("ledgers").select("balance_micros").eq("agent_id", agentId).maybeSingle(),
    db
      .from("usage_counters")
      .select("calls, micros")
      .eq("agent_id", agentId)
      .eq("day", new Date().toISOString().slice(0, 10))
      .maybeSingle(),
    db
      .from("usage_beats")
      .select("beat_id", { count: "exact", head: true })
      .eq("agent_id", agentId)
      .eq("day", new Date().toISOString().slice(0, 10)),
  ]);

  if (ledger.error) throw new Error(ledger.error.message);

  return {
    agentId,
    balanceMicros: Number(ledger.data?.balance_micros ?? 0),
    callsToday: Number(counters.data?.calls ?? 0),
    microsToday: Number(counters.data?.micros ?? 0),
    beatsToday: Number(beats.count ?? 0),
  };
}

export function isLowBalance(balanceMicros: number): boolean {
  return balanceMicros < LOW_BALANCE_MICROS;
}

export interface ChargeInput {
  agentId: string;
  micros: number;
  call: "poll" | "delta" | "briefing" | "resolve" | "brief" | "watch";
  beatId?: string | null;
  rail?: "prepaid" | "x402" | "solana" | "manual";
  dailyCapMicros?: number;
  dailyBeatCap?: number;
}

/**
 * Charge one metered call. Returns `ok:false` with a reason rather than
 * throwing, because a refused charge is a normal API outcome (402 / 429), not
 * an exception.
 */
export async function chargeCall(
  db: SupabaseClient,
  input: ChargeInput,
): Promise<ChargeResult & { receiptId: string }> {
  const receiptId = newReceiptId();
  const { data, error } = await db.rpc("charge_call", {
    p_agent_id: input.agentId,
    p_micros: input.micros,
    p_call: input.call,
    p_beat_id: input.beatId ?? "",
    p_receipt_id: receiptId,
    p_daily_cap_micros: input.dailyCapMicros ?? DEFAULT_DAILY_CAP_MICROS,
    p_daily_beat_cap: input.dailyBeatCap ?? DEFAULT_DAILY_BEAT_CAP,
    p_rail: input.rail ?? "prepaid",
  });

  if (error) throw new Error(error.message);

  const row = Array.isArray(data) ? data[0] : data;
  return {
    ok: Boolean(row?.ok),
    reason: row?.reason ?? null,
    balanceMicros: row?.balance_micros === null || row?.balance_micros === undefined
      ? null
      : Number(row.balance_micros),
    dailyMicros: Number(row?.daily_micros ?? 0),
    dailyBeats: Number(row?.daily_beats ?? 0),
    receiptId,
  };
}

/**
 * Credit a verified on-chain deposit exactly once. Returns the new balance, or
 * null when the signature was already credited — the caller should treat that
 * as success and do nothing further.
 */
export async function creditDeposit(
  db: SupabaseClient,
  deposit: {
    signature: string;
    depositId: string;
    agentId: string;
    mint: string;
    amountAtomic: number;
    amountMicros: number;
    rateMicros: number;
    slot: number | null;
    commitment: "confirmed" | "finalized";
  },
): Promise<number | null> {
  const { data, error } = await db.rpc("record_deposit", {
    p_signature: deposit.signature,
    p_deposit_id: deposit.depositId,
    p_agent_id: deposit.agentId,
    p_mint: deposit.mint,
    p_amount_atomic: deposit.amountAtomic,
    p_amount_micros: deposit.amountMicros,
    p_rate_micros: deposit.rateMicros,
    p_slot: deposit.slot,
    p_commitment: deposit.commitment,
  });
  if (error) throw new Error(error.message);
  return data === null || data === undefined ? null : Number(data);
}

/** Reconciliation view: `GET /v1/receipts?since=`. */
export async function listReceipts(
  db: SupabaseClient,
  agentId: string,
  since?: string,
  limit = 200,
): Promise<
  Array<{
    receipt_id: string;
    call: string;
    beat_id: string;
    amount_micros: number;
    rail: string;
    settled_at: string;
  }>
> {
  let query = db
    .from("receipts")
    .select("receipt_id, call, beat_id, amount_micros, rail, settled_at")
    .eq("agent_id", agentId)
    .order("settled_at", { ascending: false })
    .limit(limit);
  if (since) query = query.gt("settled_at", since);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    receipt_id: row.receipt_id as string,
    call: row.call as string,
    beat_id: row.beat_id as string,
    amount_micros: Number(row.amount_micros),
    rail: row.rail as string,
    settled_at: row.settled_at as string,
  }));
}
