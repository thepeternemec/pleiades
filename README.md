---
name: Pleiades
type: api
category: real-time context for AI agents
auth: optional (usage-based, operator-granted in early access)
pricing: usage-based, per answer
beats: 20
publishers: 150000+
languages: eng
live: https://pleiades.news
api: https://dnnoypytdfvsdenykooq.supabase.co/functions/v1/api
openapi: https://dnnoypytdfvsdenykooq.supabase.co/functions/v1/api/openapi.json
mcp: https://pleiades.news/mcp (interface published, not served yet)
payments: metered per answer; card, invoice or stablecoin
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
  <a href="https://pleiades.news"><img src="https://img.shields.io/badge/live-pleiades.news-ededed?style=flat-square" alt="Live"></a>
  <a href="https://pleiades.news/docs"><img src="https://img.shields.io/badge/docs-reference-9c9c9c?style=flat-square" alt="Docs"></a>
  <a href="https://pleiades.news/llms.txt"><img src="https://img.shields.io/badge/llms.txt-agent%20ready-5B4EFF?style=flat-square" alt="llms.txt"></a>
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-what-you-get">What You Get</a> •
  <a href="#-endpoints">Endpoints</a> •
  <a href="#-billing">Billing</a> •
  <a href="#-self-hosting">Self-Host</a> •
  <a href="https://pleiades.news/docs">Docs</a>
</p>

**The news layer for AI agents.** Your agent asks one question on a schedule — *has this
moved?* — and gets either "nothing new" or a short, cited pack. Usage-based, priced per answer.

