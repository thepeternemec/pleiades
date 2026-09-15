# The stablecoin rail

Status: **built, not switched on.** One optional way to fund a balance, alongside card and
invoice. It is documented in full because it is the most involved rail to get right, not because
it is the product.

This is a payment rail, not a positioning statement: Pleiades is a news layer for agents, and how
a customer funds their balance is an implementation detail of the metered ledger.

---

## 0. What is built, and what is not

| | Status |
|---|---|
| `agents`, `api_keys` — identity, hashed credentials | **built** (`0008_metering.sql`) |
| `ledgers`, `receipts` — balance and an append-only receipt per call | **built**, previously unused |
| `charge_call()` — caps, debit, receipt and counters in one transaction | **built** |
| `credit_balance()`, `record_deposit()` — credit, once per signature | **built** |
| `GET /v1/balance`, `GET /v1/receipts?since=` | **built** |
| `GET /v1/tokens` — accepted mints, decimals, settlement state | **built** |
| `POST/GET /v1/deposits` — intent, Solana Pay URL, reference key | **built**; returns `unsupported_rail` until a treasury is set |
| x402 challenge on an uncredentialed call | **built** (`402` with the quote for that resource) |
| Deposit watcher (Helius webhook + polling sweep) | **not yet** — needs RPC + treasury |
| x402 settlement (facilitator verify + settle) | **not yet** |
| `resolve`, `brief`, `watch` verbs | **not yet** |

### Turning the meter on

```
PLEIADES_METERING=on        # default "off"
PLEIADES_TREASURY=<base58>  # a native SOL account, never an ATA
```

Metering is off by default on purpose. Switching it on makes every anonymous call a
`402` and every caller without a key unable to read a pack, so it should be a
deliberate act, not a side effect of a deploy.

### Creating the first key

There is no signup endpoint yet. Operator-granted access, as the site says:

```js
import { createSupabaseClient, createAgent } from "@pleiades/db";
const { agentId, secret } = await createAgent(createSupabaseClient()!, "first agent");
console.log(secret); // shown once — only its SHA-256 is stored
```

---

## 1. The shape of the thing

Two very different money movements, deliberately handled by different machinery:

| | On-chain | Off-chain |
|---|---|---|
| **What** | the deposit | every API call |
| **Frequency** | a handful per customer | thousands per day |
| **Rail** | Solana (USDC / USDT / SOL / PLD) | ledger in Postgres |
| **Cost** | ~0.000005 SOL fee | zero |
| **Proof** | transaction signature | `receipt_id` |

The invariant that makes this work: **the chain settles the deposit, not the call.**
A `poll` that returns `moved:false` costs $0.0005. Settling that on-chain would cost
more in fee and latency than the call is worth, and would force a wallet signature per
wake-up. So calls draw against a prepaid balance and every call writes a receipt.

This is the same conclusion x402 reaches — its SVM implementation funds a balance and
settles periodically rather than per request.

---

## 2. Deposit flow

```
customer                    pleiades                        solana
   │                            │                              │
   │  POST /v1/deposits         │                              │
   │  { amount, symbol }        │                              │
   ├───────────────────────────>│                              │
   │                            │ create intent                │
   │                            │ mint a fresh reference key   │
   │  201 { pay_url, reference, │                              │
   │        mint, expires_at }  │                              │
   │<───────────────────────────┤                              │
   │                                                           │
   │  open pay_url in Phantom / scan QR / send manually        │
   ├──────────────────────────────────────────────────────────>│
   │                            │                              │
   │                            │  watcher sees the transfer   │
   │                            │<─────────────────────────────┤
   │                            │  verify (see §3)             │
   │                            │  credit ledger + receipt     │
   │  GET /v1/deposits/{id}     │                              │
   ├───────────────────────────>│                              │
   │  200 { status: "credited", │                              │
   │        balance_micros }    │                              │
   │<───────────────────────────┤                              │
```

### The payment URL

