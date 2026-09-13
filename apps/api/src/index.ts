import { Hono, type Context } from "hono";
import { mcpResponse } from "./lib/mcp.js";
import { newsRoutes } from "./lib/news-routes.js";
import { BeatSchema, DepositRequestSchema, PollRequestSchema, PRICE_CARD, SEED_BEATS, SOLANA_MINTS, TOKEN_DECIMALS, TOOL_DEFINITIONS, WebhookRegisteredSchema, WebhookRegistrationRequestSchema, } from "@pleiades/contracts";
import { chargeCall, createDepositIntent, createSupabaseClient, DEFAULT_DAILY_BEAT_CAP, DEFAULT_DAILY_CAP_MICROS, env, getBalance, getDashboardStats, getDepositIntent, hasSupabaseEnv, insertWebhook, isLowBalance, listDepositIntents, listReceipts, listWebhooks, MIN_DEPOSIT_MICROS, revokeWebhook, toPublicIntent, } from "@pleiades/db";
import { authenticate, presentedSecret } from "./lib/auth.js";
import { errorByCode } from "./lib/errors.js";
import { openapi } from "./lib/openapi.js";
import { getPollSnapshot } from "./lib/store.js";
import { x402Challenge } from "./lib/x402.js";
export const SERVICE = {
    name: "pleiades",
    version: "0.2.0",
    tagline: "The real-time news terminal.",
} as const;
const app = new Hono();
// ── CORS (public API; consumed by the dashboard and agents) ─────────
app.use("*", async (c, next) => {
    c.header("Access-Control-Allow-Origin", "*");
    c.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    c.header("Access-Control-Allow-Headers", "Content-Type, X-PAYMENT, Authorization, Idempotency-Key, MCP-Protocol-Version, MCP-Session-Id");
    if (c.req.method === "OPTIONS") {
        return new Response(null, { status: 204 });
    }
    await next();
});
app.route("/v2", newsRoutes);
app.all("/mcp", c => mcpResponse(c.req.raw));
// ── Service descriptor ──────────────────────────────────────────────
app.get("/", (c) => c.json({
    service: "Pleiades",
    version: SERVICE.version,
    description: "Real-time news terminal for agents and humans. News ingestion is not yet enabled in this codebase (Phase 1).",
    endpoints: {
        health: "/health",
        readiness: "/ready",
        catalog: "/v1/catalog",
        tools: "/v1/tools",
        pricing: "/v1/pricing",
        documentation: "/docs",
        openapi: "/openapi.json",
    },
}));
// ── Health & readiness ──────────────────────────────────────────────
app.get("/health", (c) => c.json({ ok: true, service: SERVICE.name, version: SERVICE.version }));
// Readiness will verify the database migration table once Supabase is wired (Phase 1).
app.get("/ready", (c) => c.json({ ok: true, note: "database check pending Phase 1 wiring" }));
// ── Catalog ─────────────────────────────────────────────────────────
app.get("/v1/catalog", (c) => {
    const beats = [...SEED_BEATS]
        .map((b) => BeatSchema.parse(b))
        .sort((a, b) => a.label.localeCompare(b.label));
    return c.json({ beats });
});
// ── Dashboard stats (public; drives the demo UI) ────────────────────
app.get("/v1/stats", async (c) => {
    if (!hasSupabaseEnv())
        return errorByCode(c, "database_not_configured");
    const db = createSupabaseClient();
    if (!db)
        return errorByCode(c, "database_not_configured");
    try {
        return c.json(await getDashboardStats(db));
    }
    catch (error) {
        console.error("stats failed:", error);
        return errorByCode(c, "internal_error");
    }
});
// ── Agent tool definitions ──────────────────────────────────────────
app.get("/v1/tools", (c) => c.json({ tools: TOOL_DEFINITIONS }));
// ── Pricing (Phase 0 fix F3) ────────────────────────────────────────
app.get("/v1/pricing", (c) => c.json({
    currency: PRICE_CARD.currency,
    unit: PRICE_CARD.unit,
    calls: PRICE_CARD.calls,
    depth_multipliers: PRICE_CARD.depth_multipliers,
    caps: {
        depth_ceiling_days: 30,
        pack_max_items: 8,
        pack_token_estimate: 800,
        daily_cap_micros: 500000,
        distinct_beats_per_day: 50,
    },
    deposits: {
        manual: {
            rail: "manual",
            tiers: [
                {
                    gross_micros: PRICE_CARD.manual_tier.gross_micros,
                    fee_micros: "0",
                    net_micros: PRICE_CARD.manual_tier.net_micros,
                    buys_moved_polls: PRICE_CARD.manual_tier.buys_moved_polls,
                },
            ],
            instructions: "Operator-managed grants in v0.2; x402 self-service lands in Phase 4.",
        },
    },
}));
// ── Resolve (Phase 0 fix F1: honest 503, never a bare 500) ──────────
app.post("/v1/resolve", (c) => errorByCode(c, "resolution_unavailable", {
    message: "Live task resolution requires the graph adapter (Phase 1). Use /v1/catalog.",
}));
// ── Metered routes ──────────────────────────────────────────────────
// Dual rail. A prepaid credential pays from the balance; a request with no
// credential gets a 402 quoting this exact call so a wallet can pay for it.
// Pricing follows the answer, not the request: "nothing moved" is the cheap path.
function treasury(): string | null {
    const value = env("PLEIADES_TREASURY")?.trim();
    return value ? value : null;
}
/**
 * Metering is off until it is deliberately switched on. The charging path is
 * built and tested, but turning it on makes every anonymous caller a 402 and
 * every caller without a key unable to read a pack — so it ships behind a flag
 * rather than as a side effect of a deploy.
 */
