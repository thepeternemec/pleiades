/**
 * Deposit watcher entry point.
 *
 * Runs one pass and exits by default, so it suits a cron (Vercel Cron, GitHub
 * Actions, a systemd timer) or a Kubernetes Job. Pass --loop to keep it
 * resident instead.
 *
 * Refuses to start unless a treasury and an RPC endpoint are configured, and
 * says exactly which one is missing rather than failing obscurely later.
 */

import { createSupabaseClient, env } from "@pleiades/db";
import { SolanaRpc } from "./solana/rpc.js";
import { watchDeposits } from "./solana/watch.js";

const DEFAULT_RPC = "https://api.mainnet-beta.solana.com";

function requireEnv(name: string): string {
  const value = env(name);
  if (!value) {
    console.error(
      `missing ${name}.\n` +
        (name === "PLEIADES_TREASURY"
          ? "  Set it to the wallet that receives deposits. It must be a native account,\n" +
            "  never a token account (ATA) — a transfer names the ATA, and the watcher\n" +
            "  resolves it back to its owner."
          : "  Point it at a dedicated RPC provider. The public endpoint rate-limits\n" +
            "  long before a production polling loop is comfortable."),
    );
    process.exit(2);
  }
  return value;
}

async function main(): Promise<void> {
  const db = createSupabaseClient();
  if (!db) {
    console.error("missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
    process.exit(2);
  }

  const treasury = requireEnv("PLEIADES_TREASURY");
  const rpcUrl = env("SOLANA_RPC_URL") ?? DEFAULT_RPC;
  if (rpcUrl === DEFAULT_RPC) {
    console.warn(
      "warning: using the public Solana RPC. It will rate-limit a production loop — " +
        "set SOLANA_RPC_URL to a provider key.",
    );
  }

  const solRate = env("PLEIADES_SOL_RATE_MICROS");
  const rpc = new SolanaRpc(rpcUrl);
  const loop = process.argv.includes("--loop");
  const intervalMs = Number(env("PLEIADES_WATCH_INTERVAL_MS") ?? 30_000);

  const run = async () => {
    const summary = await watchDeposits({
      db,
      rpc,
      treasury,
      solRateMicros: solRate ? BigInt(solRate) : undefined,
      log: (line) => console.log(line),
    });
    console.log(
      `[${new Date().toISOString()}] scanned=${summary.scanned} credited=${summary.credited} ` +
        `unmatched=${summary.unmatched} expired=${summary.expired} skipped=${summary.skipped}` +
        (summary.errors.length ? ` errors=${summary.errors.length}` : ""),
    );
    for (const error of summary.errors) console.error("  error:", error);
    return summary;
  };

  if (!loop) {
    const summary = await run();
    process.exit(summary.errors.length > 0 ? 1 : 0);
  }

  for (;;) {
    try {
      await run();
    } catch (cause) {
      console.error("pass failed:", (cause as Error).message);
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

main().catch((cause) => {
  console.error(cause);
  process.exit(1);
});
