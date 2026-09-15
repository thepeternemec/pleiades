// GENERATED FILE — do not edit directly.
// Source of truth: packages/contracts + apps/{api,worker}/src.
// Regenerate with: npm run sync:supabase

import type { SupabaseClient } from "npm:@supabase/supabase-js@^2.45.4";
import {
  SOLANA_MAINNET,
  SOLANA_MINTS,
  TOKEN_DECIMALS,
  atomicToUi,
  buildSolanaPayUrl,
  creditsForTransfer,
  newReference,
  uiToAtomic,
  type DepositSymbol,
} from "../contracts/index.ts";
import { newDepositId } from "./agents.ts";

/**
 * Deposit intents — the "fund the meter" half of the payment rail.
 *
 * The row we create here is the whole contract with the customer: a reference
 * key, a mint, an amount and an expiry. The watcher later resolves that
 * reference on-chain and credits the balance exactly once.
 */

const DEFAULT_NETWORK = SOLANA_MAINNET;
const INTENT_TTL_MINUTES = 30;
export const MIN_DEPOSIT_MICROS = 1_000_000; // $1

export function networkFor(env?: string): string {
  return env?.trim() || DEFAULT_NETWORK;
}

export function mintFor(symbol: DepositSymbol, network: string): string {
  const table = SOLANA_MINTS[network as keyof typeof SOLANA_MINTS];
  if (!table) throw new Error(`unsupported network: ${network}`);
  const mint = table[symbol];
  if (mint === undefined) throw new Error(`unsupported symbol ${symbol} on ${network}`);
  return mint;
}

export interface CreateIntentResult {
  deposit_id: string;
  network: string;
  mint: string;
  symbol: DepositSymbol;
  amount_ui: string;
  amount_micros: number;
  reference: string;
  expires_at: string;
  state: "open";
}

/**
 * Create an intent for `agentId`. Fails loudly when the treasury is missing,
 * because an intent with nowhere to send funds is worse than an error.
 */
export async function createDepositIntent(
  db: SupabaseClient,
  input: {
    agentId: string;
    symbol: DepositSymbol;
    amountMicros: number;
    treasury: string;
    network?: string;
  },
): Promise<CreateIntentResult> {
  const network = input.network ?? DEFAULT_NETWORK;
  const mint = mintFor(input.symbol, network);
  const decimals = TOKEN_DECIMALS[input.symbol];

  // USD micros → whole tokens → atomic units. Deposits are always priced in
  // dollars; the token amount is what the wallet is asked to send.
  const wholeTokens = (input.amountMicros / 1_000_000).toString();
  const amountAtomic = uiToAtomic(wholeTokens, decimals);
  if (amountAtomic === null || amountAtomic <= 0n) {
    throw new Error("amount_micros is too small for this token's decimals");
  }
  const amountUi = atomicToUi(amountAtomic, decimals);

  const reference = newReference();
  const payUrl = buildSolanaPayUrl({
    recipient: input.treasury,
    amountUi,
    mint,
    reference,
    label: "Pleiades",
    message: "API credits",
  });
  if (!payUrl) throw new Error("treasury is not a valid Solana address");

  const depositId = newDepositId();
  const expiresAt = new Date(Date.now() + INTENT_TTL_MINUTES * 60_000).toISOString();

  const { error } = await db.from("deposit_intents").insert({
    deposit_id: depositId,
    agent_id: input.agentId,
    rail: "solana",
    network,
    mint,
    symbol: input.symbol,
    amount_ui: amountUi,
    reference,
    state: "open",
    expires_at: expiresAt,
  });
  if (error) throw new Error(error.message);

  return {
    deposit_id: depositId,
    network,
    mint,
    symbol: input.symbol,
    amount_ui: amountUi,
    amount_micros: input.amountMicros,
    reference,
    expires_at: expiresAt,
    state: "open",
  };
}

export async function getDepositIntent(db: SupabaseClient, depositId: string) {
  const { data, error } = await db
    .from("deposit_intents")
    .select("*")
    .eq("deposit_id", depositId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function listDepositIntents(db: SupabaseClient, agentId: string, limit = 50) {
  const { data, error } = await db
    .from("deposit_intents")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Resolve a reference key back to its intent. This is the watcher's entry
 * point: `reference` is the only identifier a transfer carries.
 */
/**
 * Every unresolved intent, oldest first. The deposit watcher walks this list
 * rather than a per-agent one, because a watcher does not know which agent is
 * about to pay — it only knows which references are still waiting.
 */
export async function listOpenIntents(db: SupabaseClient, limit = 250) {
  const { data, error } = await db
    .from("deposit_intents")
    .select("*")
    .eq("state", "open")
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Intents that are funded but not yet credited, for the reconciliation pass. */
export async function listPaidIntents(db: SupabaseClient, limit = 250) {
  const { data, error } = await db
    .from("deposit_intents")
    .select("*")
    .eq("state", "paid")
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function findIntentByReference(db: SupabaseClient, reference: string) {
  const { data, error } = await db
    .from("deposit_intents")
    .select("*")
    .eq("reference", reference)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function setIntentState(
  db: SupabaseClient,
  depositId: string,
  state: "open" | "paid" | "credited" | "expired" | "unmatched",
): Promise<void> {
  const { error } = await db
    .from("deposit_intents")
    .update({ state })
    .eq("deposit_id", depositId);
  if (error) throw new Error(error.message);
}

/** Credits owed for a transfer, at a recorded rate. */
export function creditsFor(
  symbol: DepositSymbol,
  amountAtomic: bigint,
  rateMicros: bigint,
): bigint {
  return creditsForTransfer(amountAtomic, TOKEN_DECIMALS[symbol], rateMicros);
}

/**
 * Shape a stored intent for the API. `pay_url` is rebuilt rather than stored,
 * so a treasury rotation does not strand intents that are still open, and so
 * the URL can never drift from the row.
 */
export function toPublicIntent(
  row: Record<string, unknown>,
  treasury: string,
): {
  deposit_id: string;
  rail: "solana";
  network: string;
  mint: string;
  symbol: string;
  amount_ui: string;
  reference: string;
  recipient: string;
  pay_url: string | null;
  expires_at: string;
  state: string;
  created_at: string;
} {
  const mint = String(row.mint ?? "");
  const amountUi = String(row.amount_ui ?? "0");
  return {
    deposit_id: String(row.deposit_id),
    rail: "solana",
    network: String(row.network),
    mint,
    symbol: String(row.symbol),
    amount_ui: amountUi,
    reference: String(row.reference),
    recipient: treasury,
    pay_url: buildSolanaPayUrl({
      recipient: treasury,
      amountUi,
      mint,
      reference: String(row.reference),
      label: "Pleiades",
      message: "API credits",
    }),
    expires_at: String(row.expires_at),
    state: String(row.state ?? "open"),
    created_at: String(row.created_at),
  };
}
