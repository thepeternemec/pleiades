/**
 * The deposit watcher.
 *
 * This is the piece that was missing: `POST /v1/deposits` could hand out a
 * payment instruction and `record_deposit` could credit one, but nothing ever
 * read the chain in between. A deposit intent sat open forever.
 *
 * It never trusts the transfer's own claims. Every candidate goes through
 * `verifyDepositTransfer`, which re-checks recipient, mint, reference, amount
 * and confirmation, and anything that fails is left alone rather than
 * credited — a wrong-mint transfer cannot be reversed by us.
 */

import {
  verifyDepositTransfer,
  atomicToUi,
  type DepositExpectation,
  type DepositSymbol,
  type ObservedTransfer,
} from "@pleiades/contracts";
import {
  creditDeposit,
  creditsFor,
  listOpenIntents,
  setIntentState,
  type SupabaseClient,
} from "@pleiades/db";
import { SolanaRpc, SolanaRpcError } from "./rpc.js";
import { atomicToBigInt, carriesReference, extractTransfers, NATIVE_MINT } from "./parse.js";

/** One whole USDC or USDT is one dollar, exactly. No oracle required. */
const STABLE_RATE_MICROS = 1_000_000n;

const MAX_SAFE_ATOMIC = BigInt(Number.MAX_SAFE_INTEGER);

/**
 * USD micros per whole token.
 *
 * Stablecoins are pinned at par. SOL needs a price, and rather than guess at
 * one we return null — the intent is then left for a human, which is the only
 * honest option when the amount credited would depend on a made-up number.
 */
export function rateFor(symbol: DepositSymbol, solRateMicros?: bigint): bigint | null {
  if (symbol === "USDC" || symbol === "USDT") return STABLE_RATE_MICROS;
  if (!solRateMicros || solRateMicros <= 0n) return null;
  return solRateMicros;
}

export interface WatchSummary {
  scanned: number;
  credited: number;
  unmatched: number;
  expired: number;
  skipped: number;
  errors: string[];
}

export interface WatchOptions {
  db: SupabaseClient;
  rpc: SolanaRpc;
  treasury: string;
  solRateMicros?: bigint;
  now?: () => Date;
  log?: (line: string) => void;
  /** Cap on intents examined in one pass. */
  limit?: number;
}

interface IntentRow {
  deposit_id: string;
  agent_id: string;
  symbol: DepositSymbol;
  mint: string;
  reference: string;
  amount_ui: string;
  state: string;
  expires_at: string | null;
}

