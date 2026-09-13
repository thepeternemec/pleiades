// GENERATED FILE — do not edit directly.
// Source of truth: packages/contracts + apps/{api,worker}/src.
// Regenerate with: npm run sync:supabase

import type { SupabaseClient } from "npm:@supabase/supabase-js@^2.45.4";

/**
 * Agent identity. A credential is `pk_<32 hex>`; only its SHA-256 is stored, so
 * a database leak does not hand out working keys. Web Crypto is used rather
 * than node:crypto because this module also runs in Deno edge functions.
 */

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function randomHex(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

export function newAgentId(): string {
  return `ag_${randomHex(6)}`;
}

export function newSecret(): string {
  return `pk_${randomHex(32)}`;
}

export function newDepositId(): string {
  return `dep_${randomHex(8)}`;
}

export async function hashKey(secret: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return toHex(new Uint8Array(digest));
}

export interface AgentIdentity {
  agentId: string;
  label: string;
}

/**
 * Resolve a presented secret to an agent. Returns null for an unknown or
 * revoked key, or a blocked agent — the caller must not distinguish between
 * those in its response.
 */
export async function resolveApiKey(
  db: SupabaseClient,
  secret: string,
): Promise<AgentIdentity | null> {
  if (!secret.startsWith("pk_") || secret.length !== 67) return null;
  const keyHash = await hashKey(secret);

  const { data, error } = await db
    .from("api_keys")
    .select("agent_id, revoked_at, agents!inner(label, state)")
    .eq("key_hash", keyHash)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || data.revoked_at) return null;

  const agent = Array.isArray(data.agents) ? data.agents[0] : data.agents;
  if (!agent || agent.state !== "active") return null;

  return { agentId: data.agent_id as string, label: (agent.label as string) ?? "" };
}

/** Best-effort usage stamp; never fail a request over it. */
export async function touchApiKey(db: SupabaseClient, secret: string): Promise<void> {
  try {
    await db
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("key_hash", await hashKey(secret));
  } catch {
    /* ignore */
  }
}

/** Create an agent and its first credential. The secret is returned once. */
export async function createAgent(
  db: SupabaseClient,
  label: string,
): Promise<{ agentId: string; secret: string }> {
  const agentId = newAgentId();
  const secret = newSecret();

  const agent = await db.from("agents").insert({ agent_id: agentId, label });
  if (agent.error) throw new Error(agent.error.message);

  const key = await db
    .from("api_keys")
    .insert({ key_hash: await hashKey(secret), agent_id: agentId, label });
  if (key.error) throw new Error(key.error.message);

  return { agentId, secret };
}
