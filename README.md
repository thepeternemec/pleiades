---
name: Pleiades
type: api
category: news
auth: optional (x402 or prepaid key)
pricing: metered per call
beats: 20
publishers: 150000+
languages: eng
live: https://pleiades.news
api: https://dnnoypytdfvsdenykooq.supabase.co/functions/v1/api
openapi: https://dnnoypytdfvsdenykooq.supabase.co/functions/v1/api/openapi.json
mcp: https://pleiades.news/mcp (interface published, not served yet)
payments: x402 on Solana, or a prepaid USDC balance
license: MIT
---

# Pleiades

<p align="center">
  <a href="https://github.com/thepeternemec/pleiades/stargazers"><img src="https://img.shields.io/github/stars/thepeternemec/pleiades?style=for-the-badge&logo=github&color=yellow" alt="GitHub Stars"></a>
  <a href="https://github.com/thepeternemec/pleiades/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=for-the-badge" alt="License: MIT"></a>
  <a href="https://github.com/thepeternemec/pleiades/issues"><img src="https://img.shields.io/github/issues/thepeternemec/pleiades?style=for-the-badge&color=orange" alt="Issues"></a>
  <a href="https://github.com/thepeternemec/pleiades/commits/main"><img src="https://img.shields.io/github/last-commit/thepeternemec/pleiades?style=flat-square" alt="Last Commit"></a>
</p>

<p align="center">
  <a href="https://pleiades.news"><img src="https://img.shields.io/badge/live-pleiades.news-9945FF?style=flat-square" alt="Live"></a>
  <img src="https://img.shields.io/badge/Solana-x402-14F195?style=flat-square" alt="Solana x402">
  <a href="https://pleiades.news/docs"><img src="https://img.shields.io/badge/docs-reference-03E1FF?style=flat-square" alt="Docs"></a>
  <a href="https://pleiades.news/llms.txt"><img src="https://img.shields.io/badge/llms.txt-agent%20ready-5B4EFF?style=flat-square" alt="llms.txt"></a>
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-what-you-get">What You Get</a> •
  <a href="#-endpoints">Endpoints</a> •
  <a href="#-payment-on-solana">Payment</a> •
  <a href="#-self-hosting">Self-Host</a> •
  <a href="https://pleiades.news/docs">Docs</a>
</p>

**The news layer for Solana agents.** Your agent asks one question on a schedule — *has this
moved?* — and pays a fraction of a cent for the answer, in USDC from its own wallet. No account,
no API key, no invoice.

