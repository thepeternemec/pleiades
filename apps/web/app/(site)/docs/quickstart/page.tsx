export const metadata = { title: "Quickstart" };

const API = "https://dnnoypytdfvsdenykooq.supabase.co/functions/v1/api";

export default function DocsQuickstart() {
  return (
    <>
      <div className="docs-head">
        <h1>Quickstart</h1>
        <p className="docs-lead">
          Three calls and a cursor. The catalog, the tool schema and pricing need no credential at
          all, so you can explore before you commit to anything.
        </p>
      </div>

      <h2>1. Find a beat</h2>
      <p>
        A beat is a saved topic. The catalog lists every one with a stable ID, the languages it
        covers and whether it is currently warm.
      </p>
      <div className="code">
        <div className="code-bar">GET /v1/catalog · no credential</div>
        <pre>{`curl ${API}/v1/catalog`}</pre>
      </div>
      <div className="code">
        <div className="code-bar">200 OK</div>
        <pre>{`{
  "beats": [
    {
      "beat_id": "b_bb964843350e",
      "label": "NVIDIA",
      "languages": ["eng"],
      "state": "warm",
      "refresh_interval_minutes": 60,
      "freshness_slo_minutes": 90
    }
  ]
}`}</pre>
      </div>

      <h2>2. Ask whether it moved</h2>
      <p>
        Send the beat and the cursor from your last call. On the first call, omit the cursor. You
        get one of exactly two answers.
      </p>
      <div className="code">
        <div className="code-bar">POST /v1/poll</div>
        <pre>{`curl -X POST ${API}/v1/poll \\
  -H "Content-Type: application/json" \\
  -d '{"beat_id":"b_bb964843350e","cursor":null}'`}</pre>
      </div>
      <div className="code">
        <div className="code-bar">200 OK · nothing moved</div>
        <pre>{`{
  "beat_id": "b_bb964843350e",
  "moved": false,
  "cursor": "c_eyJiIjoi…",
  "item_count": 0,
  "receipt_id": "r_92e37a963847477390cd"
}`}</pre>
      </div>
      <div className="code">
        <div className="code-bar">200 OK · moved</div>
        <pre>{`{
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
}`}</pre>
      </div>
      <p>
        <code>moved:false</code> is a successful answer, not an error. It costs a tenth of a moved
        poll, which is what makes asking every hour affordable.
      </p>

      <h2>3. Store the cursor</h2>
      <p>
        Every response carries a cursor. Send it back next time and you will only ever see articles
        you have not seen. It is opaque and beat-bound: it cannot be used against another beat, and
        it never needs to be parsed.
      </p>

      <h2>4. Pay for it</h2>
      <p>
        Calls are free while the meter is off. With it on, you either present a key and draw from a
        balance, or pay per call over x402. A request with no credential gets a quote for that exact
        call:
      </p>
      <div className="code">
        <div className="code-bar">402 Payment Required</div>
        <pre>{`{
  "x402Version": 2,
  "accepts": [{
    "scheme": "exact",
    "network": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
    "asset": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "max_amount_required": "4000",
    "resource": "POST /v1/poll"
  }]
}`}</pre>
      </div>

      <h2>Where to go next</h2>
      <ul>
        <li>
          <a href="/docs/contract">The contract</a> — every verb, the pack shape and the errors.
        </li>
        <li>
          <a href="/docs/data">Beats and clusters</a> — how the catalog is organised.
        </li>
        <li>
          <a href="/docs/payment">Payment on Solana</a> — x402, deposits and receipts.
        </li>
        <li>
          <a href="/docs/limits">Limits and invariants</a> — the caps you will hit, and the promises.
        </li>
      </ul>

      <div className="docs-nav-foot">
        <a href="/docs">← Overview</a>
        <a href="/docs/contract">The contract →</a>
      </div>
    </>
  );
}
