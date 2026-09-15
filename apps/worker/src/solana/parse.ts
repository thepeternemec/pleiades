/**
 * Turning a parsed Solana transaction into a transfer we can verify.
 *
 * Kept pure and separate from the RPC so the rules below are unit-testable
 * against fixture transactions rather than a live chain.
 */

import type { ParsedTransaction } from "./rpc.js";

/** Mint sentinel for native SOL, matching ObservedTransfer.mint. */
export const NATIVE_MINT = "";

export interface RawTransfer {
  signature: string;
  slot: number;
  /** For SPL this is the token account; for SOL it is the recipient wallet. */
  destination: string;
  /** "" for native SOL. */
  mint: string;
  /** Atomic units, as the node reported them. */
  amountAtomic: string;
  failed: boolean;
}

const SPL_TOKEN_PROGRAMS = new Set([
  "spl-token",
  "spl-token-2022",
]);

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * Numeric fields arrive inconsistently: SPL amounts are strings, native
 * `lamports` is a JSON number. Coercing only strings silently read a SOL
 * transfer as zero, which then failed verification as `underpaid`.
 */
function asAmount(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

/**
 * Pull every transfer out of a transaction.
 *
 * Only direct instructions are considered. A transfer nested inside an inner
 * instruction is a program-mediated one (a swap, a router, an exchange
 * withdrawal) and crediting it on the strength of an app-supplied reference
 * would be crediting a payment nobody addressed to us.
 */
export function extractTransfers(tx: ParsedTransaction, signature: string): RawTransfer[] {
  const failed = tx.meta?.err != null;
  const transfers: RawTransfer[] = [];

  for (const ix of tx.transaction?.message?.instructions ?? []) {
    const type = ix.parsed?.type;
    const info = ix.parsed?.info ?? {};

    if (SPL_TOKEN_PROGRAMS.has(ix.program ?? "")) {
      if (type !== "transfer" && type !== "transferChecked") continue;
      const amount =
        type === "transferChecked"
          ? asString((info.tokenAmount as { amount?: string } | undefined)?.amount)
          : asString(info.amount);
      transfers.push({
        signature,
        slot: tx.slot,
        destination: asString(info.destination),
        mint: asString(info.mint),
        amountAtomic: amount || "0",
        failed,
      });
      continue;
    }

    if (ix.program === "system" && type === "transfer") {
      transfers.push({
        signature,
        slot: tx.slot,
        destination: asString(info.destination),
        mint: NATIVE_MINT,
        amountAtomic: asAmount(info.lamports) || "0",
        failed,
      });
    }
  }

  return transfers;
}

/**
 * Mark which transfers actually carry a given reference key.
 *
 * Solana Pay appends the reference as a read-only, non-signer account to the
 * transaction's account list rather than inside the instruction, so it is
 * checked against accountKeys and not against `info`.
 */
export function carriesReference(tx: ParsedTransaction, reference: string): boolean {
  const keys = tx.transaction?.message?.accountKeys ?? [];
  if (keys.some((k) => k.pubkey === reference)) return true;
  // Some wallets attach it to the instruction instead; accept either.
  return (tx.transaction?.message?.instructions ?? []).some(
    (ix) => asString(ix.parsed?.info?.reference) === reference,
  );
}

/** Atomic → whole tokens, without floating point. */
export function atomicToBigInt(amountAtomic: string): bigint {
  try {
    return BigInt(amountAtomic);
  } catch {
    return 0n;
  }
}
