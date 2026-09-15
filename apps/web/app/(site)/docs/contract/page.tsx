export const metadata = { title: "The contract" };

export default function DocsContract() {
  return (
    <>
      <div className="docs-head">
        <h1>The contract</h1>
        <p className="docs-lead">
          Five verbs, one cursor. Field names freeze once a version ships, and every identifier in
          mono is exact.
        </p>
      </div>

      <h2>The verbs</h2>
      <table>
        <thead>
          <tr>
            <th>Verb</th>
            <th>Asks</th>
            <th>Returns</th>
            <th>Price</th>
            <th>State</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>POST /v1/resolve</code>
            </td>
            <td>A task in English</td>
            <td>Stable <code>beat_id</code>, warm first</td>
            <td>Free to 100/day</td>
            <td>Not built</td>
          </tr>
          <tr>
            <td>
              <code>POST /v1/poll</code>
            </td>
            <td>Has this beat moved?</td>
            <td>
              <code>moved:false</code> or a pack
            </td>
            <td>$0.0005 / $0.004</td>
            <td>Live</td>
          </tr>
          <tr>
            <td>
              <code>POST /v1/delta</code>
            </td>
            <td>What exactly, since the cursor?</td>
            <td>Items newer than the high-water mark</td>
            <td>$0.004 / $0.02</td>
            <td>Live</td>
          </tr>
          <tr>
            <td>
              <code>POST /v1/brief</code>
            </td>
            <td>A human asked a question</td>
            <td>3–6 cited sentences plus a pack</td>
            <td>$0.03</td>
            <td>Not built</td>
          </tr>
          <tr>
            <td>
              <code>POST /v1/watch</code>
            </td>
            <td>Keep this beat warm</td>
            <td>24-hour hold at 60 or 15 minutes</td>
            <td>$0.15–$0.50</td>
            <td>Not built</td>
          </tr>
        </tbody>
      </table>
      <p>
        You only need <code>poll</code> to start. <code>delta</code> is for when a pack is not
        enough and you want every item since a timestamp.
      </p>

      <h2>What a pack is</h2>
      <p>
        A pack is the smallest object that lets a model write one correct, cited sentence. It is not
        an article list, and it deliberately is not a feed.
      </p>
      <ul>
        <li>At most 8 items, whichever is fewer after ranking</li>
        <li>Each lede is capped at 320 characters — a citation, not a reproduction</li>
        <li>A bounded token estimate, never above 800, so a poll fits a small context window</li>
        <li>
          No <code>body</code> field exists at any price on this rail
        </li>
      </ul>

      <h3>Item fields</h3>
      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Meaning</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>lede</code>
            </td>
            <td>Up to 320 characters, taken from the publisher</td>
          </tr>
          <tr>
            <td>
              <code>url</code>
            </td>
            <td>The publisher&rsquo;s own URL. This is what you cite.</td>
          </tr>
          <tr>
            <td>
              <code>source</code>
            </td>
            <td>Publisher name</td>
          </tr>
          <tr>
            <td>
              <code>published_at</code>
            </td>
            <td>When the publisher says it went out</td>
          </tr>
          <tr>
            <td>
              <code>first_indexed_at</code>
            </td>
            <td>When Pleiades first saw it — the lead-time evidence</td>
          </tr>
          <tr>
            <td>
              <code>lang</code>
            </td>
            <td>
              Always <code>eng</code> on this rail
            </td>
          </tr>
          <tr>
            <td>
              <code>sentiment</code>
            </td>
            <td>−1 to 1, or null when unavailable</td>
          </tr>
          <tr>
            <td>
              <code>concepts</code>
            </td>
            <td>Concept URIs matched in the article</td>
          </tr>
        </tbody>
      </table>

      <h2>The cursor</h2>
      <p>
        A cursor is an opaque, signed reference to a high-water mark on one beat. Treat it as a
        token, not a value.
      </p>
      <ul>
        <li>It is beat-bound: using it against a different beat is an error, not a silent miss</li>
        <li>It advances only when a pack is actually served, so a failed call cannot skip items</li>
        <li>It never needs to be parsed, sorted or compared</li>
        <li>
          A stale cursor is safe — it simply returns items you have already seen. A cursor from the
          future is rejected with <code>future_cursor</code>.
        </li>
      </ul>

      <h2>Errors</h2>
      <p>
        Errors are JSON with a stable <code>error</code> code. Branch on the code, never on the
        message.
      </p>
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>HTTP</th>
            <th>What to do</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>invalid_credential</code>
            </td>
            <td>401</td>
            <td>The key is unknown or revoked. Issue a new one.</td>
          </tr>
          <tr>
            <td>
              <code>insufficient_balance</code>
            </td>
            <td>402</td>
            <td>Top up, or settle this single call.</td>
          </tr>
          <tr>
            <td>
              <code>daily_cap</code>
            </td>
            <td>429</td>
            <td>You hit the daily spend ceiling. Stop until tomorrow.</td>
          </tr>
          <tr>
            <td>
              <code>beat_cap</code>
            </td>
            <td>429</td>
            <td>Too many distinct beats today. Cache more aggressively.</td>
          </tr>
          <tr>
            <td>
              <code>pack_not_ready</code>
            </td>
            <td>503</td>
            <td>No pack exists for this beat yet. Retry later.</td>
          </tr>
          <tr>
            <td>
              <code>invalid_cursor</code>, <code>cursor_beat_mismatch</code>,{" "}
              <code>future_cursor</code>
            </td>
            <td>400</td>
            <td>Drop the cursor and start again with <code>null</code>.</td>
          </tr>
          <tr>
            <td>
              <code>beat_unavailable</code>
            </td>
            <td>404</td>
            <td>The beat ID is not in the catalog.</td>
          </tr>
        </tbody>
      </table>

      <div className="docs-nav-foot">
        <a href="/docs/quickstart">← Quickstart</a>
        <a href="/docs/data">Beats and clusters →</a>
      </div>
    </>
  );
}
