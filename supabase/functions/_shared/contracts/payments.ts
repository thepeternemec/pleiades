// GENERATED FILE — do not edit directly.
// Source of truth: packages/contracts + apps/{api,worker}/src.
// Regenerate with: npm run sync:supabase

import { z } from "npm:zod@^3.24.1";

/**
 * Solana payment contracts.
 *
 * The deposit flow is a Solana Pay transfer request
 * (https://docs.solanapay.com/spec#specification-transfer-request):
 *
 *   solana:<recipient>?amount=&spl-token=&reference=&label=&message=&memo=
 *
 * `reference` is the reconciliation key. It is a base58 32-byte value that the
 * wallet attaches to the transfer as a read-only account; validators index
 * transactions by account keys, so `getSignaturesForAddress(reference)` finds
 * exactly the payment for one intent.
 */

// ── Networks and assets ──────────────────────────────────────────────
export const SOLANA_MAINNET = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";
export const SOLANA_DEVNET = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1";

export const SOLANA_NETWORKS = [SOLANA_MAINNET, SOLANA_DEVNET] as const;

/** Verified mints. Never add an address here without checking it on-chain. */
export const SOLANA_MINTS = {
  [SOLANA_MAINNET]: {
    USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    /** Native SOL has no mint; the transfer is a SystemProgram transfer. */
    SOL: "",
  },
  [SOLANA_DEVNET]: {
    USDC: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    USDT: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    SOL: "",
  },
} as const;

export const TOKEN_DECIMALS: Record<"USDC" | "USDT" | "SOL", number> = {
  USDC: 6,
  USDT: 6,
  SOL: 9,
};

export const DepositSymbolSchema = z.enum(["USDC", "USDT", "SOL"]);
export type DepositSymbol = z.infer<typeof DepositSymbolSchema>;

