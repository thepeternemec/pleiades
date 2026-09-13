import SiteNav from "@/components/site/site-nav";
import SiteFooter from "@/components/site/site-footer";
import { DEPOSIT_STEPS } from "@/components/site/content";

export default function Page() {
  return (
    <>
      <SiteNav active="/solana" />
      <main>
        <div className="page-head">
          <div className="wrap">
            <span className="sec-eyebrow">Solana</span>
            <h1 className="sec-title">Payment on Solana.</h1>
            <p className="sec-sub">x402 for an agent that carries its own wallet, and a deposit rail for a desk that polls on a schedule. Both land in one balance.</p>
          </div>
        </div>
        {/* 06 PAYMENT */}
        <section className="scaffold" id="settlement">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-eyebrow">
                06 · Payment <span className="eyebrow-tag" style={{ marginLeft: 8 }}>next</span>
              </span>
              <h2 className="sec-title">The agent pays its own way.</h2>
              <p className="sec-sub">
                Two rails onto one balance. x402 lets an agent buy a single call from its own
                Solana wallet with no account and no invoice. A deposit lets a desk fund an account
                once and draw down per call.
              </p>
            </div>

            <div className="showcase">
              <div>
                <span className="sec-eyebrow">Rail A · x402</span>
                <h3>402 is the whole signup.</h3>
                <p>
                  The agent calls poll, gets a 402 quoting that exact call in USDC, signs a Solana
                  transfer and retries. Nothing is issued to it beforehand — the payment is the
                  authentication, and the wallet is the account.
                </p>
                <ul>
                  <li>The quote is bound to the call: resource, amount, asset and network</li>
                  <li>The facilitator covers the Solana fee, so an empty poll stays cheap</li>
                  <li>Retry the identical request with the payment header and get the pack</li>
                  <li>Settlement is recorded, so one transaction can never pay twice</li>
                </ul>
              </div>
              <div className="code">
                <div className="code-bar">HTTP 402 Payment Required · Solana</div>
                <pre>{`{
  "x402Version": 2,
  "accepts": [{
    "scheme": "exact",
    "network": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
    "asset": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "pay_to": "9xQeTreasury…",
    "max_amount_required": "4000",
    "resource": "POST /v1/poll"
  }]
}

// the agent signs the transfer, then retries:
POST /v1/poll
X-PAYMENT: <base64 signed transaction>
→ 200 OK · pack · 3 items · receipt r_01JQ8ZK4M2X`}</pre>
              </div>
            </div>

            <div className="showcase">
              <div className="code">
                <div className="code-bar">POST /v1/deposits · 201 Created</div>
                <pre>{`{
  "deposit_id": "dep_01JQ8ZK4M2X",
  "rail": "solana",
  "network": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
  "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "symbol": "USDC",
  "amount": "5.00",
  "reference": "7Yq3mQbK1sVpNcRfH2xWtZ9dLgUeA4nT6jPkM8vBsXo",
  "expires_at": "2026-09-12T12:30:00Z",
  "pay_url": "solana:9xQeTreasury…?amount=5&spl-token=EPjF…&reference=7Yq3…&label=Pleiades&message=API%20credits"
}`}</pre>
              </div>
              <div>
                <span className="sec-eyebrow">Rail B · prepaid</span>
                <h3>Fund once. Then skip the chain.</h3>
                <p>
                  A desk polling every hour should not sign a transaction every hour. Deposit USDC,
                  USDT or SOL once and calls draw micros from the balance instantly — no signature,
                  no fee, no waiting on a block.
                </p>
                <ul>
                  <li>USDC, USDT or SOL, credited in USD micros at the quoted rate</li>
                  <li>A unique reference key per deposit, so reconciliation is exact</li>
                  <li>Matched on mint, amount and recipient before anything is credited</li>
                  <li>Solana fees are a fraction of a cent, not 9% of a card top-up</li>
                </ul>
              </div>
            </div>

            <div className="features">
              {DEPOSIT_STEPS.map((step) => (
                <div key={step.n} className="feature" style={{ minHeight: 220 }}>
                  <span className="feature-icon">{step.n}</span>
                  <h3 className="feature-title">{step.title}</h3>
                  <p className="feature-desc">{step.desc}</p>
                  <span className="feature-tag">{step.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* THE TOKEN */}
        <section className="scaffold" id="token">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-eyebrow">
                The token <span className="eyebrow-tag" style={{ marginLeft: 8 }}>planned</span>
              </span>
              <h2 className="sec-title">A usage key. Not an investment.</h2>
              <p className="sec-sub">
                The Pleiades token exists to buy API credits and nothing else. If a description of
                it sounds like more than that, the description is wrong.
              </p>
            </div>

            <div className="showcase">
              <div>
                <h3>One token, one job: credits.</h3>
                <p>
                  Deposits are always credited in USD micros, whatever you pay with. Pay in USDC,
                  USDT, SOL or the Pleiades token; the token is converted at the quoted rate and
                  lands as credits, and the receipt records the rate that was used.
                </p>
                <ul>
                  <li>Standard SPL token on Solana, fixed supply, mint authority revoked</li>
                  <li>Accepted as a deposit rail beside USDC, USDT and SOL</li>
                  <li>No yield, no buyback, no claim on revenue, no promised market</li>
                  <li>Treasury and authorities held in a multisig, never a hot wallet</li>
                </ul>
              </div>
              <div className="mock">
                <div className="mock-bar">
                  <span className="mock-dots"><span /><span /><span /></span>
                  <span className="mock-title">token plan · not minted</span>
                </div>
                <div className="mock-feed">
                  <div className="mock-row">
                    <span className="k">Standard</span>
                    <span className="v">SPL Token, 6 decimals</span>
                    <span className="s">Solana</span>
                  </div>
                  <div className="mock-row">
                    <span className="k">Supply</span>
                    <span className="v">Fixed at mint, mint authority revoked</span>
                    <span className="s">no inflation</span>
                  </div>
                  <div className="mock-row">
                    <span className="k">Authority</span>
                    <span className="v">Multisig treasury, no upgrade path</span>
                    <span className="s">multisig</span>
                  </div>
                  <div className="mock-row">
                    <span className="k">Accepted as</span>
                    <span className="v">A deposit rail, quoted per deposit</span>
                    <span className="s">credits only</span>
                  </div>
                  <div className="mock-row">
                    <span className="k">Redeemable for</span>
                    <span className="v">API credits that never expire</span>
                    <span className="s">nothing else</span>
                  </div>
                </div>
                <div className="mock-foot">
                  <span>no presale promised</span>
                  <span style={{ marginLeft: "auto" }}>no market promised</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 07 RECEIPTS */}
        <section className="scaffold" id="receipts">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-eyebrow">
                07 · Receipts <span className="eyebrow-tag" style={{ marginLeft: 8 }}>next</span>
              </span>
              <h2 className="sec-title">Prove payment. Never provenance.</h2>
              <p className="sec-sub">
                GET /v1/receipts?since= will be the reconciliation view. When a model tells its user
                something it learned from a pack, the URL it shows is the publisher&rsquo;s — never
                ours.
              </p>
            </div>

            <div className="showcase">
              <div>
                <h3>Two identifiers that never merge.</h3>
                <p>
                  Receipts point at Pleiades: what was called, for which beat, for how many micros,
                  and when it settled. Citations point at publishers: the only thing a downstream
                  user should ever see.
                </p>
                <ul>
                  <li>Every metered call will return a receipt_id reconcilable in USD micros</li>
                  <li>Every item carries the publisher URL, source, timestamp and language</li>
                  <li>You are plumbing. Stay plumbing.</li>
                </ul>
              </div>
              <div className="code">
                <div className="code-bar">GET /v1/receipts?since=2026-09-09T00:00:00Z · next</div>
                <pre>{`receipt          call    beat              micros  settled
r_01JQ8ZK4M2X    delta   b_dab9c000dca5      4000  07:00:12Z
r_01JQ8ZK4N91    poll    b_bb964843350e       500  07:00:14Z
r_01JQ8ZK518C    poll    b_191edd8895e2       500  07:00:15Z
r_01JQ8ZL02AA    brief   b_dab9c000dca5     30000  08:12:03Z

// what the user should see — never our domain
The Commission opened consultation on GPAI transparency
obligations, with responses due 14 October.
https://www.reuters.com/…`}</pre>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
