/**
 * A minimal Solana JSON-RPC client.
 *
 * Deliberately dependency-free: `getTransaction` with `encoding: "jsonParsed"`
 * returns transfer instructions already decoded by the node, including the
 * mint, amount and destination of SPL transfers. That removes the need for
 * web3.js and spl-token in what is otherwise a five-method client.
 */

export type Commitment = "processed" | "confirmed" | "finalized";

export interface SignatureInfo {
  signature: string;
  slot: number;
  err: unknown | null;
  blockTime: number | null;
  memo: string | null;
}

export interface ParsedInstruction {
  program?: string;
  programId?: string;
  parsed?: { type?: string; info?: Record<string, unknown> };
}

export interface ParsedTransaction {
  slot: number;
  meta: { err: unknown | null } | null;
  transaction: {
    message: {
      accountKeys: Array<{ pubkey: string }>;
      instructions: ParsedInstruction[];
    };
  };
}

export class SolanaRpcError extends Error {
  constructor(
    message: string,
    readonly method: string,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "SolanaRpcError";
  }
}

export class SolanaRpc {
  private id = 0;

  constructor(
    private readonly url: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private async call<T>(method: string, params: unknown[]): Promise<T> {
    let lastError: Error | undefined;
    // Three attempts with backoff. Public RPC endpoints rate-limit aggressively,
    // and a watcher that dies on one 429 will silently stop crediting deposits.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 250 * 2 ** attempt));
      let res: Response;
      try {
        res = await this.fetchImpl(this.url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: ++this.id, method, params }),
        });
      } catch (cause) {
        lastError = new SolanaRpcError(String(cause), method, true);
        continue;
      }
      if (res.status === 429 || res.status >= 500) {
        lastError = new SolanaRpcError(`HTTP ${res.status}`, method, true);
        continue;
      }
      if (!res.ok) throw new SolanaRpcError(`HTTP ${res.status}`, method, false);

      const body = (await res.json()) as { result?: T; error?: { message: string } };
      if (body.error) {
        // A node that does not know a signature yet is not a hard failure.
        const retryable = /not found|not available|rate|timeout/i.test(body.error.message);
        lastError = new SolanaRpcError(body.error.message, method, retryable);
        if (!retryable) throw lastError;
        continue;
      }
      return body.result as T;
    }
    throw lastError ?? new SolanaRpcError("unknown RPC failure", method, false);
  }

  /** Signatures touching an address, newest first. */
  getSignaturesForAddress(
    address: string,
    options: { limit?: number; before?: string; until?: string } = {},
  ): Promise<SignatureInfo[]> {
    return this.call<SignatureInfo[]>("getSignaturesForAddress", [
      address,
      {
        limit: options.limit ?? 25,
        ...(options.before ? { before: options.before } : {}),
        ...(options.until ? { until: options.until } : {}),
        commitment: "confirmed",
      },
    ]);
  }

  getTransaction(signature: string): Promise<ParsedTransaction | null> {
    return this.call<ParsedTransaction | null>("getTransaction", [
      signature,
      { encoding: "jsonParsed", maxSupportedTransactionVersion: 0, commitment: "confirmed" },
    ]);
  }

  /**
   * The owner of a token account. Needed because a Solana Pay transfer names
   * the sender's and recipient's *token accounts*, not their wallets, so
   * "did this reach the treasury" is a question about the account's owner.
   */
  async getTokenAccountOwner(account: string): Promise<string | null> {
    const info = await this.call<{
      value: { data?: { parsed?: { info?: { owner?: string } } } } | null;
    }>("getAccountInfo", [account, { encoding: "jsonParsed", commitment: "confirmed" }]);
    return info?.value?.data?.parsed?.info?.owner ?? null;
  }
}
