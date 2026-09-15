# Your first pull request

This is the fastest path from a fresh clone to a merged change. It assumes nothing about this
codebase, and the first option below needs no understanding of it at all.

## 1. Get it running

```bash
git clone https://github.com/thepeternemec/pleiades.git
cd pleiades
npm install
npm run build:packages     # contracts, db and sdk must exist before the apps compile
npm test                   # 50 tests, no network and no database needed
npm run dev                # API on http://localhost:8787
```

You do not need a database, an API key or a news provider to run the tests. Most of this codebase
is deliberately built so the interesting logic is pure and testable without any of that.

## 2. Pick something

The labels that mean "nobody is working on this and it is scoped":

| Label | What it means |
| --- | --- |
| `good first issue` | Narrow, self-contained, and we will help in the PR |
| `topic` | Propose a beat for the catalog — no code at all |
| `docs` | Fix something wrong or unclear in `docs/` or the docs site |
| `help wanted` | Real work, some context required |

## 3. The four rules that will come up in review

1. **Never let the site or the docs claim more than the code does.** If you ship a capability,
   update the status tables in the same PR.
2. **Wire shapes live in `packages/contracts`.** Endpoints validate against those schemas. If you
   change a response, change the schema, not just the handler.
3. **Billing logic stays pure.** Caps, the debit, the receipt and the counters happen in one SQL
   transaction; the amount conversions are pure functions with tests. Keep it that way.
4. **No article bodies, ever.** A pack carries a lede and a publisher URL. There is no `body`
   field at any price, and adding one is out of scope for this repo.

## 4. If you edit `packages/`

`supabase/functions/_shared/` is generated from the canonical sources in `packages/`. After
editing, run:

```bash
npm run sync:supabase
```

CI fails on drift, so this will come up if you forget. It is a copy step, not a build step — the
Edge Functions and the Node services run the same code.

## 5. Before you open the PR

```bash
npm test
npm run check:supabase
```

Then say what you changed and why. If you got stuck partway, open the PR anyway and say where —
a half-finished change with a clear question is easier to help with than silence.
