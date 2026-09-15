# Contributing to Pleiades

Thanks for looking. This repo is small enough that a good pull request usually lands quickly, and
opinionated enough that there are a few rules worth reading first.

## The one rule that matters

**Never let the site claim more than the code does.**

Pleiades markets itself on being honest about what is live. The landing page, the README and the
docs all carry status labels — `Live`, `Built`, `Not built`, `next`, `planned`. Those labels are
part of the product.

If you ship a capability, update every place that describes it **in the same pull request**:

- `README.md` — the **Endpoints** and **What You Get** tables
- `apps/web/app/(site)/docs/page.tsx` — the **What is live today** table
- `apps/web/app/(site)/page.tsx` — any teaser or claim that changes
- `docs/BILLING-RAIL.md` — the status table, if it is payment work

A PR that makes a claim true is welcome. A PR that leaves a stale claim behind will be asked to
fix it before merge.

## Getting set up

```bash
git clone https://github.com/thepeternemec/pleiades.git
cd pleiades
npm install
npm run build     # contracts -> db -> sdk -> realtime -> api -> worker -> bots -> web
npm test          # contract, worker and realtime tests
npm run dev       # API on http://localhost:8787
npm run dev:web   # site on http://localhost:3000
```

Node 20 or newer. The repo is an npm workspace; `apps/*` and `packages/*` are the units.

## Generated code

`supabase/functions/_shared/` is generated from the canonical Node sources by
`scripts/sync-supabase.mjs`. **Never edit it by hand.** Edit the source and run:

```bash
npm run sync:supabase
```

CI fails on drift, so a stale `_shared` will not merge. The mapping is the `COPIES` array in the
script — add an entry there when you add a file that the edge functions need.

## Where things live

| Path | What it is |
| --- | --- |
| `packages/contracts` | Every wire shape, as zod schemas. The single source of truth. |
| `packages/db` | Typed database access and the ledger. |
| `apps/api` | The Hono API. Node dev mirror of the deployed Edge Function. |
| `apps/worker` | Ingestion: query, filter to English, dedupe, pack, persist. |
| `apps/web` | The site. Two route groups, each with its own root layout. |
| `supabase/migrations` | Schema. Append-only: add a new file, never edit an applied one. |

## Conventions

- **Contracts first.** If a shape appears on the wire, it belongs in `packages/contracts` as a
  schema. Do not hand-roll a response object in a route.
- **Errors are codes.** Return a stable `error` code from `packages/contracts/src/errors.ts` so
  clients can branch on it. Never make a caller match on a message string.
- **Money is integer micros.** `1000000` micros is one dollar. Never use a float for a balance.
- **Database invariants belong in the database.** Caps, uniqueness and the duplicate-credit guard
  live in SQL, not in application code that could race.
- **Two designs, two route groups.** `app/(site)` is the Pleiades site; `app/(app)` is the news app.
  Do not import one group's stylesheet into the other — that is exactly what the split exists to
  prevent.
- **No article bodies, ever.** A pack carries a lede and a publisher URL. There is no `body` field
  at any price, and adding one is out of scope for this repo.

## Tests

```bash
npm test                              # everything
npm run build -w @pleiades/contracts  # then:
node --test packages/contracts/dist/*.test.js
```

The billing logic is deliberately pure so it can be tested without a database or a payment
provider: the payment-request builder, the deposit verification rules, base58 round-trips, amount
conversion and the credit maths all have direct unit tests. Please keep it that way — a rule that only exists
inside a Postgres function cannot be tested here, so anything that *can* be pure, should be.

## Adding a beat

Beats live in `packages/contracts/src/seed.ts`. A beat needs a stable ID, a label, concept URIs,
languages and refresh settings. Add it, run `npm test`, and it appears in `/v1/catalog`.

Two agents describing the same task must resolve to the same beat ID, so do not renumber or
reuse an existing ID — cursors in the wild depend on them.

## Reporting a security issue

Please do not open a public issue for anything involving keys, the treasury, deposit verification
or the ledger. Email the maintainer instead, and give us a chance to fix it before it is public.

## License

Contributions are accepted under the MIT license in [LICENSE](LICENSE).