export async function watchDeposits(options: WatchOptions): Promise<WatchSummary> {
  const { db, rpc, treasury } = options;
  const log = options.log ?? (() => {});
  const now = options.now ?? (() => new Date());
  const summary: WatchSummary = {
    scanned: 0,
    credited: 0,
    unmatched: 0,
    expired: 0,
    skipped: 0,
    errors: [],
  };

  const rows = (await listOpenIntents(db, options.limit ?? 250)) as IntentRow[];
  summary.scanned = rows.length;
  if (rows.length === 0) return summary;

  for (const row of rows) {
    // An expired intent is not deleted — a late payment can still be
    // reconciled by hand, and silently forgetting it would be worse.
    if (row.expires_at && new Date(row.expires_at) < now()) {
      await setIntentState(db, row.deposit_id, "expired");
      summary.expired += 1;
      continue;
    }

    const rate = rateFor(row.symbol, options.solRateMicros);
    if (rate === null) {
      log(`skip ${row.deposit_id}: no USD rate configured for ${row.symbol}`);
      summary.skipped += 1;
      continue;
    }

    let signatures;
    try {
      signatures = await rpc.getSignaturesForAddress(row.reference, { limit: 25 });
    } catch (cause) {
      summary.errors.push(`${row.deposit_id}: ${(cause as Error).message}`);
      continue;
    }

    // Oldest first, so the first payment that satisfies the intent wins.
    for (const entry of signatures.slice().reverse()) {
      if (entry.err) continue;

      let tx;
      try {
        tx = await rpc.getTransaction(entry.signature);
      } catch (cause) {
        summary.errors.push(`${entry.signature}: ${(cause as Error).message}`);
        continue;
      }
      if (!tx) continue;
      if (!carriesReference(tx, row.reference)) continue;

      for (const transfer of extractTransfers(tx, entry.signature)) {
        if (transfer.failed) continue;

        const recipient =
          transfer.mint === NATIVE_MINT
            ? transfer.destination
            : await resolveOwner(rpc, transfer.destination, summary);
        if (!recipient) continue;

        const observed: ObservedTransfer = {
          signature: transfer.signature,
          recipient,
          mint: transfer.mint,
          amountAtomic: atomicToBigInt(transfer.amountAtomic),
          reference: row.reference,
          commitment: "confirmed",
        };

        const expectation: DepositExpectation = {
          depositId: row.deposit_id,
          mint: row.mint,
          reference: row.reference,
          minAmountAtomic: atomicToBigInt(
            // tokens → atomic, integer-only: amount_ui has the token's decimals
            wholeTokensToAtomic(row.amount_ui, row.symbol),
          ),
          state: "open",
        };

        const verdict = verifyDepositTransfer(observed, expectation, { treasury });
        if (!verdict.ok) {
          if (verdict.reason !== "underpaid" && verdict.reason !== "not_confirmed") {
            log(`unmatched ${row.deposit_id}: ${verdict.reason} (${entry.signature.slice(0, 12)}…)`);
            await setIntentState(db, row.deposit_id, "unmatched");
            summary.unmatched += 1;
          }
          continue;
        }

        if (verdict.amountAtomic > MAX_SAFE_ATOMIC) {
          summary.errors.push(`${entry.signature}: amount exceeds safe integer range`);
          continue;
        }

        const amountMicros = creditsFor(row.symbol, verdict.amountAtomic, rate);
        try {
          const credited = await creditDeposit(db, {
            signature: entry.signature,
            depositId: row.deposit_id,
            agentId: row.agent_id,
            mint: row.mint,
            amountAtomic: Number(verdict.amountAtomic),
            amountMicros: Number(amountMicros),
            rateMicros: Number(rate),
            slot: tx.slot,
            commitment: "confirmed",
          });
          // null means this signature was already recorded — the credit is in,
          // so the intent is settled either way.
          await setIntentState(db, row.deposit_id, "credited");
          summary.credited += 1;
          log(
            credited === null
              ? `already credited ${row.deposit_id}`
              : `credited ${row.deposit_id}: $${(amountMicros / 1_000_000n).toString()} ` +
                  `(${atomicToUi(verdict.amountAtomic, row.symbol === "SOL" ? 9 : 6)} ${row.symbol})`,
          );
        } catch (cause) {
          summary.errors.push(`${entry.signature}: ${(cause as Error).message}`);
        }
        break;
      }
    }
  }

  return summary;
}

async function resolveOwner(
  rpc: SolanaRpc,
  tokenAccount: string,
  summary: WatchSummary,
): Promise<string | null> {
  try {
    return await rpc.getTokenAccountOwner(tokenAccount);
  } catch (cause) {
    if (cause instanceof SolanaRpcError && !cause.retryable) {
      summary.errors.push(`${tokenAccount}: ${cause.message}`);
    }
    return null;
  }
}

/** Whole tokens ("5", "0.25") to atomic units, without floating point. */
export function wholeTokensToAtomic(amountUi: string, symbol: DepositSymbol): string {
  const decimals = symbol === "SOL" ? 9 : 6;
  const [whole = "0", fraction = ""] = amountUi.split(".");
  const padded = (fraction + "0".repeat(decimals)).slice(0, decimals);
  return `${whole}${padded}`.replace(/^0+(?=\d)/, "");
}
