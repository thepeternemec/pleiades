## What this changes

<!-- One or two sentences. Link the issue if there is one. -->

## The rule that matters here

**Never let the site or the docs claim more than the code does.** If you ship a
capability, update the status tables in the same PR — `README.md`, the docs site under
`apps/web/app/(site)/docs/`, and `docs/BILLING-RAIL.md` all carry them.

## Checklist

- [ ] `npm test` passes
- [ ] `npm run check:supabase` passes, or I ran `npm run sync:supabase` (editing anything in
      `packages/` regenerates `supabase/functions/_shared/`)
- [ ] If this changes a wire shape, `packages/contracts` was updated, not just the handler
- [ ] If this changes what is shipped, the status tables above were updated
- [ ] No article bodies were added anywhere, at any price
