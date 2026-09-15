export const metadata = { title: "Billing and metering" };

export default function DocsBilling() {
  return (
    <>
      <div className="docs-head">
        <h1>Billing and metering</h1>
        <p className="docs-lead">
          You are charged for answers, not for requests. An empty check costs a twentieth of a
          cent, a real answer costs less than half a cent, and nothing is charged when a call is
          refused.
        </p>
      </div>

      <h2>How a charge happens</h2>
      <p>
        Every metered call debits a balance and writes a receipt, and both happen in the same
        database transaction as the usage counters. That means a call either charges once and
        returns an answer, or it charges nothing at all — there is no state where you are billed for
        something you did not receive.
      </p>
      <div className="code">
        <div className="code-bar">what a metered call returns</div>
        <pre>{`{
  "beat_id": "b_bb964843350e",
  "moved": true,
  "item_count": 3,
  "cursor": "c_eyJiIjoi…",
  "receipt_id": "r_92e37a963847477390cd"
}`}</pre>
      </div>
      <p>
        The <code>receipt_id</code> is the record of that charge. Keep it, or ignore it and fetch it
        later — it is queryable.
      </p>

      <h2>Two ways to pay</h2>
      <table>
        <thead>
          <tr>
            <th>Option</th>
            <th>How it works</th>
            <th>Best for</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Pay as you go</strong>
            </td>
            <td>Each call is billed to the account that made it. No balance to manage.</td>
            <td>Evaluation, and agents that call occasionally</td>
          </tr>
          <tr>
            <td>
              <strong>Prepaid balance</strong>
            </td>
            <td>
              Top up once, then calls draw down from the balance with no per-call payment step.
            </td>
            <td>Anything that polls on a schedule</td>
          </tr>
        </tbody>
      </table>

      <h2>Topping up</h2>
      <p>
        Create a top-up and pay it. The endpoint returns the amount, the currency and a payment
        instruction your billing system or client can action, plus an expiry.
      </p>
      <div className="code">
        <div className="code-bar">POST /v1/deposits · 201 Created</div>
        <pre>{`{
  "deposit_id": "dep_01JQ8ZK4M2X",
  "amount_micros": 5000000,
  "currency": "USD",
  "symbol": "USD",
  "pay_url": "<payment instruction>",
  "expires_at": "2026-09-12T12:30:00Z",
  "state": "open"
}

// then watch it land:
GET /v1/balance
-> { "balance_micros": 5000000, "today": { "calls": 12, "micros": 48000 } }`}</pre>
      </div>
      <ul>
        <li>The minimum top-up is $1, and credits never expire</li>
        <li>Credits are held in integer USD micros, so nothing rounds away</li>
        <li>Overpayment credits exactly what arrived</li>
        <li>Stablecoin top-ups are accepted alongside card and invoice</li>
      </ul>
      <p>
        Top-ups are not self-serve yet. The endpoint is built and verified, but it returns{" "}
        <code>unsupported_rail</code> until an operator has configured a receiving account. While
        metering is switched off entirely, calls are free and no receipt is written, so you can
        integrate before billing exists.
      </p>

      <h2>Balance and receipts</h2>
      <div className="code">
        <div className="code-bar">GET /v1/balance</div>
        <pre>{`{
  "agent_id": "ag_9f2c…",
  "balance_micros": 4812000,
  "currency": "USD",
  "unit": "micros",
  "today": { "calls": 38, "micros": 62000, "beats": 4 },
  "caps": { "daily_cap_micros": 500000, "daily_beat_cap": 50 },
  "low_balance": false
}`}</pre>
      </div>
      <div className="code">
        <div className="code-bar">GET /v1/receipts?since=2026-09-12T00:00:00Z</div>
        <pre>{`{
  "receipts": [
    {
      "receipt_id": "r_92e37a963847477390cd",
      "call": "poll",
      "beat_id": "b_bb964843350e",
      "amount_micros": 4000,
      "rail": "prepaid",
      "settled_at": "2026-09-12T07:00:12Z"
    }
  ]
}`}</pre>
      </div>
      <p>
        A receipt points at us: what was called, for which topic, for how many micros. A citation
        points at the publisher. The two identifiers never merge, and the URL you show a user
        should always be the publisher&rsquo;s.
      </p>

      <h2>Caps</h2>
      <p>
        Caps are checked before the debit, not after, so a runaway loop cannot spend past them.
      </p>
      <table>
        <thead>
          <tr>
            <th>Cap</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Daily spend per identity</td>
            <td>$0.50</td>
          </tr>
          <tr>
            <td>Distinct topics per day</td>
            <td>50</td>
          </tr>
          <tr>
            <td>Depth on the agent rail</td>
            <td>30 days, hard</td>
          </tr>
        </tbody>
      </table>
      <p>
        An exhausted balance is treated differently from a cap: it returns <code>402</code> with a
        quote for that one call, because one more answer is still purchasable. A cap returns{" "}
        <code>429</code> and means stop until tomorrow.
      </p>

      <div className="docs-nav-foot">
        <a href="/docs/data">← Beats and clusters</a>
        <a href="/docs/limits">Limits and invariants →</a>
      </div>
    </>
  );
}
