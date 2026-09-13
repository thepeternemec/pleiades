import { ArrowRight } from "lucide-react";
import SiteNav from "@/components/site/site-nav";
import SiteFooter from "@/components/site/site-footer";
import { DEPOSIT_STEPS, PRICES } from "@/components/site/content";

export const metadata = {
  title: "Payment",
  description:
    "Metered per answer: pay per call from an agent's own wallet, or draw down a balance funded with USDC, USDT or SOL. No subscription, no invoices.",
};

const QUICK = [
  { value: "$0.0005", label: "An empty check — which is most checks" },
  { value: "$0.004", label: "A real answer: a short, cited pack" },
  { value: "$1", label: "Minimum deposit, and credits never expire" },
  { value: "None", label: "Accounts, cards or contracts required to start" },
];

const VERIFY_ROWS: Array<[string, string]> = [
  ["Reference matches", "The transfer is tied to one open deposit, not a guess"],
  ["Recipient is us", "Otherwise it is somebody else's payment"],
  ["Mint matches", "A wrong token cannot be reversed by us, so it is never credited"],
  ["Amount is enough", "Overpayment credits exactly what arrived"],
  ["Signature is new", "The same transfer can be presented twice before it confirms"],
  ["Confirmed on-chain", "A processed transaction can still be dropped"],
];

const FAQ = [
  {
    q: "How do I pay without creating an account?",
    a: "Call any metered route with no credential and you get a 402 with a quote for that exact call — network, token, amount and recipient. Pay it from any Solana wallet and retry the same request. Nothing is issued to you beforehand, so there is nothing to sign up for.",
  },
  {
    q: "What do I need to get started?",
    a: "A Solana wallet and a small amount of USDC. Nothing else. The catalog, the tool schema, pricing and the stats feed need no credential at all, so you can explore the API before you decide to pay for anything.",
  },
  {
    q: "Which tokens do you accept?",
    a: "USDC, USDT and native SOL. Deposits are credited in USD at the quoted rate, and the rate is recorded on the deposit so history never re-prices. Check the mint in the deposit response before you sign — a transfer on the wrong mint cannot be credited.",
  },
  {
    q: "What does an empty answer cost?",
    a: "A twentieth of a cent. Most checks come back with nothing new, and pricing that answer at nearly zero is the whole point: it is what makes asking every hour rational instead of extravagant.",
  },
  {
    q: "Can I try it before paying?",
    a: "Yes. Metering is off while we are in early access, so calls are free and no receipt is written. When it turns on you will see a 402 with a quote rather than a surprise charge.",
  },
  {
    q: "How do I know what I was charged?",
    a: "Every metered call and every credited deposit writes a receipt. GET /v1/receipts?since= returns them with the call, the beat, the amount in USD micros and the rail used, so you can reconcile a month of polling against a single deposit.",
  },
  {
    q: "Is the Pleiades token an investment?",
    a: "No. It is a usage credit and nothing else: not a share, not a yield, not a claim on revenue, with no promised market and no buyback. If it ships it will be a standard SPL token with a fixed supply and no mint authority, accepted as one more deposit rail.",
  },
];

