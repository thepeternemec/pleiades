import assert from "node:assert/strict";
import test from "node:test";
import {
  SOLANA_MAINNET,
  SOLANA_MINTS,
  atomicToUi,
  base58Decode,
  base58Encode,
  buildSolanaPayUrl,
  creditsForTransfer,
  isSolanaAddress,
  newReference,
  uiToAtomic,
  verifyDepositTransfer,
} from "./payments.js";

const TREASURY = "9xQeWvG816bUx9EPfMWpVv1FaT8Zb1tQXdJqZ9Yc4hKp";
const USDC = SOLANA_MINTS[SOLANA_MAINNET].USDC;

test("base58 round-trips and preserves leading zeros", () => {
  const bytes = Uint8Array.from([0, 0, 1, 2, 3, 250, 255]);
  const encoded = base58Encode(bytes);
  assert.equal(encoded.startsWith("11"), true, "leading zero bytes encode as 1s");
  assert.deepEqual(Array.from(base58Decode(encoded)!), Array.from(bytes));
});

test("a reference key is 32 bytes and decodes back to 32 bytes", () => {
  for (let i = 0; i < 50; i += 1) {
    const reference = newReference();
    assert.equal(isSolanaAddress(reference), true);
    assert.equal(base58Decode(reference)!.length, 32);
  }
});

test("address validation rejects near-miss typos, not just short strings", () => {
  assert.equal(isSolanaAddress(USDC), true);
  assert.equal(isSolanaAddress(TREASURY), true);
  // 'I' and 'l' are not in the base58 alphabet.
  assert.equal(isSolanaAddress(USDC.replace("E", "I")), false);
  assert.equal(isSolanaAddress(USDC.slice(0, 40)), false);
  assert.equal(isSolanaAddress(""), false);
  assert.equal(isSolanaAddress("not-an-address"), false);
});

test("atomic and UI amounts round-trip at both decimal widths", () => {
  assert.equal(atomicToUi(5_000_000n, 6), "5");
  assert.equal(atomicToUi(1_500_000n, 6), "1.5");
  assert.equal(atomicToUi(500n, 6), "0.0005");
  assert.equal(atomicToUi(1_500_000_000n, 9), "1.5");
  assert.equal(uiToAtomic("5", 6), 5_000_000n);
  assert.equal(uiToAtomic("1.5", 6), 1_500_000n);
  assert.equal(uiToAtomic("0.0005", 6), 500n);
  // More decimals than the mint supports, and scientific notation, are refused.
  assert.equal(uiToAtomic("1.0000001", 6), null);
  assert.equal(uiToAtomic("1e6", 6), null);
});

test("credits are priced off the recorded rate, not a live one", () => {
  // $1.00 per whole token, 5 USDC -> $5.00 in micros.
  assert.equal(creditsForTransfer(5_000_000n, 6, 1_000_000n), 5_000_000n);
  // $0.98 per token, 1 SOL (9 decimals) -> $0.98.
  assert.equal(creditsForTransfer(1_000_000_000n, 9, 980_000n), 980_000n);
});

test("Solana Pay URL matches the spec", () => {
  const url = buildSolanaPayUrl({
    recipient: TREASURY,
    amountUi: "5",
    mint: USDC,
    reference: newReference(),
    label: "Pleiades",
    message: "API credits",
  })!;
  assert.ok(url.startsWith(`solana:${TREASURY}?`));
  const params = new URLSearchParams(url.split("?")[1]);
  assert.equal(params.get("amount"), "5");
  assert.equal(params.get("spl-token"), USDC);
  assert.equal(params.get("label"), "Pleiades");
  assert.equal(params.get("message"), "API credits");
  assert.equal(isSolanaAddress(params.get("reference")!), true);
});

test("a native SOL request omits spl-token", () => {
  const url = buildSolanaPayUrl({
    recipient: TREASURY,
    amountUi: "0.25",
    mint: "",
    reference: newReference(),
  })!;
  assert.equal(url.includes("spl-token"), false);
});

test("a malformed pay URL is refused rather than returned", () => {
  const reference = newReference();
  assert.equal(
    buildSolanaPayUrl({ recipient: "nope", amountUi: "5", mint: USDC, reference }),
    null,
  );
  assert.equal(
    buildSolanaPayUrl({ recipient: TREASURY, amountUi: "5", mint: "bad-mint", reference }),
    null,
  );
  assert.equal(
    buildSolanaPayUrl({ recipient: TREASURY, amountUi: "5e3", mint: USDC, reference }),
    null,
  );
  assert.equal(
    buildSolanaPayUrl({ recipient: TREASURY, amountUi: "5", mint: USDC, reference: "short" }),
    null,
  );
});

// ── Deposit verification ─────────────────────────────────────────────
const reference = newReference();
const expected = {
  depositId: "dep_test",
  mint: USDC,
  reference,
  minAmountAtomic: 5_000_000n,
  state: "open" as const,
};
const observed = {
  signature: "sig1",
  recipient: TREASURY,
  mint: USDC,
  amountAtomic: 5_000_000n,
  reference,
  commitment: "confirmed" as const,
};

test("a clean transfer verifies", () => {
  const result = verifyDepositTransfer(observed, expected, { treasury: TREASURY });
  assert.deepEqual(result, { ok: true, amountAtomic: 5_000_000n });
});

test("overpayment verifies and credits the full amount received", () => {
  const result = verifyDepositTransfer(
    { ...observed, amountAtomic: 7_000_000n },
    expected,
    { treasury: TREASURY },
  );
  assert.deepEqual(result, { ok: true, amountAtomic: 7_000_000n });
});

test("a processed-but-unconfirmed transfer is not credited yet", () => {
  const result = verifyDepositTransfer(
    { ...observed, commitment: "processed" },
    expected,
    { treasury: TREASURY },
  );
  assert.deepEqual(result, { ok: false, reason: "not_confirmed" });
});

test("wrong recipient, wrong mint, wrong reference and underpayment all fail", () => {
  assert.deepEqual(
    verifyDepositTransfer({ ...observed, recipient: "11111111111111111111111111111112" }, expected, { treasury: TREASURY }),
    { ok: false, reason: "wrong_recipient" },
  );
  assert.deepEqual(
    verifyDepositTransfer({ ...observed, mint: SOLANA_MINTS[SOLANA_MAINNET].USDT }, expected, { treasury: TREASURY }),
    { ok: false, reason: "mint_mismatch" },
  );
  assert.deepEqual(
    verifyDepositTransfer({ ...observed, reference: newReference() }, expected, { treasury: TREASURY }),
    { ok: false, reason: "reference_mismatch" },
  );
  assert.deepEqual(
    verifyDepositTransfer({ ...observed, amountAtomic: 4_999_999n }, expected, { treasury: TREASURY }),
    { ok: false, reason: "underpaid" },
  );
});

test("an already-credited intent cannot be credited twice", () => {
  const result = verifyDepositTransfer(
    observed,
    { ...expected, state: "credited" },
    { treasury: TREASURY },
  );
  assert.deepEqual(result, { ok: false, reason: "already_credited" });
});
