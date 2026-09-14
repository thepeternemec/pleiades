export const metadata = { title: "Payment on Solana" };

export default function DocsPayment() {
  return (
    <>
      <div className="docs-head">
        <h1>Payment on Solana</h1>
        <p className="docs-lead">
          Two rails onto one balance. x402 buys a single call from a wallet with no account at all;
          a deposit funds a balance so calls can skip the chain entirely.
        </p>
      </div>

      <h2>Why the split matters</h2>
      <p>
        An empty poll costs $0.0005. Settling that on-chain per call would cost more in latency than
        the call is worth, and would force a wallet signature per wake-up. So the chain settles{" "}
        <em>deposits</em>, and calls draw against a balance.
      </p>
      <p>
        The exception is an agent that has no account and does not want one. For that case x402
        lets it pay for a single call, on the spot, and never talk to us beforehand.
      </p>

      <h2>Rail A — x402</h2>
      <p>
        Call any metered route without a credential and you get a <code>402</code> describing exactly
        what to pay. The quote is bound to the resource, so a payment cannot be replayed against a
        different call.
      </p>
      <div className="code">
        <div className="code-bar">HTTP 402 Payment Required · Solana</div>
        <pre>{`{
  "x402Version": 2,
  "error": "payment_required",
  "settlement": "facilitator",
  "accepts": [{
    "scheme": "exact",
    "network": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
    "asset": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "pay_to": "<treasury>",
    "max_amount_required": "4000",
    "resource": "POST /v1/poll",
    "description": "Pleiades poll for b_bb964843350e."
  }]
}`}</pre>
      </div>
      <p>
        Sign the USDC transfer, then retry the identical request with the payment attached:
      </p>
      <div className="code">
        <div className="code-bar">retry with payment</div>
        <pre>{`curl -X POST https://…/v1/poll \\
  -H "Content-Type: application/json" \\
  -H "X-PAYMENT: <base64 signed transaction>" \\
  -d '{"beat_id":"b_bb964843350e"}'`}</pre>
      </div>
      <p>
        The network maps to CAIP-2 <code>solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp</code>, the asset
        is the USDC SPL mint, and the fee is covered by the facilitator rather than the caller.
      </p>
      <p>
        <strong>Honest note:</strong> one call is one payment on this rail. At $0.0005 a call that is
        only economical because the fee sits with the facilitator. Batched settlement is on the
        roadmap, and until it ships the prepaid rail is the cheaper path for anything that polls
        regularly.
      </p>

      <h2>Rail B — a prepaid balance</h2>
      <p>
        Create a deposit, pay it from any Solana wallet, and the credits land when the transfer
        confirms. After that, calls draw micros from the balance with no signature.
      </p>
      <div className="code">
        <div className="code-bar">POST /v1/deposits · 201 Created</div>
        <pre>{`{
  "deposit_id": "dep_01JQ8ZK4M2X",
  "rail": "solana",
  "network": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
  "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "symbol": "USDC",
  "amount_ui": "5",
  "reference": "7Yq3mQbK1sVpNcRfH2xWtZ9dLgUeA4nT6jPkM8vBsXo",
  "expires_at": "2026-09-12T12:30:00Z",
  "pay_url": "solana:<treasury>?amount=5&spl-token=EPjF…&reference=7Yq3…&label=Pleiades&message=API%20credits"
}`}</pre>
      </div>
      <p>
        <code>pay_url</code> is a Solana Pay transfer request. Hand it to a wallet or render it as a
        QR code and the wallet composes the transaction for you.
      </p>

      <h3>Why the reference key exists</h3>
      <p>
        <code>reference</code> is a fresh, unique, base58 32-byte value for every deposit. The wallet
        attaches it to the transfer as a read-only account, and Solana validators index transactions
        by account key — so <code>getSignaturesForAddress(reference)</code> returns exactly the
        payment for one deposit. That is how a transfer with no memo and no identifying detail is
        matched to the right account.
      </p>

      <h3>What we check before crediting</h3>
      <p>All six must hold. Anything else is parked for manual review and never auto-credited.</p>
      <table>
        <thead>
          <tr>
            <th>Check</th>
            <th>Why</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Reference matches an open intent</td>
            <td>Ties the transfer to one deposit</td>
          </tr>
          <tr>
            <td>Recipient is the treasury</td>
            <td>Otherwise it is someone else&rsquo;s payment</td>
          </tr>
          <tr>
            <td>Mint matches exactly</td>
            <td>A wrong mint cannot be reversed by us</td>
          </tr>
          <tr>
            <td>Amount is at least the intent</td>
            <td>Overpayment credits what actually arrived</td>
          </tr>
          <tr>
            <td>Signature has not been used</td>
            <td>The same transfer can be presented twice before it confirms</td>
          </tr>
          <tr>
            <td>Commitment is at least confirmed</td>
            <td>A processed transaction can still be dropped</td>
          </tr>
        </tbody>
      </table>

      <h2>Tokens accepted</h2>
      <div className="code">
        <div className="code-bar">GET /v1/tokens</div>
        <pre>{`{
  "network": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
  "settlement": "facilitator",
  "tokens": [
    { "symbol": "USDC", "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", "decimals": 6, "native": false },
    { "symbol": "USDT", "mint": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", "decimals": 6, "native": false },
    { "symbol": "SOL",  "mint": "",                                                  "decimals": 9, "native": true }
  ],
  "min_deposit_micros": 1000000
}`}</pre>
      </div>
      <p>
        Credits are always held in USD micros, whatever you paid with. The exchange rate is recorded
        on the deposit row, so history never re-prices. The minimum deposit is $1 and credits never
        expire.
      </p>

      <h2>Receipts</h2>
      <p>
        Every metered call and every credited deposit writes a receipt. Receipts are for
        reconciliation, and they are not for citations.
      </p>
      <div className="code">
        <div className="code-bar">GET /v1/receipts?since=2026-09-12T00:00:00Z</div>
        <pre>{`{
  "receipts": [
    { "receipt_id": "r_92e37a963847477390cd", "call": "poll",    "beat_id": "b_bb964843350e", "amount_micros": 4000, "rail": "prepaid", "settled_at": "2026-09-12T07:00:12Z" },
    { "receipt_id": "r_dep_3f1a…",            "call": "deposit", "beat_id": "",               "amount_micros": 5000000, "rail": "solana", "settled_at": "2026-09-12T06:12:03Z" }
  ]
}`}</pre>
      </div>
      <p>
        A receipt points at Pleiades. A citation points at the publisher. The two identifiers never
        merge, and the URL you show a user should always be the publisher&rsquo;s.
      </p>

      <h2>Current state</h2>
      <p>
        Identity, balance, metering, receipts and deposit intents are built and verified. The deposit
        watcher and x402 settlement are not: they need a treasury address and an RPC provider.
        Until a treasury is configured, <code>POST /v1/deposits</code> returns{" "}
        <code>unsupported_rail</code> rather than a payment URL that would send funds nowhere.
      </p>
      <p>
        Metering is also off by default. While it is off, calls are free and no receipt is written,
        so you can integrate before billing exists.
      </p>

      <h2>The token, if it ships</h2>
      <p>
        The Pleiades token would exist to buy API credits and nothing else. That is a commitment
        about how it will be described as much as about what it does, so it is written down here.
      </p>
      <table>
        <thead>
          <tr>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>What it would be</strong>
            </td>
            <td>
              A standard SPL token on Solana with a fixed supply and no mint authority, accepted as
              one more deposit rail beside USDC, USDT and SOL.
            </td>
          </tr>
          <tr>
            <td>
              <strong>What it would buy</strong>
            </td>
            <td>
              API credits, priced in USD at the moment you deposit, recorded on the receipt so
              history never re-prices.
            </td>
          </tr>
          <tr>
            <td>
              <strong>What it would never be</strong>
            </td>
            <td>
              Not a share, not a yield, not a claim on revenue. No promised market, no buyback, no
              presale. It is a key to a meter.
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Why the rail matters</h2>
      <p>
        Card processing is built for a person buying something once, and it is priced accordingly.
        A metered machine call is not that, and pricing it like one is what makes sub-cent answers
        impossible.
      </p>
      <ul>
        <li>A $5 card top-up loses roughly 9% to processing — about $0.45</li>
        <li>The same $5 in USDC on Solana costs about 0.016% — about $0.0008</li>
        <li>
          An agent that cannot hold a card can hold a wallet, which is what lets it buy its own news
          with no human in the loop
        </li>
      </ul>

      <div className="docs-nav-foot">
        <a href="/docs/data">← Beats and clusters</a>
        <a href="/docs/limits">Limits and invariants →</a>
      </div>
    </>
  );
}