Live at **[pleiades.news](https://pleiades.news)** · API at
`https://dnnoypytdfvsdenykooq.supabase.co/functions/v1/api`

**For AI agents:** [`llms.txt`](apps/web/public/llms.txt) · [`skill.md`](apps/web/public/skill.md) ·
[OpenAPI](https://dnnoypytdfvsdenykooq.supabase.co/functions/v1/api/openapi.json) ·
[`AGENTS.md`](AGENTS.md)

> ⭐ If this is useful, star the repo. It helps other builders find it.

---

## ⚡ Quick Start

No credential needed to look around. The catalog, the tool schema, pricing and stats are all
public.

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
| **Topics (beats)** | 20 seeded topics across markets, policy, energy, science and geopolitics. English only. [Catalog](https://pleiades.news/docs/data) |
| **Article clusters** | One cluster per topic: deduplicated by URL, ordered by publication time, no hidden story-merging. |
| **Bounded packs** | At most 8 items, 320-character ledes, ≤800 token estimate. No article bodies at any price. |
| **Stateful cursors** | An opaque, signed, beat-bound cursor, so a poll only ever returns what is new. |
| **Lead-time evidence** | Every item carries `first_indexed_at` beside `published_at`, so the claim is measurable rather than asserted. |
| **Metered billing** | Priced per answer, with receipts you can reconcile and caps that stop a runaway loop. [Docs](https://pleiades.news/docs/billing) |
| **Agent surfaces** | REST, an OpenAI-compatible tool schema, and an MCP server interface. [`llms.txt`](apps/web/public/llms.txt) |

### How it compares

|  | A feed (RSS, aggregator) | A search API | Pleiades |
| --- | --- | --- | --- |
| **Who asks** | A human, repeatedly | A human, once | A machine, on a schedule |
| **What you get** | Everything, to read | Ranked results | *Nothing moved*, or ≤8 cited stories |
| **State** | None | None | A cursor per topic |
| **Unit of billing** | Free, or a seat | Per query | Per answer |
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
| Poll | `POST /v1/poll` | Live |
| Delta | `POST /v1/delta` | Live |
| Webhooks | `POST`, `GET`, `DELETE /v1/webhooks` | Live |
| Balance | `GET /v1/balance` | Built; needs a credential |
| Receipts | `GET /v1/receipts?since=` | Built; needs a credential |
| Top-ups | `POST`, `GET /v1/deposits` | Built; needs a receiving account |
| Resolve | `POST /v1/resolve` | Not built |
| Brief | `POST /v1/brief` | Not built |
| Watch | `POST /v1/watch` | Not built |
| MCP | `/mcp` | Interface published, not served |

Full reference: **[pleiades.news/docs](https://pleiades.news/docs)** ·
[OpenAPI](https://dnnoypytdfvsdenykooq.supabase.co/functions/v1/api/openapi.json)

---

## 💸 Billing

Usage-based, per answer. There is no seat, no platform fee and no monthly minimum.

| Call | What it returns | Price |
| --- | --- | --- |
| `POST /v1/poll` — nothing new | An empty answer | $0.0005 |
| `POST /v1/poll` — moved | A bounded, cited pack | $0.004 |
| `POST /v1/delta` | Everything newer than your cursor | $0.004 warm · $0.02 cold |
| `POST /v1/brief` | 3–6 cited sentences plus the pack | $0.03 |

Two ways to pay, both in one balance:

- **Pay as you go** — each call is billed to the account that made it. A call with no credential
  returns `402` with a quote for that call.
- **Prepaid** — top up once and calls draw down from the balance with no per-call payment step.

```json
// POST /v1/deposits  ->  201 Created
{
  "deposit_id": "dep_01JQ8ZK4M2X",
  "amount_micros": 5000000,
  "currency": "USD",
  "pay_url": "<payment instruction>",
  "expires_at": "2026-09-12T12:30:00Z"
}
```

Card, invoice and stablecoin are all accepted; credits are held in integer USD micros and never
expire. Caps are checked before the debit — $0.50 a day and 50 distinct topics a day per identity
by default — because a looping tool call is the default failure mode of an agent.

Billing is **off by default**. Set `PLEIADES_METERING=on` to charge. While it is off, calls are
free and no receipt is written.

Full details: [docs/BILLING.md](docs/BILLING.md) · [pleiades.news/docs/billing](https://pleiades.news/docs/billing)

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

The runtime is Postgres plus a Node service (deployed on Supabase today, but not tied to it — see
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)). Nothing is required for the public catalog routes; a
database is required for poll, delta, receipts and top-ups.

Environment variables are documented in [`.env.example`](.env.example).

---

## 🏗️ Architecture

1. **Contracts** (`packages/contracts`) — every wire shape as a zod schema: beats, packs, receipts,
   errors. Single source of truth for REST, WebSocket, bots and MCP.
2. **Database** (`packages/db`) — typed access plus the ledger. `charge_call()` does caps, the
   debit, the receipt and the usage counters in one transaction, so a refused charge cannot
   half-apply.
3. **API** (`apps/api`) — a Hono app. Node dev mirror; the deployed runtime is an Edge Function
   generated from it by `scripts/sync-supabase.mjs`.
4. **Worker** (`apps/worker`) — ingestion: provider queries → English filter → URL dedupe →
   bounded pack → persistence.
5. **Billing** — a metered ledger with receipts. Payment rails are pluggable; card, invoice and
   stablecoin all credit the same balance, and a transaction signature or payment id is the
   duplicate-credit guard.
6. **Web** (`apps/web`) — the site. Two Next route groups so each design system owns its own root
   layout and stylesheet.
7. **Generated code** — `supabase/functions/_shared/` is generated from the canonical sources. CI
   fails on drift, so run `npm run sync:supabase` after editing anything it copies.
8. **Deployment** — not tied to a host: `apps/api` and `apps/worker` are ordinary Node services.

Deeper reading: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) ·
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

---

## 📚 Documentation

| Document | What it covers |
| --- | --- |
| [pleiades.news/docs](https://pleiades.news/docs) | The documentation site |
| [Quickstart](https://pleiades.news/docs/quickstart) | First call in two minutes |
| [The contract](https://pleiades.news/docs/contract) | Verbs, pack shape, cursors, errors |
| [Billing and metering](https://pleiades.news/docs/billing) | Charges, top-ups, receipts, caps |
| [Limits and invariants](https://pleiades.news/docs/limits) | Caps, invariants, segmentation |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design and data flow |
| [docs/BILLING.md](docs/BILLING.md) | The metered ledger and the stablecoin rail |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | What the host provides, and what leaving costs |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Phased plan |
| [AGENTS.md](AGENTS.md) | Integration guide written for coding agents |

---

## 🤝 Contributing

Bug reports, new topics, documentation fixes and billing work are all welcome. See
[CONTRIBUTING.md](CONTRIBUTING.md) for the workflow and the rules that keep this repo honest.

- **Propose a topic:** open an issue with the subject, the concept URIs and why an agent would poll it.
- **Fix the docs:** every page under `apps/web/app/(site)/docs/` is plain JSX — no build step.
- **Never let the site claim more than the code does.** If you ship a capability, update the
  status tables in the README and on the site in the same PR.

---

## 📄 License

MIT — see [LICENSE](LICENSE). Use it, fork it, ship it.
