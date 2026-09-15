#!/usr/bin/env node
/**
 * Issue an API key.
 *
 * Access is operator-granted while self-serve billing is built, so this is the
 * one command that stands in for a signup form. The secret is printed once and
 * never stored — only its hash is written — so if it is lost, issue another.
 *
 *   node scripts/create-agent.mjs "acme desk"
 *   node scripts/create-agent.mjs "acme desk" --credit 5
 */
import { createSupabaseClient, createAgent, creditDeposit } from "@pleiades/db";

const args = process.argv.slice(2);
const label = args.find((a) => !a.startsWith("--"));
const creditIndex = args.indexOf("--credit");
const creditUsd = creditIndex >= 0 ? Number(args[creditIndex + 1]) : 0;

if (!label) {
  console.error('usage: node scripts/create-agent.mjs "<label>" [--credit <usd>]');
  process.exit(2);
}
if (creditIndex >= 0 && (!Number.isFinite(creditUsd) || creditUsd <= 0)) {
  console.error("--credit must be a positive number of dollars");
  process.exit(2);
}

const db = createSupabaseClient();
if (!db) {
  console.error("missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(2);
}

const { agentId, secret } = await createAgent(db, label);

if (creditUsd > 0) {
  const micros = Math.round(creditUsd * 1_000_000);
  // A manual grant is recorded as a deposit so it lands in the same ledger and
  // produces a receipt, rather than appearing as an unexplained balance.
  await creditDeposit(db, {
    signature: `manual:${agentId}:${Date.now()}`,
    depositId: `manual_${agentId}`,
    agentId,
    mint: "manual",
    amountAtomic: micros,
    amountMicros: micros,
    rateMicros: 1_000_000,
    slot: null,
    commitment: "confirmed",
  });
}

console.log(`agent_id  ${agentId}`);
console.log(`api_key   ${secret}`);
console.log("");
console.log("Store the key now: only its hash is written, so it cannot be shown again.");
if (creditUsd > 0) console.log(`Credited $${creditUsd.toFixed(2)} as a manual deposit.`);
