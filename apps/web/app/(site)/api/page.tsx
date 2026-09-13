import SiteNav from "@/components/site/site-nav";
import SiteFooter from "@/components/site/site-footer";
import { LATENCY } from "@/components/site/content";

export default function Page() {
  return (
    <>
      <SiteNav active="/api" />
      <main>
        <div className="page-head">
          <div className="wrap">
            <span className="sec-eyebrow">API</span>
            <h1 className="sec-title">Wire it up.</h1>
            <p className="sec-sub">A REST contract that freezes, an OpenAI-compatible tool schema, and an MCP server that hits the same handlers.</p>
          </div>
        </div>
        {/* 08 INSTALL */}
        <section className="scaffold" id="install">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-eyebrow">08 · Install</span>
              <h2 className="sec-title">Boring tools survive model churn.</h2>
              <p className="sec-sub">
                An OpenAI-compatible tool schema ships today; an MCP server that hits the same
                handlers ships next. The open spec publishes beat_id canonicalisation, the pack
                schema and the five verbs — not the graph.
              </p>
            </div>

            <div className="showcase">
              <div>
                <h3>Resolve once, poll forever.</h3>
                <p>
                  A cron job, a wallet and two requests. If your agent can call a tool, it can hold
                  a beat through a news cycle without a human in the loop. Polling and delta work
                  today; resolve joins them with the canonicalisation spec.
                </p>
                <ul>
                  <li>Deterministic beats: the same task will hash to the same beat_id</li>
                  <li>Cursor comes back on every call — store it and never re-read</li>
                  <li>8 items and 800 tokens, enforced by the pack schema</li>
                </ul>
              </div>
              <div className="code">
                <div className="code-bar">// poll forever — live today</div>
                <pre>{`curl -s $PLEIADES/v1/poll \\
  -H "Content-Type: application/json" \\
  -d '{"beat_id":"b_bb964843350e","cursor":null}'

# resolve (task → beat_id) ships next
curl -s $PLEIADES/v1/resolve \\
  -H "Content-Type: application/json" \\
  -d '{"task":"I am writing a due diligence
       memo on Nvidia China exposure"}'

# x402 deposit + X-PAYMENT credential land with the meter`}</pre>
              </div>
            </div>

            <div className="showcase flip" style={{ alignItems: "start" }}>
              <div className="code">
                <div className="code-bar">GET /v1/tools · live</div>
                <pre>{`{
  "tools": [{
    "type": "function",
    "function": {
      "name": "pleiades_poll",
      "description": "Ask whether a beat has
        moved since the cursor. Prefer this
        on a schedule.",
      "parameters": {
        "type": "object",
        "properties": {
          "beat_id": { "type": "string" },
          "cursor": { "type": ["string","null"] }
        },
        "required": ["beat_id"]
      }
    }
  }]
}`}</pre>
              </div>
              <div className="code">
                <div className="code-bar">MCP · same handlers · next</div>
                <pre>{`// not served yet — GET /v1/tools is live today
{
  "mcpServers": {
    "pleiades": {
      "url": "https://pleiades.news/mcp",
      "headers": {
        "X-PAYMENT": "\${PLEIADES_CREDENTIAL}"
      }
    }
  }
}`}</pre>
              </div>
            </div>

            <div className="code" style={{ marginTop: 40 }}>
              <div className="code-bar">beat_id canonicalisation · public spec</div>
              <pre>{`canonical = sorted(concept_uris).join("|")
          + "::" + sorted(topic_filters).join("|")
          + "::" + sorted(languages).join("|")

beat_id = "b_" + sha256(canonical).hexdigest()[:12]

# Published so external implementations can converge on it.
# Not enforced yet: seeded beats carry literal ids until
# resolve ships. Changing it later breaks stored cursors.`}</pre>
            </div>
          </div>
        </section>

        {/* 04 LEAD TIME */}
        <section className="scaffold" id="lead-time">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-eyebrow">04 · Lead time</span>
              <h2 className="sec-title">The claim is a measurement.</h2>
              <p className="sec-sub">
                Minutes from publisher timestamp to first appearance in the index, against Exa,
                Tavily, Brave, Serper and Perplexity grounding. Every pack already carries its own
                evidence as first_indexed_at.
              </p>
            </div>

            <div className="mock">
              <div className="mock-bar">
                <span className="mock-dots"><span /><span /><span /></span>
                <span className="mock-title">median minutes · breaking sample · last 7d</span>
                <span className="mock-live">harness next</span>
              </div>
              <div className="mock-feed">
                {LATENCY.map((l) => (
                  <div key={l.name} className="mock-row">
                    <span className="k" style={l.us ? { color: "var(--text-primary)" } : undefined}>{l.name}</span>
                    <span className="v">
                      <span style={{ color: l.us ? "#fff" : "#5f5f5f" }}>{"█".repeat(l.fill)}</span>
                      <span style={{ color: "#242424" }}>{"░".repeat(20 - l.fill)}</span>
                    </span>
                    <span className="s" style={l.us ? { color: "var(--text-primary)" } : undefined}>{l.minutes}</span>
                  </div>
                ))}
              </div>
              <div className="mock-foot">
                <span>target board · illustrative until the public harness ships</span>
                <span style={{ marginLeft: "auto" }}>flat category → $0.004 is unsupportable</span>
              </div>
            </div>
            <p className="hero-tiny">
              a category that comes back flat is better learned in week six than month nine — the
              harness ships open source and runs on the same workers that serve the rail.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