export default function Payment() {
  return (
    <>
      <SiteNav active="/payment" />
      <main>
        {/* HERO — what it costs and how to start, in the first screen */}
        <div className="page-head">
          <div className="wrap">
            <span className="sec-eyebrow">Payment</span>
            <h1 className="sec-title">Pay per answer. Nothing else.</h1>
            <p className="sec-sub">
              No seats, no subscription, no invoice to approve. Your agent pays a fraction of a cent
              each time it asks, and nothing when the answer is &ldquo;nothing moved&rdquo;.
            </p>
            <div className="hero-cta">
              <a className="btn-primary" href="/docs/quickstart">
                Get started free <ArrowRight size={14} />
              </a>
              <a className="btn-ghost" href="/docs/payment">Read the reference</a>
            </div>
            <p className="hero-tiny">
              no card · no contract · free while we are in early access
            </p>

            <div className="code">
              <div className="code-bar">Start here — no key needed</div>
              <pre>{`API=https://dnnoypytdfvsdenykooq.supabase.co/functions/v1/api

curl -X POST $API/v1/poll \\
  -H "Content-Type: application/json" \\
  -d '{"beat_id":"b_bb964843350e"}'`}</pre>
            </div>
          </div>
        </div>

        {/* THE NUMBERS */}
        <section className="metrics">
          <div className="wrap">
            <div className="metrics-grid">
              {QUICK.map((item) => (
                <div key={item.label}>
                  <div className="metric-num" style={{ fontSize: 32 }}>{item.value}</div>
                  <div className="metric-label">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICE CARD */}
        <section className="scaffold" id="prices">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-eyebrow">Prices</span>
              <h2 className="sec-title">Four prices, published.</h2>
              <p className="sec-sub">
                The price follows the answer, not the request. Asking and getting nothing is the
                cheap path, on purpose.
              </p>
            </div>
            <div className="features" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
              {PRICES.map((p) => (
                <div key={p.label} className="feature" style={{ minHeight: 190 }}>
                  <span className="feature-tag" style={{ marginTop: 0, paddingTop: 0 }}>{p.label}</span>
                  <div className="metric-num" style={{ fontSize: 30, margin: "14px 0 10px" }}>{p.price}</div>
                  <p className="feature-desc">{p.desc}</p>
                </div>
              ))}
            </div>
            <p className="more"><a href="/pricing">Daily caps and the full price card</a></p>
          </div>
        </section>

        {/* TWO RAILS */}
        <section className="scaffold" id="rails">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-eyebrow">Two ways to pay</span>
              <h2 className="sec-title">Pick the one that fits your loop.</h2>
              <p className="sec-sub">
                An agent that has never met us can still buy a single answer. One that polls all day
                should not sign a transaction every hour.
              </p>
            </div>

            <div className="showcase">
              <div>
                <span className="sec-eyebrow">Rail A · pay as you go</span>
                <h3>Nothing to sign up for.</h3>
                <p>
                  Ask for an answer, get a quote in USDC, pay it from your wallet, ask again. There
                  is no key to issue and no account to create &mdash; the payment is the
                  authentication.
                </p>
                <ul>
                  <li>One call, one payment, settled on Solana</li>
                  <li>The network fee sits with the facilitator, not your agent</li>
                  <li>Works with any x402-capable wallet or agent framework</li>
                  <li>The quote is bound to the call, so it cannot be replayed</li>
                </ul>
              </div>
              <div className="code">
                <div className="code-bar">402 Payment Required · then retry</div>
                <pre>{`{
  "x402Version": 2,
  "accepts": [{
    "scheme": "exact",
    "network": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
    "asset": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "max_amount_required": "4000",
    "resource": "POST /v1/poll"
  }]
}

// pay on Solana, then send the same request again:
POST /v1/poll
X-PAYMENT: <base64 signed transaction>`}</pre>
              </div>
            </div>

            <div className="showcase">
              <div className="code">
                <div className="code-bar">POST /v1/deposits · 201 Created</div>
                <pre>{`{
  "deposit_id": "dep_01JQ8ZK4M2X",
  "symbol": "USDC",
  "amount_ui": "5",
  "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "reference": "7Yq3mQbK1sVpNcRfH2xWtZ9dLgUeA4nT6jPkM8vBsXo",
  "pay_url": "solana:<treasury>?amount=5&spl-token=EPjF…&reference=7Yq3…"
}`}</pre>
              </div>
              <div>
                <span className="sec-eyebrow">Rail B · prepaid</span>
                <h3>Fund once, then draw down.</h3>
                <p>
                  A desk polling every hour should not sign a transaction every hour. Deposit once
                  and calls draw from the balance instantly, with no signature and no fee per call.
                </p>
                <ul>
                  <li>USDC, USDT or SOL, credited in USD at the quoted rate</li>
                  <li>A unique reference key per deposit, so nothing is misattributed</li>
                  <li>Credits never expire and the rate is recorded on the deposit</li>
                  <li>Solana fees are a fraction of a cent, not 9% of a card top-up</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* GET STARTED */}
        <section className="scaffold" id="start">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-eyebrow">Get started</span>
              <h2 className="sec-title">Three steps to a funded balance.</h2>
              <p className="sec-sub">
                Any Solana wallet works &mdash; Phantom, Solflare, Backpack, or anything that speaks
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

        {/* TRUST */}
        <section className="scaffold" id="verification">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-eyebrow">Before we credit</span>
              <h2 className="sec-title">Six checks, every deposit.</h2>
              <p className="sec-sub">
                All six have to hold. Anything that fails is parked for a human and never credited
                automatically, because a wrong-token transfer cannot be reversed by us.
              </p>
            </div>
            <div className="mock">
              <div className="mock-bar">
                <span className="mock-dots"><span /><span /><span /></span>
                <span className="mock-title">deposit verification</span>
                <span className="mock-live">enforced</span>
              </div>
              <div className="mock-feed">
                {VERIFY_ROWS.map(([check, why]) => (
                  <div key={check} className="mock-row">
                    <span className="k">{check}</span>
                    <span className="v">{why}</span>
                    <span className="s">required</span>
                  </div>
                ))}
              </div>
              <div className="mock-foot">
                <span>credits once</span>
                <span>per transaction signature</span>
                <span style={{ marginLeft: "auto" }}>no double-credit</span>
              </div>
            </div>
          </div>
        </section>

        {/* RECEIPTS */}
        <section className="scaffold" id="receipts">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-eyebrow">Receipts</span>
              <h2 className="sec-title">Every answer leaves a trace.</h2>
              <p className="sec-sub">
                Reconcile a month of polling against a single deposit. Receipts prove payment to us;
                the publisher URL proves provenance to your user.
              </p>
            </div>
            <div className="showcase">
              <div>
                <h3>Two identifiers that never merge.</h3>
                <p>
                  A receipt points at Pleiades: what was called, for which topic, for how many
                  micros, and when it settled. A citation points at the publisher. The URL you show
                  a user should always be theirs.
                </p>
                <ul>
                  <li>Every metered call returns a receipt id</li>
                  <li>Every credited deposit writes one too</li>
                  <li>Amounts are integer USD micros, so nothing rounds away</li>
                  <li>Fetch them incrementally with since= for a cheap nightly job</li>
                </ul>
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
    },
    {
      "receipt_id": "r_dep_3f1a…",
      "call": "deposit",
      "beat_id": "",
      "amount_micros": 5000000,
      "rail": "solana",
      "settled_at": "2026-09-12T06:12:03Z"
    }
  ]
}`}</pre>
              </div>
            </div>
          </div>
        </section>

        {/* WHY THE RAIL */}
        <section className="scaffold" id="economics">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-eyebrow">Why the rail matters</span>
              <h2 className="sec-title">Machine calls should not be priced like human ones.</h2>
              <p className="sec-sub">
                Card processing is built for a person buying something once. A sub-cent answer is
                impossible on top of it.
              </p>
            </div>
            <div className="features">
              <div className="feature" style={{ minHeight: 200 }}>
                <h3 className="feature-title">A $5 card top-up</h3>
                <p className="feature-desc">
                  Loses roughly 9% to processing before it reaches us. On a four-tenths-of-a-cent
                  answer, that fee is larger than the thing being bought.
                </p>
                <span className="feature-tag">≈ $0.45 lost</span>
              </div>
              <div className="feature" style={{ minHeight: 200 }}>
                <h3 className="feature-title">The same $5 in USDC</h3>
                <p className="feature-desc">
                  Costs about 0.016% and settles in under a second, which is what makes a metered
                  price of four tenths of a cent possible at all.
                </p>
                <span className="feature-tag">≈ $0.0008</span>
              </div>
              <div className="feature" style={{ minHeight: 200 }}>
                <h3 className="feature-title">Why an agent can use it</h3>
                <p className="feature-desc">
                  An agent that cannot hold a card can hold a wallet. Paying per answer is what lets
                  it buy its own news with no human in the loop.
                </p>
                <span className="feature-tag">machine-native</span>
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

        {/* FAQ */}
        <section className="scaffold" id="faq">
          <div className="wrap-tight">
            <div className="sec-head">
              <span className="sec-eyebrow">Payment questions</span>
              <h2 className="sec-title">The things people ask first.</h2>
            </div>
            <div className="faq">
              {FAQ.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <div className="a">{f.a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section">
          <div className="wrap">
            <h2 className="cta-title">Give your agent a wallet.</h2>
            <p className="cta-sub">
              It is one extra header on a request you are already making. Start free, add x402 when
              you are ready to run it in a loop.
            </p>
            <div className="cta-row">
              <a className="btn-primary" href="/docs/quickstart">Get started free <ArrowRight size={14} /></a>
              <a className="btn-ghost" href="/docs/payment">Read the reference</a>
            </div>
            <p className="cta-tiny">metered per answer · USDC, USDT or SOL · free while we are in early access</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