function meteringEnabled(): boolean {
    return (env("PLEIADES_METERING") ?? "off").trim().toLowerCase() === "on";
}
async function meteredCall(c: Context, call: "poll" | "delta") {
    const input = await c.req.json().catch(() => null);
    const parsed = PollRequestSchema.safeParse(input);
    if (!parsed.success) {
        return errorByCode(c, "invalid_request", { detail: parsed.error.issues });
    }
    const beatId = parsed.data.beat_id;
    if (!SEED_BEATS.some((b) => b.beat_id === beatId)) {
        return errorByCode(c, "beat_unavailable");
    }
    if (!hasSupabaseEnv())
        return errorByCode(c, "database_not_configured");
    const db = createSupabaseClient();
    if (!db)
        return errorByCode(c, "database_not_configured");
    // Validate the credential before looking at any data, so a bad key is a 401
    // whether or not a pack happens to exist for this beat.
    const { agent, rejected } = await authenticate(db, c);
    if (rejected)
        return errorByCode(c, "invalid_credential");
    let snapshot;
    try {
        snapshot = await getPollSnapshot(beatId, parsed.data.cursor);
    }
    catch (error) {
        console.error(`${call} snapshot failed:`, error);
        return errorByCode(c, "internal_error");
    }
    if (!snapshot) {
        return errorByCode(c, "pack_not_ready", {
            message: "No packs yet for this beat. Ingestion produces them on its schedule.",
        });
    }
    // Metering off: the public rail behaves as it did before the meter existed.
    if (!meteringEnabled())
        return c.json(snapshot);
    const priceMicros = Number(snapshot.moved ? PRICE_CARD.calls.poll_moved : PRICE_CARD.calls.poll_empty);
    const resource = `${call.toUpperCase()} /v1/${call}`;
    if (!agent) {
        return c.json(x402Challenge({
            resource,
            amountMicros: priceMicros,
            payTo: treasury(),
            description: `Pleiades ${call} for ${beatId}.`,
        }), 402);
    }
    let charge;
    try {
        charge = await chargeCall(db, { agentId: agent.agentId, micros: priceMicros, call, beatId });
    }
    catch (error) {
        console.error(`${call} charge failed:`, error);
        return errorByCode(c, "internal_error");
    }
    if (!charge.ok) {
        if (charge.reason === "insufficient_balance") {
            return c.json(x402Challenge({
                resource,
                amountMicros: priceMicros,
                payTo: treasury(),
                description: "Balance exhausted. Top up, or pay for this call over x402.",
            }), 402);
        }
        if (charge.reason === "daily_cap") {
            return errorByCode(c, "daily_cap", {
                daily_cap_micros: DEFAULT_DAILY_CAP_MICROS,
                spent_micros: charge.dailyMicros,
            });
        }
        if (charge.reason === "beat_cap") {
            return errorByCode(c, "beat_cap", {
                daily_beat_cap: DEFAULT_DAILY_BEAT_CAP,
                beats_today: charge.dailyBeats,
            });
        }
        return errorByCode(c, "invalid_credential");
    }
    // The ledger's receipt replaces the placeholder carried on the pack row.
    return c.json({ ...snapshot, receipt_id: charge.receiptId });
}
app.post("/v1/poll", (c) => meteredCall(c, "poll"));
app.post("/v1/delta", (c) => meteredCall(c, "delta"));
// ── Account: balance, receipts, deposits ────────────────────────────
async function requireAgent(c: Context) {
    if (!hasSupabaseEnv())
        return { error: errorByCode(c, "database_not_configured") } as const;
    const db = createSupabaseClient();
    if (!db)
        return { error: errorByCode(c, "database_not_configured") } as const;
    const { agent, rejected } = await authenticate(db, c);
    if (rejected || !agent)
        return { error: errorByCode(c, "invalid_credential") } as const;
    return { db, agent } as const;
}
app.get("/v1/balance", async (c) => {
    const ctx = await requireAgent(c);
    if ("error" in ctx)
        return ctx.error;
    try {
        const snapshot = await getBalance(ctx.db, ctx.agent.agentId);
        if (!snapshot)
            return errorByCode(c, "internal_error");
        return c.json({
            agent_id: snapshot.agentId,
            balance_micros: snapshot.balanceMicros,
            currency: "USD",
            unit: "micros",
            today: { calls: snapshot.callsToday, micros: snapshot.microsToday, beats: snapshot.beatsToday },
            caps: { daily_cap_micros: DEFAULT_DAILY_CAP_MICROS, daily_beat_cap: DEFAULT_DAILY_BEAT_CAP },
            low_balance: isLowBalance(snapshot.balanceMicros),
        });
    }
    catch (error) {
        console.error("balance failed:", error);
        return errorByCode(c, "internal_error");
    }
});
app.get("/v1/receipts", async (c) => {
    const ctx = await requireAgent(c);
    if ("error" in ctx)
        return ctx.error;
    const since = c.req.query("since");
    if (since && Number.isNaN(Date.parse(since))) {
        return errorByCode(c, "invalid_since", { detail: "since must be an ISO 8601 timestamp" });
    }
    try {
        return c.json({ receipts: await listReceipts(ctx.db, ctx.agent.agentId, since) });
    }
    catch (error) {
        console.error("receipts failed:", error);
        return errorByCode(c, "internal_error");
    }
});
app.get("/v1/tokens", (c) => {
    const network = c.req.query("network") ?? "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";
    const table = SOLANA_MINTS[network as keyof typeof SOLANA_MINTS];
    if (!table)
        return errorByCode(c, "unsupported_rail", { detail: `unknown network ${network}` });
    return c.json({
        network,
        settlement: treasury() ? "facilitator" : "unavailable",
        tokens: Object.entries(table).map(([symbol, mint]) => ({
            symbol,
            mint,
            decimals: TOKEN_DECIMALS[symbol as keyof typeof TOKEN_DECIMALS],
            native: mint === "",
        })),
        min_deposit_micros: MIN_DEPOSIT_MICROS,
    });
});
app.get("/v1/deposits", async (c) => {
    const ctx = await requireAgent(c);
    if ("error" in ctx)
        return ctx.error;
    try {
        const rows = await listDepositIntents(ctx.db, ctx.agent.agentId);
        return c.json({ deposits: rows.map((row) => toPublicIntent(row, treasury() ?? "")) });
    }
    catch (error) {
        console.error("deposit list failed:", error);
        return errorByCode(c, "internal_error");
    }
});
app.get("/v1/deposits/:id", async (c) => {
    const ctx = await requireAgent(c);
    if ("error" in ctx)
        return ctx.error;
    try {
        const row = await getDepositIntent(ctx.db, c.req.param("id"));
        if (!row || row.agent_id !== ctx.agent.agentId)
            return errorByCode(c, "invalid_request", { detail: "not_found" });
        return c.json(toPublicIntent(row, treasury() ?? ""));
    }
    catch (error) {
        console.error("deposit read failed:", error);
        return errorByCode(c, "internal_error");
    }
});
app.post("/v1/deposits", async (c) => {
    const ctx = await requireAgent(c);
    if ("error" in ctx)
        return ctx.error;
    const body = await c.req.json().catch(() => ({}));
    const parsed = DepositRequestSchema.safeParse(body ?? {});
    if (!parsed.success) {
        return errorByCode(c, "invalid_request", { detail: parsed.error.issues });
    }
    const symbol = parsed.data.symbol ?? "USDC";
    const fromUi = parsed.data.amount_ui ? Math.round(Number(parsed.data.amount_ui) * 1e6) : null;
    const amountMicros = parsed.data.amount_micros ?? fromUi ?? MIN_DEPOSIT_MICROS;
    if (!Number.isFinite(amountMicros) || amountMicros < MIN_DEPOSIT_MICROS) {
        return errorByCode(c, "invalid_request", {
            detail: `minimum deposit is ${MIN_DEPOSIT_MICROS} micros ($${MIN_DEPOSIT_MICROS / 1e6})`,
        });
    }
    const payTo = treasury();
    if (!payTo) {
        return errorByCode(c, "unsupported_rail", {
            message: "The Solana rail is not configured: no treasury address is set.",
        });
    }
    try {
        const intent = await createDepositIntent(ctx.db, {
            agentId: ctx.agent.agentId,
            symbol,
            amountMicros,
            treasury: payTo,
        });
        return c.json({ ...intent, recipient: payTo, pay_url: toPublicIntent({
            ...intent,
            created_at: new Date().toISOString(),
        }, payTo).pay_url }, 201);
    }
    catch (error) {
        console.error("deposit create failed:", error);
        return errorByCode(c, "internal_error");
    }
});
// ── Webhooks (Phase 2) ──────────────────────────────────────────────
// Single-operator mode until workspaces land (Phase 6): no per-agent
// scoping yet. The secret is returned exactly once, at registration.
app.post("/v1/webhooks", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = WebhookRegistrationRequestSchema.safeParse(body);
    if (!parsed.success) {
        return errorByCode(c, "invalid_request", { detail: parsed.error.issues });
    }
    const { url, beat_ids } = parsed.data;
    const target = new URL(url);
    if (target.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(target.hostname)) {
        return errorByCode(c, "invalid_request", { detail: "url must be https" });
    }
    const unknown = beat_ids.filter((id) => !SEED_BEATS.some((b) => b.beat_id === id));
    if (unknown.length > 0) {
        return errorByCode(c, "beat_unavailable", { detail: unknown });
    }
    if (!hasSupabaseEnv())
        return errorByCode(c, "database_not_configured");
    const db = createSupabaseClient();
    if (!db)
        return errorByCode(c, "database_not_configured");
    const secret = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    try {
        const row = await insertWebhook(db, { url, beat_ids, hmac_secret: secret });
        return c.json(WebhookRegisteredSchema.parse({
            webhook_id: row.webhook_id,
            url: row.url,
            beat_ids: row.beat_ids,
            state: row.state,
            created_at: row.created_at,
            secret,
        }), 201);
    }
    catch (error) {
        console.error("webhook registration failed:", error);
        return errorByCode(c, "internal_error");
    }
});
app.get("/v1/webhooks", async (c) => {
    if (!hasSupabaseEnv())
        return errorByCode(c, "database_not_configured");
    const db = createSupabaseClient();
    if (!db)
        return errorByCode(c, "database_not_configured");
    try {
        return c.json({ webhooks: await listWebhooks(db) });
    }
    catch (error) {
        console.error("webhook list failed:", error);
        return errorByCode(c, "internal_error");
    }
});
app.delete("/v1/webhooks/:id", async (c) => {
    const id = c.req.param("id");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        return errorByCode(c, "invalid_request", { detail: "webhook_id must be a uuid" });
    }
    if (!hasSupabaseEnv())
        return errorByCode(c, "database_not_configured");
    const db = createSupabaseClient();
    if (!db)
        return errorByCode(c, "database_not_configured");
    try {
        await revokeWebhook(db, id);
        return c.json({ webhook_id: id, state: "revoked" });
    }
    catch (error) {
        console.error("webhook revoke failed:", error);
        return errorByCode(c, "internal_error");
    }
});
// ── Docs & spec ─────────────────────────────────────────────────────
app.get("/docs", (c) => c.json({
    guide: "https://github.com/pleiades/pleiades/tree/main/docs",
    openapi: "/openapi.json",
    roadmap: "https://github.com/pleiades/pleiades/blob/main/docs/ROADMAP.md",
}));
app.get("/openapi.json", (c) => c.json(openapi));
// JSON 404 fallback.
app.notFound((c) => errorByCode(c, "invalid_request", { detail: "not_found" }));
export default app;
