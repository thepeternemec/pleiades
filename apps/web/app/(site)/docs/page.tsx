export const metadata = { title: "Overview" };

export default function DocsOverview() {
  return (
    <>
      <div className="docs-head">
        <h1>Pleiades documentation</h1>
        <p className="docs-lead">
          Pleiades watches 150,000 publishers and answers one question on a schedule: has this
          topic moved since I last looked? This is how to call it, and how to pay for it.
        </p>
      </div>

      <h2>The shape of an integration</h2>
      <p>
        An agent picks a topic, keeps a cursor, and asks whether anything changed. It never reads a
        feed, and it never re-reads what it has already seen.
      </p>
      <ul>
        <li>
          <strong>Pick a beat.</strong> A beat is a saved topic with its own article cluster.
        </li>
        <li>
          <strong>Poll it.</strong> You get back <code>moved:false</code>, or a small pack of new
          articles.
        </li>
        <li>
          <strong>Keep the cursor.</strong> It is opaque, signed and beat-bound. Store it; it is how
          you avoid repeats.
        </li>
        <li>
          <strong>Cite the publisher.</strong> Packs never contain article bodies, only a lede and a
          source URL.
        </li>
      </ul>

      <h2>Two ways to pay</h2>
      <p>
        Both land in the same balance, and both return a receipt you can reconcile.
      </p>
      <table>
        <thead>
          <tr>
            <th>Rail</th>
            <th>Best for</th>
            <th>How it works</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Pay as you go</strong>
            </td>
            <td>Evaluation, and agents that call occasionally</td>
            <td>
              Each call is billed to the account that made it. A call with no credential returns{" "}
              <code>402</code> with a quote for that call.
            </td>
          </tr>
          <tr>
            <td>
              <strong>Prepaid balance</strong>
            </td>
            <td>A desk that polls the same beats every hour</td>
            <td>
              Top up once and calls draw down from the balance, with no per-call payment step.
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        The full mechanics, including the challenge shape and the deposit flow, are in{" "}
        <a href="/docs/billing">Billing and metering</a>.
      </p>

      <h2>What is live today</h2>
      <p>
        We would rather you know the line than discover it. This table is the honest state of the
        service, and the site never claims more than this.
      </p>
      <table>
        <thead>
          <tr>
            <th>Capability</th>
            <th>State</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Catalog, agent tool schema, pricing, stats</td>
            <td>Live</td>
          </tr>
          <tr>
            <td>
              <code>poll</code> and <code>delta</code> against persisted packs
            </td>
            <td>Live</td>
          </tr>
          <tr>
            <td>Receipts, balance and metered charging</td>
            <td>Built; off by default</td>
          </tr>
          <tr>
            <td>Self-serve billing, MCP server</td>
            <td>Interface published, backend not yet wired</td>
          </tr>
          <tr>
            <td>
              <code>resolve</code>, <code>brief</code>, <code>watch</code>
            </td>
            <td>Not built</td>
          </tr>
          <tr>
            <td>Live ingestion</td>
            <td>Paused while the topic catalog is rebuilt</td>
          </tr>
        </tbody>
      </table>

      <h2>Next</h2>
      <ul>
        <li>
          <a href="/docs/quickstart">Quickstart</a> — a first call in about two minutes.
        </li>
        <li>
          <a href="/docs/contract">The contract</a> — verbs, pack shape and cursors.
        </li>
        <li>
          <a href="/docs/billing">Billing and metering</a> — how charges, top-ups and receipts work.
        </li>
      </ul>

      <div className="docs-nav-foot">
        <span />
        <a href="/docs/quickstart">Quickstart →</a>
      </div>
    </>
  );
}