Live at **[pleiades.news](https://pleiades.news)** · API at
`https://dnnoypytdfvsdenykooq.supabase.co/functions/v1/api`

**For AI agents:** [`llms.txt`](apps/web/public/llms.txt) · [`skill.md`](apps/web/public/skill.md) ·
[OpenAPI](https://dnnoypytdfvsdenykooq.supabase.co/functions/v1/api/openapi.json) ·
[`AGENTS.md`](AGENTS.md) · MCP: `https://pleiades.news/mcp`

> ⭐ If this is useful, star the repo. It helps other builders find it.

---

## ⚡ Quick Start

No key needed to look around. The catalog, the tool schema, pricing and stats are all public.

```bash
API=https://dnnoypytdfvsdenykooq.supabase.co/functions/v1/api

# The catalog: 20 topics, each with a stable beat_id
curl $API/v1/catalog

# The pricing card and the caps
curl $API/v1/pricing

# OpenAI-compatible tool definitions
curl $API/v1/tools

# Ask whether a topic has moved (this is the whole product)
curl -X POST $API/v1/poll \
  -H "Content-Type: application/json" \
  -d '{"beat_id":"b_bb964843350e","cursor":null}'
```

`poll` has exactly two answers. Nothing moved:

```json
{ "beat_id": "b_bb964843350e", "moved": false, "cursor": "c_eyJiIjoi…", "item_count": 0 }
```

Or a small pack of what did:

```json
{
  "beat_id": "b_bb964843350e",
  "beat_label": "NVIDIA",
  "moved": true,
  "item_count": 3,
  "token_estimate": 611,
  "cursor": "c_eyJiIjoi…",
  "receipt_id": "r_92e37a963847477390cd",
  "items": [
    {
      "lede": "Ambarella Q2 2027 earnings call…",
      "url": "https://www.fool.com/…",
      "source": "The Motley Fool",
      "published_at": "2026-09-09T20:30:00Z",
      "first_indexed_at": "2026-09-09T20:32:00Z",
      "lang": "eng",
      "sentiment": 0.18
    }
  ]
}
```

Store the `cursor`, send it next time, and you will only ever see articles you have not seen.

> **Ingestion is currently paused** while the topic catalog is rebuilt for 100 beats. The catalog,
> pricing, tools and receipts endpoints all work today; `poll` returns `pack_not_ready` until
> ingestion resumes. The site says the same thing, on purpose.

---

## 🎁 What You Get

| Capability | Details |
| --- | --- |
| **Beats** | 20 seeded topics across markets, policy, energy, science and geopolitics. English only. [Catalog](https://pleiades.news/docs/data) |
| **Article clusters** | One cluster per beat: deduplicated by URL, ordered by publication time, no hidden story-merging. |
| **Bounded packs** | At most 8 items, 320-character ledes, ≤800 token estimate. No article bodies at any price. |
| **Payment** | x402 per call on Solana, or a prepaid balance funded with USDC, USDT or SOL. [Docs](https://pleiades.news/docs/payment) |
| **Receipts** | Every metered call and every deposit writes a receipt reconcilable in USD micros. |
| **Caps** | $0.50/day and 50 distinct beats/day per identity, enforced in the database before the debit. |
| **Agent surfaces** | REST, an OpenAI-compatible tool schema, and an MCP server interface. [`llms.txt`](apps/web/public/llms.txt) |
| **Lead-time evidence** | Every item carries `first_indexed_at` beside `published_at`, so the claim is measurable. |

### How it compares

|  | A feed (RSS, aggregator) | A search API | Pleiades |
| --- | --- | --- | --- |
| **Who asks** | A human, repeatedly | A human, once | A machine, on a schedule |
| **What you get** | Everything, to read | Ranked results | *Nothing moved*, or ≤8 cited stories |
| **What wins** | Volume | Recall and ranking | State and a cursor |
| **Unit of billing** | Free, or a seat | Per query | Per wake-up |
| **Cost when nothing happens** | Your attention | A full query | $0.0005 |

---

## 🔌 Endpoints

Base: `https://dnnoypytdfvsdenykooq.supabase.co/functions/v1/api`

| Area | Route | State |
| --- | --- | --- |
| Catalog | `GET /v1/catalog` | Live |
| Stats | `GET /v1/stats` | Live |
| Tools | `GET /v1/tools` | Live |
| Pricing | `GET /v1/pricing` | Live |
| Tokens accepted | `GET /v1/tokens` | Live (reports `settlement: unavailable` until a treasury is set) |
| Poll | `POST /v1/poll` | Live |
| Delta | `POST /v1/delta` | Live |
| Balance | `GET /v1/balance` | Built; needs a credential |
| Receipts | `GET /v1/receipts?since=` | Built; needs a credential |
| Deposits | `POST`, `GET /v1/deposits` | Built; needs a treasury address |
| Webhooks | `POST`, `GET`, `DELETE /v1/webhooks` | Live |
| Resolve | `POST /v1/resolve` | Not built |
| Brief | `POST /v1/brief` | Not built |
| Watch | `POST /v1/watch` | Not built |
| MCP | `/mcp` | Interface published, not served |
| News v2 | `GET /v2/topics`, `/v2/news`, `/v2/changes` | Separate protected service |

Full reference: **[pleiades.news/docs](https://pleiades.news/docs)** ·
[OpenAPI](https://dnnoypytdfvsdenykooq.supabase.co/functions/v1/api/openapi.json)

---

## 💸 Payment on Solana

Two rails, one balance.

**x402 — no account.** Call a metered route with no credential and you get a quote for that exact
call:

```json
{
  "x402Version": 2,
  "accepts": [{
    "scheme": "exact",
    "network": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
    "asset": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "max_amount_required": "4000",
    "resource": "POST /v1/poll"
  }]
}
```

Sign the USDC transfer, then retry the identical request with `X-PAYMENT`.

**Prepaid — no per-call chain write.** `POST /v1/deposits` returns a Solana Pay URL and a unique
reference key. The wallet attaches that key to the transfer, and because Solana validators index
transactions by account key, `getSignaturesForAddress(reference)` reconciles the deposit exactly.

```
solana:<treasury>?amount=5&spl-token=EPjF…&reference=7Yq3…&label=Pleiades&message=API%20credits
```

A deposit is credited only after six checks — reference, recipient, mint, amount, unused
signature, and at least `confirmed` commitment. The signature is the primary key of the `deposits`
table, which is the duplicate-credit guard: the same transaction can be presented twice before it
confirms.

Full details: [docs/SOLANA-PAYMENTS.md](docs/SOLANA-PAYMENTS.md) ·
[pleiades.news/docs/payment](https://pleiades.news/docs/payment)

> **Metering is off by default.** Set `PLEIADES_METERING=on` to charge. While it is off, calls are
> free and no receipt is written.

---

## 🔮 MCP Server

The MCP interface is published and the handlers exist; the hosted endpoint is not served yet.

```json
{
  "mcpServers": {
    "pleiades": {
      "url": "https://pleiades.news/mcp"
    }
  }
}
```

Until it is served, `GET /v1/tools` returns the same tool definitions in OpenAI function-call
shape, which is what most agent frameworks want anyway.

---

## 🐳 Self-Hosting

```bash
git clone https://github.com/thepeternemec/pleiades.git
cd pleiades
npm install
npm run build
npm test
npm run dev        # API on http://localhost:8787
npm run dev:web    # site on http://localhost:3000
```

The runtime is Supabase (Postgres, Edge Functions, Realtime). Local stack and deploy commands:

```bash
supabase link --project-ref <ref>
supabase db push
supabase secrets set NEWSAPI_API_KEY=<key>
supabase functions deploy api --no-verify-jwt
```

Environment variables are documented in [`.env.example`](.env.example). Nothing is required for
the public catalog routes; a database is required for poll, delta, receipts and deposits.

---

## 🏗️ Architecture

1. **Contracts** (`packages/contracts`) — every wire shape as a zod schema: beats, packs, payments,
   receipts, errors. Single source of truth for REST, WebSocket, bots and MCP.
2. **Database** (`packages/db`) — typed access plus the ledger. `charge_call()` does caps, the
   debit, the receipt and the usage counters in one transaction, so a refused charge cannot
   half-apply.
3. **API** (`apps/api`) — a Hono app. Node dev mirror; the deployed runtime is a Supabase Edge
   Function generated from it by `scripts/sync-supabase.mjs`.
4. **Worker** (`apps/worker`) — ingestion: newsapi.ai queries → English filter → URL dedupe →
   bounded pack → persistence.
5. **Payments** — Solana. x402 challenges on uncredentialed calls, deposit intents reconciled by
   reference key, credits written once per transaction signature.
6. **Web** (`apps/web`) — the site. Two Next route groups so each design system owns its own root
   layout and stylesheet.
7. **Generated code** — `supabase/functions/_shared/` is generated from the canonical sources. CI
   fails on drift, so run `npm run sync:supabase` after editing anything it copies.

Deeper reading: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) ·
[docs/SOLANA-PAYMENTS.md](docs/SOLANA-PAYMENTS.md)

---

## 📚 Documentation

| Document | What it covers |
| --- | --- |
| [pleiades.news/docs](https://pleiades.news/docs) | The documentation site |
| [docs/QUICKSTART](https://pleiades.news/docs/quickstart) | First call in two minutes |
| [docs/contract](https://pleiades.news/docs/contract) | Verbs, pack shape, cursors, errors |
| [docs/payment](https://pleiades.news/docs/payment) | x402, deposits, receipts, tokens |
| [docs/limits](https://pleiades.news/docs/limits) | Caps, invariants, segmentation |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design and data flow |
| [docs/SOLANA-PAYMENTS.md](docs/SOLANA-PAYMENTS.md) | The deposit spec and the token plan |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Phased plan |
| [AGENTS.md](AGENTS.md) | Integration guide written for coding agents |

---

## 🤝 Contributing

Bug reports, new beats, documentation fixes and payment-rail work are all welcome. See
[CONTRIBUTING.md](CONTRIBUTING.md) for the workflow and the rules that keep this repo honest.

- **Propose a beat:** open an issue with the topic, the concept URIs and why an agent would poll it.
- **Fix the docs:** every page under `apps/web/app/(site)/docs/` is plain JSX — no build step.
- **Never let the site claim more than the code does.** If you ship a capability, update the
  status tables in the README and on the site in the same PR.

---

## 📄 License

MIT — see [LICENSE](LICENSE). Use it, fork it, ship it.
