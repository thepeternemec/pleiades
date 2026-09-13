// GENERATED FILE — do not edit directly.
// Source of truth: packages/contracts + apps/{api,worker}/src.
// Regenerate with: npm run sync:supabase

import type { Context } from "npm:hono@^4.6.14";
import type { SupabaseClient } from "npm:@supabase/supabase-js@^2.45.4";
import { resolveApiKey, touchApiKey, type AgentIdentity } from "../db/index.ts";

/**
 * Credential handling.
 *
 * The API is dual-rail by design: an agent may present a prepaid key, or it may
 * arrive with nothing and be quoted a per-call price over x402. So "no
 * credential" is not an error here — it is the other rail.
 */

/** `Authorization: Bearer pk_…` or `X-API-Key: pk_…`. */
export function presentedSecret(c: Context): string | null {
  const authorization = c.req.header("authorization");
  if (authorization && authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7).trim() || null;
  }
  const header = c.req.header("x-api-key");
  return header?.trim() || null;
}

export interface AuthOutcome {
  /** null when no credential was presented at all (the x402 rail). */
  agent: AgentIdentity | null;
  /** true when a credential was presented but is not usable. */
  rejected: boolean;
}

export async function authenticate(
  db: SupabaseClient,
  c: Context,
): Promise<AuthOutcome> {
  const secret = presentedSecret(c);
  if (!secret) return { agent: null, rejected: false };

  const agent = await resolveApiKey(db, secret);
  if (!agent) return { agent: null, rejected: true };

  // Fire-and-forget; a bookkeeping failure must not fail the call.
  void touchApiKey(db, secret);
  return { agent, rejected: false };
}
