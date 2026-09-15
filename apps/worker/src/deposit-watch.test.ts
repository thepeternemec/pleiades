import assert from "node:assert/strict";
import { test } from "node:test";
import { carriesReference, extractTransfers, atomicToBigInt, NATIVE_MINT } from "./solana/parse.js";
import { rateFor, wholeTokensToAtomic } from "./solana/watch.js";
import type { ParsedTransaction } from "./solana/rpc.js";

const REFERENCE = "7Yq3mQbK1sVpNcRfH2xWtZ9dLgUeA4nT6jPkM8vBsXo";
const TREASURY_ATA = "9xQeWvG816bUx9EPa2pQ8fLz5nH4sK7dM1cR3tY6bN2v";
const MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

function tx(instructions: unknown[], accountKeys: string[], err: unknown = null): ParsedTransaction {
  return {
    slot: 123,
    meta: { err },
    transaction: {
      message: {
        accountKeys: accountKeys.map((pubkey) => ({ pubkey })),
        instructions,
      },
    },
  } as unknown as ParsedTransaction;
}

const splTransfer = {
  program: "spl-token",
  programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  parsed: {
    type: "transferChecked",
    info: {
      source: "3nB1source",
      destination: TREASURY_ATA,
      authority: "5Kd2authority",
      tokenAmount: { amount: "5000000", decimals: 6, uiAmount: 5 },
      mint: MINT,
    },
  },
};

test("reads an SPL transferChecked with its mint and atomic amount", () => {
  const out = extractTransfers(tx([splTransfer], [REFERENCE, TREASURY_ATA]), "sig1");
  assert.equal(out.length, 1);
  assert.equal(out[0]?.destination, TREASURY_ATA);
  assert.equal(out[0]?.mint, MINT);
  assert.equal(out[0]?.amountAtomic, "5000000");
  assert.equal(out[0]?.failed, false);
});

test("reads a plain transfer, whose amount is not wrapped in tokenAmount", () => {
  const plain = {
    ...splTransfer,
    parsed: { type: "transfer", info: { destination: TREASURY_ATA, amount: "42" } },
  };
  assert.equal(extractTransfers(tx([plain], []), "sig2")[0]?.amountAtomic, "42");
});

test("reads a native SOL transfer with the empty mint sentinel", () => {
  const sol = {
    program: "system",
    parsed: { type: "transfer", info: { destination: "Treasury111", lamports: 1000000 } },
  };
  const out = extractTransfers(tx([sol], []), "sig3");
  assert.equal(out[0]?.mint, NATIVE_MINT);
  assert.equal(out[0]?.amountAtomic, "1000000");
});

test("ignores token instructions that are not transfers", () => {
  const approve = { program: "spl-token", parsed: { type: "approve", info: { amount: "5000000" } } };
  assert.equal(extractTransfers(tx([approve], []), "sig4").length, 0);
});

test("ignores transfers originating from another program", () => {
  const router = {
    program: "some-router",
    parsed: { type: "transfer", info: { destination: TREASURY_ATA, amount: "999" } },
  };
  assert.equal(extractTransfers(tx([router], []), "sig5").length, 0);
});

test("flags a failed transaction so it can never be credited", () => {
  const out = extractTransfers(tx([splTransfer], [], { InstructionError: [0, "Custom"] }), "sig6");
  assert.equal(out[0]?.failed, true);
});

test("treats a malformed amount as zero rather than throwing", () => {
  const bad = {
    ...splTransfer,
    parsed: { type: "transfer", info: { destination: TREASURY_ATA, amount: "not-a-number" } },
  };
  assert.equal(atomicToBigInt(extractTransfers(tx([bad], []), "sig7")[0]!.amountAtomic), 0n);
});

test("finds a reference carried as an account key", () => {
  assert.equal(carriesReference(tx([splTransfer], [REFERENCE, TREASURY_ATA]), REFERENCE), true);
});

test("finds a reference attached to the instruction", () => {
  const withRef = {
    ...splTransfer,
    parsed: { type: "transfer", info: { destination: TREASURY_ATA, amount: "1", reference: REFERENCE } },
  };
  assert.equal(carriesReference(tx([withRef], []), REFERENCE), true);
});

test("an unrelated payment without the reference is not claimed", () => {
  assert.equal(carriesReference(tx([splTransfer], [TREASURY_ATA]), REFERENCE), false);
});

test("stablecoins are pinned at par, so no oracle is needed", () => {
  assert.equal(rateFor("USDC"), 1_000_000n);
  assert.equal(rateFor("USDT"), 1_000_000n);
});

test("SOL without a configured rate returns null rather than guessing", () => {
  assert.equal(rateFor("SOL"), null);
  assert.equal(rateFor("SOL", 0n), null);
  assert.equal(rateFor("SOL", 150_000_000n), 150_000_000n);
});

test("whole tokens convert to atomic units without floating point", () => {
  assert.equal(wholeTokensToAtomic("5", "USDC"), "5000000");
  assert.equal(wholeTokensToAtomic("0.25", "USDC"), "250000");
  assert.equal(wholeTokensToAtomic("1", "SOL"), "1000000000");
  assert.equal(wholeTokensToAtomic("1.5", "SOL"), "1500000000");
});
