import SiteNav from "@/components/site/site-nav";
import SiteFooter from "@/components/site/site-footer";
import { DEPOSIT_STEPS } from "@/components/site/content";

export const metadata = {
  title: "Why Solana",
  description:
    "Pleiades is paid for on Solana: per call over x402 from an agent's own wallet, or drawn from a balance funded with USDC, USDT or SOL.",
};

export default function Solana() {
  return (
    <>
      <SiteNav active="/solana" />
      <main>
        <div className="page-head">
          <div className="wrap">
            <span className="sec-eyebrow">Why Solana</span>
            <h1 className="sec-title">Money that moves as fast as the news.</h1>
            <p className="sec-sub">
              No invoices, no seat licences, no 9% card fees. Your agent carries a wallet and buys
              exactly the answers it needs.
            </p>
          </div>
        </div>

        {/* TWO RAILS */}
        <section className="scaffold" id="rails">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-eyebrow">Two ways to pay</span>
              <h2 className="sec-title">Whatever suits your agent.</h2>
              <p className="sec-sub">
                An agent that has never met us can still buy a single answer. One that polls all day
                should not sign a transaction every hour. Both land in the same balance.
              </p>
            </div>

            <div className="showcase">
              <div>
                <span className="sec-eyebrow">Rail A · x402</span>
                <h3>Nothing to sign up for.</h3>
                <p>
                  The agent asks for an answer, we quote it in USDC, it pays from its wallet and asks
                  again. There is no key to issue and no account to create — the payment is the
                  authentication.
                </p>
                <ul>
                  <li>One call, one payment, settled on Solana</li>
                  <li>The network fee sits with the facilitator, not the agent</li>
                  <li>Works with any x402-capable wallet or agent framework</li>
                  <li>The quote is bound to the call, so it cannot be replayed</li>
                </ul>
              </div>
              <div className="mock">
                <div className="mock-bar">
                  <span className="mock-dots"><span /><span /><span /></span>
                  <span className="mock-title">x402 · pay per answer</span>
                </div>
                <div className="mock-feed">
                  <div className="mock-row">
                    <span className="k">agent asks</span>
                    <span className="v">has this moved?</span>
                    <span className="s">no charge</span>
                  </div>
                  <div className="mock-row">
                    <span className="k">we quote</span>
                    <span className="v">0.004 USDC · Solana</span>
                    <span className="s">402</span>
                  </div>
                  <div className="mock-row">
                    <span className="k">agent pays</span>
                    <span className="v">one transfer, its own wallet</span>
                    <span className="s">~0.4s</span>
                  </div>
                  <div className="mock-row">
                    <span className="k">agent retries</span>
                    <span className="v">same request, now paid</span>
                    <span className="s">200</span>
                  </div>
                </div>
                <div className="mock-foot">
                  <span>no account</span>
                  <span>no invoice</span>
                  <span style={{ marginLeft: "auto" }}>USDC on Solana</span>
                </div>
              </div>
            </div>

            <div className="showcase">
              <div className="mock">
                <div className="mock-bar">
                  <span className="mock-dots"><span /><span /><span /></span>
                  <span className="mock-title">prepaid · fund once, draw down</span>
                </div>
                <div className="mock-feed">
                  <div className="mock-row">
                    <span className="k">deposit</span>
                    <span className="v">5 USDC · one transfer</span>
                    <span className="s">once</span>
                  </div>
                  <div className="mock-row">
                    <span className="k">then 48 checks</span>
                    <span className="v">no signature, no fee, no waiting</span>
                    <span className="s">$0.14</span>
                  </div>
                  <div className="mock-row">
                    <span className="k">receipts</span>
                    <span className="v">every call, reconcilable in USD</span>
                    <span className="s">auditable</span>
                  </div>
                  <div className="mock-row">
                    <span className="k">top up</span>
                    <span className="v">whenever the balance runs low</span>
                    <span className="s">min $1</span>
                  </div>
                </div>
                <div className="mock-foot">
                  <span>cheapest per call</span>
                  <span style={{ marginLeft: "auto" }}>best for hourly polling</span>
                </div>
              </div>
              <div>
                <span className="sec-eyebrow">Rail B · prepaid</span>
                <h3>Fund once. Then skip the chain.</h3>
                <p>
                  A desk polling every hour should not sign a transaction every hour. Deposit USDC,
                  USDT or SOL once and calls draw micros from the balance instantly.
                </p>
                <ul>
                  <li>USDC, USDT or SOL, credited in USD at the quoted rate</li>
                  <li>A unique reference key per deposit, so nothing is ever misattributed</li>
                  <li>Credits never expire and the rate is recorded on the deposit</li>
                  <li>Solana fees are a fraction of a cent, not 9% of a card top-up</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* DEPOSIT FLOW */}
        <section className="scaffold" id="deposit">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-eyebrow">Funding it</span>
              <h2 className="sec-title">Three steps to a funded balance.</h2>
              <p className="sec-sub">
                Any Solana wallet works — Phantom, Solflare, Backpack, or anything that speaks
                Solana Pay.
              </p>
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
            <p className="more"><a href="/docs/payment">The full payment reference</a></p>
          </div>
        </section>

        {/* ECONOMICS */}
        <section className="scaffold" id="economics">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-eyebrow">The economics</span>
              <h2 className="sec-title">Where the other 9% goes.</h2>
              <p className="sec-sub">
                Card processing is priced for human purchases. Metered machine calls are not human
                purchases, and should not be priced like them.
              </p>
            </div>
            <div className="features">
              <div className="feature" style={{ minHeight: 200 }}>
                <h3 className="feature-title">A $5 card top-up</h3>
                <p className="feature-desc">
                  Loses roughly 9% to processing before it reaches us. On a $0.004 answer that fee
                  is larger than the thing you are buying.
                </p>
                <span className="feature-tag">≈ $0.45 lost</span>
              </div>
              <div className="feature" style={{ minHeight: 200 }}>
                <h3 className="feature-title">The same $5 in USDC on Solana</h3>
                <p className="feature-desc">
                  Costs about 0.016% and settles in under a second, which is why a per-call price of
                  four tenths of a cent is possible at all.
                </p>
                <span className="feature-tag">≈ $0.0008</span>
              </div>
              <div className="feature" style={{ minHeight: 200 }}>
                <h3 className="feature-title">Why it matters to an agent</h3>
                <p className="feature-desc">
                  An agent that cannot hold a card can hold a wallet. Paying per call is what lets it
                  buy its own news without a human in the loop.
                </p>
                <span className="feature-tag">machine-native payment</span>
              </div>
            </div>
          </div>
        </section>

        {/* TOKEN */}
        <section className="scaffold" id="token">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-eyebrow">
                The token <span className="eyebrow-tag" style={{ marginLeft: 8 }}>planned</span>
              </span>
              <h2 className="sec-title">A usage key. Not an investment.</h2>
              <p className="sec-sub">
                If the Pleiades token ships, it will exist to buy API credits and nothing else. Any
                description of it that sounds like more than that is wrong.
              </p>
            </div>
            <div className="features">
              <div className="feature" style={{ minHeight: 190 }}>
                <h3 className="feature-title">What it would be</h3>
                <p className="feature-desc">
                  A standard SPL token on Solana with a fixed supply and no mint authority, accepted
                  as one more deposit rail beside USDC, USDT and SOL.
                </p>
                <span className="feature-tag">fixed supply</span>
              </div>
              <div className="feature" style={{ minHeight: 190 }}>
                <h3 className="feature-title">What it would buy</h3>
                <p className="feature-desc">
                  API credits, priced in USD at the moment you deposit, and recorded on the receipt
                  so history never re-prices.
                </p>
                <span className="feature-tag">credits only</span>
              </div>
              <div className="feature" style={{ minHeight: 190 }}>
                <h3 className="feature-title">What it would never be</h3>
                <p className="feature-desc">
                  Not a share, not a yield, not a claim on revenue. No promised market, no buyback,
                  no presale. It is a key to a meter.
                </p>
                <span className="feature-tag">no promises</span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section">
          <div className="wrap">
            <h2 className="cta-title">Give your agent a wallet.</h2>
            <p className="cta-sub">
              Read the payment reference, then wire x402 into the loop. It is one extra header on a
              request you are already making.
            </p>
            <div className="cta-row">
              <a className="btn-primary" href="/docs/payment">Read the payment docs</a>
              <a className="btn-ghost" href="/pricing">See the price card</a>
            </div>
            <p className="cta-tiny">USDC · USDT · SOL · testnet available on request</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