// ── base58 ───────────────────────────────────────────────────────────
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/** Encode bytes as base58 (the Solana alphabet, no padding). */
export function base58Encode(bytes: Uint8Array): string {
  if (bytes.length === 0) return "";
  const digits: number[] = [0];
  for (const byte of bytes) {
    let carry = byte;
    for (let i = 0; i < digits.length; i += 1) {
      carry += (digits[i] ?? 0) << 8;
      digits[i] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let out = "";
  for (const byte of bytes) {
    if (byte !== 0) break;
    out += B58.charAt(0);
  }
  for (let i = digits.length - 1; i >= 0; i -= 1) out += B58.charAt(digits[i] ?? 0);
  return out;
}

/** Decode base58 back to bytes. Returns null on any invalid character. */
export function base58Decode(value: string): Uint8Array | null {
  if (value.length === 0) return null;
  const bytes: number[] = [0];
  for (const char of value) {
    const index = B58.indexOf(char);
    if (index < 0) return null;
    let carry = index;
    for (let i = 0; i < bytes.length; i += 1) {
      carry += (bytes[i] ?? 0) * 58;
      bytes[i] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (const char of value) {
    if (char !== B58.charAt(0)) break;
    bytes.push(0);
  }
  return Uint8Array.from(bytes.reverse());
}

/**
 * A Solana public key is exactly 32 bytes once decoded. Checking the decoded
 * length rather than the string length rejects the near-miss typos that a
 * character-range check lets through.
 */
export function isSolanaAddress(value: string): boolean {
  if (typeof value !== "string" || value.length < 32 || value.length > 44) return false;
  const bytes = base58Decode(value);
  return bytes !== null && bytes.length === 32;
}

/** Generate a fresh 32-byte reference key for a deposit intent. */
export function newReference(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base58Encode(bytes);
}

// ── Amounts ──────────────────────────────────────────────────────────
/** Format atomic units as a UI decimal string (Solana Pay wants `5`, not `5000000`). */
export function atomicToUi(amountAtomic: bigint, decimals: number): string {
  const negative = amountAtomic < 0n;
  const value = negative ? -amountAtomic : amountAtomic;
  const base = 10n ** BigInt(decimals);
  const whole = value / base;
  const fraction = (value % base).toString().padStart(decimals, "0").replace(/0+$/, "");
  const out = fraction ? `${whole}.${fraction}` : `${whole}`;
  return negative ? `-${out}` : out;
}

/** Parse a UI decimal string into atomic units. Rejects scientific notation. */
export function uiToAtomic(amountUi: string, decimals: number): bigint | null {
  if (!/^\d+(\.\d+)?$/.test(amountUi)) return null;
  const [whole = "0", fraction = ""] = amountUi.split(".");
  if (fraction.length > decimals) return null;
  const padded = fraction.padEnd(decimals, "0");
  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(padded || "0");
}

/**
 * USD micros credited for a transfer, given a rate of USD micros per whole
 * token. Rates are recorded on the deposit row so history never re-prices.
 */
export function creditsForTransfer(
  amountAtomic: bigint,
  decimals: number,
  rateMicros: bigint,
): bigint {
  const scale = 10n ** BigInt(decimals);
  return (amountAtomic * rateMicros) / scale;
}

// ── Solana Pay ───────────────────────────────────────────────────────
export interface SolanaPayRequest {
  recipient: string;
  amountUi: string;
  /** Omit or pass "" for a native SOL transfer. */
  mint?: string;
  reference: string;
  label?: string;
  message?: string;
  memo?: string;
}

/**
 * Build a Solana Pay transfer request URL.
 *
 * Returns null when the recipient or reference is not a valid base58 address,
 * or the amount is malformed — a bad URL sends customer funds nowhere, so this
 * refuses rather than guesses.
 */
export function buildSolanaPayUrl(request: SolanaPayRequest): string | null {
  const { recipient, amountUi, mint, reference, label, message, memo } = request;
  if (!isSolanaAddress(recipient)) return null;
  if (!isSolanaAddress(reference)) return null;
  if (!/^\d+(\.\d+)?$/.test(amountUi)) return null;
  if (mint && !isSolanaAddress(mint)) return null;

  const params = new URLSearchParams();
  params.set("amount", amountUi);
  if (mint) params.set("spl-token", mint);
  params.set("reference", reference);
  if (label) params.set("label", label);
  if (message) params.set("message", message);
  if (memo) params.set("memo", memo);

  return `solana:${recipient}?${params.toString()}`;
}

// ── Deposit API shapes ───────────────────────────────────────────────
export const DepositRequestSchema = z.object({
  amount_ui: z
    .string()
    .regex(/^\d+(\.\d+)?$/, "amount_ui must be a decimal string")
    .optional(),
  symbol: DepositSymbolSchema.optional(),
  /** Convenience: create the intent for $1 by default. */
  amount_micros: z.number().int().positive().optional(),
});
export type DepositRequest = z.infer<typeof DepositRequestSchema>;

export const DepositIntentSchema = z.object({
  deposit_id: z.string(),
  rail: z.literal("solana"),
  network: z.string(),
  mint: z.string(),
  symbol: z.string(),
  amount_ui: z.string(),
  amount_micros: z.number().int(),
  reference: z.string(),
  recipient: z.string(),
  pay_url: z.string(),
  expires_at: z.string(),
  state: z.enum(["open", "paid", "credited", "expired", "unmatched"]),
  created_at: z.string(),
});
export type DepositIntent = z.infer<typeof DepositIntentSchema>;

export const BalanceResponseSchema = z.object({
  agent_id: z.string(),
  balance_micros: z.number().int(),
  currency: z.literal("USD"),
  unit: z.literal("micros"),
  today: z.object({
    calls: z.number().int(),
    micros: z.number().int(),
    beats: z.number().int(),
  }),
  caps: z.object({
    daily_cap_micros: z.number().int(),
    daily_beat_cap: z.number().int(),
  }),
  low_balance: z.boolean(),
});
export type BalanceResponse = z.infer<typeof BalanceResponseSchema>;

// ── Errors ───────────────────────────────────────────────────────────
/** Map a charge_call reason onto the API error code. */
export const CHARGE_REASONS = {
  invalid_credential: "invalid_credential",
  blocked: "blocked",
  daily_cap: "daily_cap",
  beat_cap: "beat_cap",
  insufficient_balance: "insufficient_balance",
} as const;
export type ChargeReason = keyof typeof CHARGE_REASONS;

// ── Deposit verification ─────────────────────────────────────────────
/**
 * A transfer as read back from the chain. `recipient` is the owner of the
 * destination token account (or the treasury itself for native SOL), which is
 * what a Solana Pay transfer request names — never the token account address.
 */
export interface ObservedTransfer {
  signature: string;
  recipient: string;
  /** "" for native SOL. */
  mint: string;
  amountAtomic: bigint;
  reference: string | null;
  commitment: "processed" | "confirmed" | "finalized";
}

export interface DepositExpectation {
  depositId: string;
  mint: string;
  reference: string;
  minAmountAtomic: bigint;
  state: "open" | "paid" | "credited" | "expired" | "unmatched";
}

export type VerifyFailure =
  | "already_credited"
  | "not_confirmed"
  | "wrong_recipient"
  | "mint_mismatch"
  | "reference_mismatch"
  | "underpaid";

export type VerifyResult =
  | { ok: true; amountAtomic: bigint }
  | { ok: false; reason: VerifyFailure };

/**
 * Decide whether an observed transfer satisfies a deposit intent.
 *
 * Deliberately strict, and ordered so the cheapest checks run first. Anything
 * that fails lands in the unmatched bucket for manual review — it is never
 * silently credited, because a wrong-mint transfer cannot be reversed by us.
 *
 * Confirmation is required because a `processed` transaction can still be
 * dropped; the deposit is credited at `confirmed` and promoted to `finalized`
 * by the reconciliation sweep.
 */
export function verifyDepositTransfer(
  observed: ObservedTransfer,
  expected: DepositExpectation,
  options: { treasury: string; minCommitment?: "confirmed" | "finalized" },
): VerifyResult {
  const minCommitment = options.minCommitment ?? "confirmed";
  const rank = (value: ObservedTransfer["commitment"]): number =>
    value === "finalized" ? 2 : value === "confirmed" ? 1 : 0;

  if (expected.state === "credited") return { ok: false, reason: "already_credited" };
  if (rank(observed.commitment) < rank(minCommitment)) {
    return { ok: false, reason: "not_confirmed" };
  }
  if (observed.recipient !== options.treasury) {
    return { ok: false, reason: "wrong_recipient" };
  }
  if (observed.mint !== expected.mint) return { ok: false, reason: "mint_mismatch" };
  if (observed.reference !== expected.reference) {
    return { ok: false, reason: "reference_mismatch" };
  }
  if (observed.amountAtomic < expected.minAmountAtomic) {
    return { ok: false, reason: "underpaid" };
  }
  return { ok: true, amountAtomic: observed.amountAtomic };
}
