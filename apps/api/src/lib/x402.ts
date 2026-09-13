import { SOLANA_MAINNET, SOLANA_MINTS } from "@pleiades/contracts";

/**
 * x402 challenge.
 *
 * When a request arrives without a usable credential, the API answers 402 with
 * a quote for that exact resource: scheme, network, asset, amount and where to
 * send it. The client pays on Solana and retries the identical request.
 *
 * The shape mirrors the x402 SVM `exact` scheme (fixed-amount USDC SPL
 * transfer, settled by a facilitator that also pays the network fee).
 */

export interface X402ChallengeInput {
  /** e.g. "POST /v1/poll". Part of the quote, so a payment cannot be replayed. */
  resource: string;
  amountMicros: number;
  /** The treasury that receives. Null when the rail is not configured yet. */
  payTo: string | null;
  network?: string;
  description?: string;
}

export interface X402Challenge {
  x402Version: 2;
  error: "payment_required";
  /**
   * "facilitator" once a treasury and facilitator are configured; otherwise
   * "unavailable", so a client can tell a wired rail from an unwired one rather
   * than signing a transfer to nowhere.
   */
  settlement: "facilitator" | "unavailable";
  accepts: Array<{
    scheme: "exact";
    network: string;
    asset: string;
    pay_to: string | null;
    max_amount_required: string;
    resource: string;
    description: string;
    mimeType: string;
  }>;
}

export function x402Challenge(input: X402ChallengeInput): X402Challenge {
  const network = input.network ?? SOLANA_MAINNET;
  const table = SOLANA_MINTS[network as keyof typeof SOLANA_MINTS];
  const asset = table?.USDC ?? "";

  return {
    x402Version: 2,
    error: "payment_required",
    settlement: input.payTo ? "facilitator" : "unavailable",
    accepts: [
      {
        scheme: "exact",
        network,
        asset,
        pay_to: input.payTo,
        max_amount_required: String(input.amountMicros),
        resource: input.resource,
        description: input.description ?? "Metered Pleiades API call.",
        mimeType: "application/json",
      },
    ],
  };
}