Solana Pay transfer request, per the
[specification](https://docs.solanapay.com/spec#specification-transfer-request):

```
solana:<treasury>?amount=<ui-amount>&spl-token=<mint>&reference=<ref>&label=Pleiades&message=API%20credits
```

- `treasury` — the base58 **native SOL account** that receives. *Never an ATA*: the
  wallet derives the associated token account from `recipient` + `spl-token`.
- `amount` — UI units, not base units (`5` for 5 USDC, not `5000000`).
- `spl-token` — omit entirely to request native SOL.
- `reference` — 32-byte base58. **This is the reconciliation key.** Validators index
  transactions by account keys, so `getSignaturesForAddress(reference)` returns exactly
  the payments for that intent. It does not need to be an on-chain account.
- `memo` — optional; the wallet must include it as an SPL Memo instruction.

---

## 3. Verification rules (the part that must not be sloppy)

A payment is credited only if **all** of these hold. Anything else is parked as
`unmatched` for manual review, never auto-credited.

1. **Reference matches** an open intent and the intent is not expired.
2. **Recipient** is the treasury (or its ATA for that mint).
3. **Mint** equals the intent's mint exactly. A different mint is not a deposit.
4. **Amount ≥ intent amount.** Overpayment credits the full received amount; note it.
5. **Signature is unused.** Primary key on `deposits.signature` — this is the
   duplicate-credit guard. x402-SVM ships a `SettlementCache` for the same reason: on
   Solana the same transaction can otherwise be presented twice before confirmation.
6. **Commitment ≥ confirmed** before crediting, and record `finalized` when it lands.

### Failure modes to handle explicitly

| Case | Behaviour |
|---|---|
| Same signature seen twice | second is a no-op, unique index rejects |
| Underpayment | intent stays open until expiry; partial amounts accumulate |
| Wrong mint / wrong network | park as `unmatched`, surface in an ops view, do not credit |
| Payment after expiry | credit is allowed if the reference is still resolvable, else park |
| RPC gap or reorg | `confirmed` credit is reversible until `finalized`; reconcile on a timer |
| Refund needed | operator-signed SPL transfer out of treasury, recorded against the deposit |

---

## 4. Data model

```sql
create table deposit_intents (
  deposit_id      text primary key,          -- dep_…
  agent_id        text not null,
  rail            text not null default 'solana'
                  check (rail in ('solana','x402-svm','manual')),
  network         text not null,             -- CAIP-2
  mint            text not null,             -- '' for native SOL
  symbol          text not null,             -- USDC | USDT | SOL | PLD
  amount_ui       numeric(20,9) not null,    -- what we asked for, UI units
  reference       text not null unique,      -- base58 32-byte
  status          text not null default 'open'
                  check (status in ('open','paid','credited','expired','unmatched')),
  expires_at      timestamptz not null,
  created_at      timestamptz not null default now()
);
create index deposit_intents_open_idx on deposit_intents (status, expires_at);

create table deposits (
  signature       text primary key,          -- duplicate-credit guard
  deposit_id      text not null references deposit_intents (deposit_id),
  agent_id        text not null,
  mint            text not null,
  amount_atomic   bigint not null,           -- base units, as received
  amount_micros   bigint not null,           -- credited, USD micros
  rate_micros     bigint not null,           -- price used, micros per whole token
  slot            bigint not null,
  commitment      text not null check (commitment in ('confirmed','finalized')),
  credited_at     timestamptz not null default now()
);
```

`ledgers` and `receipts` already exist. Two changes:

- `receipts.call` gains `'deposit'`, and `rail` gains `'solana'` / `'x402-svm'`.
- `ledgers.balance_micros` is the running balance; deposits increment it, calls decrement it.

---

## 5. API surface

| Route | Purpose |
|---|---|
| `POST /v1/deposits` | create intent → `pay_url`, `reference`, `mint`, `expires_at` |
| `GET /v1/deposits/{id}` | status, credited amount, running balance |
| `GET /v1/deposits` | history, paged |
| `GET /v1/balance` | current balance in micros + a low-balance flag |
| `GET /v1/tokens` | accepted mints, decimals, current quote |
| `POST /v1/webhooks` | existing — reused for `deposit.credited` |

The 402 challenge should advertise the Solana rail:

```json
{
  "accepts": ["solana-usdc", "solana-usdt", "solana-sol", "prepaid"],
  "network": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
  "asset": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "amount_micros": 4000,
  "pay_to": "<treasury>",
  "min_deposit_micros": 1000000
}
```

---

## 6. Watcher

Two viable implementations. **Start with the webhook, keep polling as the reconciliation
sweep** — a webhook that drops an event must not lose money.

**A. Helius (or equivalent) enhanced webhook** — recommended for latency
- Webhook on `address=<treasury>` with type `TRANSFER`
- Delivers parsed transfers; verify and credit
- Fast, but treat delivery as at-least-once → the unique `signature` index is load-bearing

**B. Poll `getSignaturesForAddress(reference)`** — recommended for correctness
- For each open intent, resolve its reference; cheap because references are unique
- Backstop that runs on a timer (every 30–60s) and re-checks anything `open` near expiry
- Also the recovery path if the webhook is down for an hour

Either way the watcher must be **idempotent** and must never credit on an unverified
transfer.

---

## 7. Accepting native SOL

Native SOL has no mint. Omit `spl-token` from the pay URL, verify a `SystemProgram`
transfer instead of a `TokenProgram` transfer, and price it off a SOL/USD feed at
credit time. Record the rate on the deposit — never re-price history.

---

## 8. x402 on Solana, for self-serve calls

x402 now has first-class SVM support
([coinbase/x402 `mechanisms/svm`](https://pkg.go.dev/github.com/coinbase/x402/go/mechanisms/svm)):

- CAIP-2 networks: `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp` (mainnet),
  `solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1` (devnet)
- Scheme `exact`: fixed-amount SPL **USDC** transfer, partially signed by the client
  and completed by a facilitator that also pays the fee
- Memo program `MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`
- Wallets (Phantom, Solflare) inject Lighthouse protection instructions — the
  facilitator must tolerate extra instructions after the transfer
- **Duplicate settlement is a known race**, hence their `SettlementCache` with a 120s TTL

Practical reading: x402 is the right rail for *an agent with its own wallet paying
per call*, and the balance rail is the right one for *a customer funding an account*.
They share the ledger, so both can coexist on one balance.

---

## 9. The Pleiades token

### What it should be

A **usage credit**, priced and accepted as a deposit rail. Nothing else. Concretely:

- Standard **SPL Token** (not Token-2022) to start: no transfer-fee extension, so the
  amount received equals the amount sent and verification stays simple.
- Fixed supply, decimals 6, **mint authority revoked** at launch.
- Metadata via Metaplex (name, symbol, logo) so wallets render it properly.
- Treasury and any remaining authority in a **multisig**, never a hot wallet.
- Accepted at a quoted rate → credits in USD micros, exactly like USDC.

> If you later want Token-2022 features, note that a **transfer-fee extension changes
> the amount that arrives**. Verification must then read the post-fee amount and the
> credit must match what actually landed.

### What it must not be presented as

Not a share, not a yield, not a claim on revenue, no promised market, no buyback.
It buys API credits. Anything else in the marketing is both untrue and a regulatory
problem — token classification turns on how it is sold and described, not on what the
code does. Worth a lawyer's read before any public sale, not after.

### Acceptance policy

| Question | Answer |
|---|---|
| Which mints? | USDC, USDT, SOL, PLD — nothing else |
| Priced how? | quoted per deposit, rate stored on the deposit row |
| Slippage | quote expires with the intent (30 min) |
| Can credits be redeemed for tokens? | no — credits are one-way |

---

## 10. Config

```bash
SOLANA_NETWORK=solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp
SOLANA_RPC_URL=              # Helius / QuickNode; the public RPC will rate-limit
SOLANA_TREASURY=             # base58, a native SOL account, never an ATA
SOLANA_COMMITMENT=confirmed
SOLANA_WEBHOOK_SECRET=
PLD_MINT=                    # set after minting; empty disables the rail
MIN_DEPOSIT_MICROS=1000000   # $1
INTENT_TTL_MINUTES=30
```

Verified mainnet mints:

| Token | Mint | Decimals |
|---|---|---|
| USDC | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` | 6 |
| USDT | *verify on-chain before use — do not copy an address from a doc* | 6 |
| SOL | native, omit `spl-token` | 9 |

**Never hardcode an address you have not verified against the chain.** A wrong USDC
mint in a pay URL sends customer funds nowhere.

---

## 11. Open decisions

1. **Treasury address** — needed before anything can be wired. A native SOL account, and
   ideally a multisig from day one.
2. **RPC provider** — the public endpoint will not survive production traffic.
3. **Token** — mint now, or ship USDC/USDT/SOL first and add PLD later? My
   recommendation: ship the stablecoin rails and the ledger first; add the token once
   credits are demonstrably working, so the token is never load-bearing.
4. **Who holds keys** — if the mint authority is not revoked, say so plainly.
5. **Refunds** — policy for wrong-mint and overpayment cases.
