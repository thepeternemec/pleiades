export const metadata = { title: "Limits and invariants" };

export default function DocsLimits() {
  return (
    <>
      <div className="docs-head">
        <h1>Limits and invariants</h1>
        <p className="docs-lead">
          The caps are enforced, not advisory. The invariants are constraints on us, and they are
          what make a cursor worth storing and a price worth trusting.
        </p>
      </div>

      <h2>Hard limits</h2>
      <table>
        <thead>
          <tr>
            <th>Limit</th>
            <th>Value</th>
            <th>Enforced where</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Items per pack</td>
            <td>8</td>
            <td>Response schema and the pack table</td>
          </tr>
          <tr>
            <td>Lede length</td>
            <td>320 characters</td>
            <td>Database check constraint</td>
          </tr>
          <tr>
            <td>Token estimate per pack</td>
            <td>800</td>
            <td>Pack builder</td>
          </tr>
          <tr>
            <td>Depth on the agent rail</td>
            <td>30 days</td>
            <td>Ingestion and query</td>
          </tr>
          <tr>
            <td>Default daily spend</td>
            <td>$0.50 per identity</td>
            <td>
              <code>charge_call()</code>, before the debit
            </td>
          </tr>
          <tr>
            <td>Distinct beats per day</td>
            <td>50 per identity</td>
            <td>
              <code>charge_call()</code>, before the debit
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        Caps exist because a looping tool call is the default failure mode of an agent, not a
        theoretical risk. A misconfigured loop hits a wall instead of an invoice.
      </p>

      <h2>What happens when you hit one</h2>
      <p>
        The refusal is atomic. Caps, the debit, the receipt and the usage counters commit in a single
        transaction, so a refused charge cannot leave a half-applied state.
      </p>
      <div className="code">
        <div className="code-bar">429 Too Many Requests</div>
        <pre>{`{
  "error": "daily_cap",
  "daily_cap_micros": 500000,
  "spent_micros": 500000
}`}</pre>
      </div>
      <p>
        An exhausted balance is different from a cap: it returns <code>402</code> with an x402 quote,
        because one more call is still purchasable.
      </p>

      <h2>The invariants</h2>
      <table>
        <thead>
          <tr>
            <th>Invariant</th>
            <th>What it means</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>No raw keys</td>
            <td>
              You never receive an upstream publisher key, and you never see the query language
              underneath. Beats are the whole interface.
            </td>
          </tr>
          <tr>
            <td>No bodies</td>
            <td>
              Packs never contain full article text. No <code>body</code> field exists at any price.
            </td>
          </tr>
          <tr>
            <td>Two rails, one balance</td>
            <td>
              x402 buys a single call from a wallet; a funded balance skips the chain per call. Both
              land in the same ledger.
            </td>
          </tr>
          <tr>
            <td>Resolve stays cheap</td>
            <td>The front door is free or near-free, permanently. Never meter the funnel.</td>
          </tr>
          <tr>
            <td>Deterministic beats</td>
            <td>Two agents describing the same task reach the same beat ID.</td>
          </tr>
          <tr>
            <td>Citations are not receipts</td>
            <td>
              Publishers own provenance; we own payment. The identifiers never merge.
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Agent rail and desk rail</h2>
      <p>
        The dividing line is time depth, not content depth. If a fund could replace a six-figure
        archive contract with forty dollars of metered agent calls, the new rail would eat the
        business it was meant to extend.
      </p>
      <table>
        <thead>
          <tr>
            <th>Need</th>
            <th>Agent rail</th>
            <th>Desk rail</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Question</td>
            <td>What is happening on this?</td>
            <td>Everything about this over time</td>
          </tr>
          <tr>
            <td>Depth</td>
            <td>30 days</td>
            <td>2014 onward</td>
          </tr>
          <tr>
            <td>Shape</td>
            <td>Pack of up to 8 ledes</td>
            <td>Export, bodies, ranges</td>
          </tr>
          <tr>
            <td>Cite</td>
            <td>Publisher URL</td>
            <td>Contracted feed</td>
          </tr>
        </tbody>
      </table>

      <h2>Connecting an agent</h2>
      <p>
        The API also exposes an OpenAI-compatible tool schema and an MCP server, both of which hit
        the same handlers as the REST routes.
      </p>
      <div className="code">
        <div className="code-bar">GET /v1/tools · OpenAI-compatible</div>
        <pre>{`{
  "tools": [{
    "type": "function",
    "function": {
      "name": "pleiades_poll",
      "description": "Ask whether a beat has moved since the cursor.",
      "parameters": {
        "type": "object",
        "properties": {
          "beat_id": { "type": "string" },
          "cursor": { "type": ["string", "null"] }
        },
        "required": ["beat_id"]
      }
    }
  }]
}`}</pre>
      </div>
      <div className="code">
        <div className="code-bar">MCP · same handlers</div>
        <pre>{`{
  "mcpServers": {
    "pleiades": {
      "url": "https://pleiades.news/mcp"
    }
  }
}`}</pre>
      </div>
      <p>
        The MCP server is published as an interface and is not served yet. Until it is,{" "}
        <code>GET /v1/tools</code> is the integration path.
      </p>

      <div className="docs-nav-foot">
        <a href="/docs/payment">← Payment on Solana</a>
        <a href="/faq">FAQ →</a>
      </div>
    </>
  );
}
