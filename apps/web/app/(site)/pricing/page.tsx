"use client";

import { ArrowRight } from "lucide-react";
import { useState } from "react";
import SiteNav from "@/components/site/site-nav";
import SiteFooter from "@/components/site/site-footer";

/** Prices in USD micros, mirrored from PRICE_CARD. */
const POLL_EMPTY = 500;
const POLL_MOVED = 4000;
const BRIEF = 30000;
const MIN_DEPOSIT_MICROS = 1_000_000;
const DAILY_CAP_MICROS = 500_000;

const RATES: Array<[string, string, string, string]> = [
  ["Check a topic", "POST /v1/poll", "Nothing has changed", "$0.0005"],
  ["Check a topic", "POST /v1/poll", "Something moved — a cited pack", "$0.004"],
  ["Read the delta", "POST /v1/delta", "Every item newer than your cursor, warm", "$0.004"],
  ["Read the delta", "POST /v1/delta", "Computed on demand against the replica", "$0.02"],
  ["Ask for a brief", "POST /v1/brief", "3–6 cited sentences plus the pack", "$0.03"],
  ["Keep a topic warm", "POST /v1/watch", "24-hour hold at 60 or 15 minutes", "$0.15–$0.50"],
  ["Find a topic", "POST /v1/resolve", "A task in English to a stable beat", "Free to 100/day"],
  ["Bootstrap", "GET /v1/catalog", "The whole catalog and every beat ID", "Free"],
];

const FAQ = [
  {
    q: "What am I actually charged for?",
    a: "Answers, not requests. A check that comes back empty costs $0.0005, and a check that returns a cited pack costs $0.004. The catalog, the tool schema, pricing and the stats feed are free and always will be.",
  },
  {
    q: "When does money leave my balance?",
    a: "At the moment a call is served, in one transaction that also writes the receipt and updates your daily counters. If a call is refused for any reason — no balance, a cap, a missing pack — nothing is deducted.",
  },
  {
    q: "How do I top up?",
    a: "POST /v1/deposits returns a payment instruction for the amount you asked for. Once it is paid the credits land in your balance. The minimum is $1, credits never expire, and card, invoice and stablecoin are all accepted.",
  },
  {
    q: "What happens when my balance runs out?",
    a: "The next call returns 402 with a quote for that exact call, so the agent can settle that one answer and keep going. Nothing is queued, no work is lost, and the cursor you hold stays valid.",
  },
  {
    q: "Is pay-as-you-go more expensive than a prepaid balance?",
    a: "Slightly. Pay-as-you-go settles each call individually, which carries a small per-call overhead. A prepaid balance is funded once and then drawn down, which is why it is the cheaper path for anything that polls on a schedule.",
  },
  {
    q: "Are there caps?",
    a: "$0.50 a day and 50 distinct topics a day per identity by default, checked before the debit. They exist because a looping tool call is the default failure mode of an agent, not a theoretical risk. Ask us if you need them raised.",
  },
  {
    q: "Is there a subscription or a minimum?",
    a: "No. No seat, no platform fee, no monthly minimum, and no contract. You pay for the answers you use, and the free path covers the catalog, tools and pricing so you can evaluate before spending anything.",
  },
];

function usd(micros: number): string {
  return `$${(micros / 1_000_000).toFixed(2)}`;
}

export default function Pricing() {
  const [beats, setBeats] = useState(3);
  const [polls, setPolls] = useState(24);
  const [moveRate, setMoveRate] = useState(30);
  const [briefs, setBriefs] = useState(1);

  const totalPolls = beats * polls;
  const moved = Math.round((totalPolls * moveRate) / 100);
  const empty = totalPolls - moved;
  const dailyMicros = empty * POLL_EMPTY + moved * POLL_MOVED + briefs * BRIEF;
  const monthMicros = dailyMicros * 30;
  const fundedDays = dailyMicros > 0 ? Math.floor(MIN_DEPOSIT_MICROS / dailyMicros) : 0;

  return (
    <>
      <SiteNav active="/pricing" />
      <main>
        {/* HERO */}
        <div className="page-head">
          <div className="wrap">
            <span className="sec-eyebrow">Pricing</span>
            <h1 className="sec-title">Pay for answers, not for seats.</h1>
            <p className="sec-sub">
              One price list, no platform fee, no monthly minimum. An empty check costs a twentieth
              of a cent, a real answer costs less than half a cent, and you can price your own
              workload below.
            </p>
            <div className="hero-cta">
              <a className="btn-primary" href="/docs/quickstart">
                Get started free <ArrowRight size={14} />
              </a>
              <a className="btn-ghost" href="#topup">How to top up</a>
            </div>
            <p className="hero-tiny">no card · no contract · free while we are in early access</p>
          </div>
        </div>

        {/* THE NUMBERS */}
        <section className="metrics">
          <div className="wrap">
            <div className="metrics-grid">
              <div>
                <div className="metric-num" style={{ fontSize: 32 }}>$0.0005</div>
                <div className="metric-label">An empty check, which is most checks</div>
              </div>
              <div>
                <div className="metric-num" style={{ fontSize: 32 }}>$0.004</div>
                <div className="metric-label">A real answer: a short, cited pack</div>
              </div>
              <div>
                <div className="metric-num" style={{ fontSize: 32 }}>$1</div>
                <div className="metric-label">Minimum top-up, and credits never expire</div>
              </div>
              <div>
                <div className="metric-num" style={{ fontSize: 32 }}>$0.50</div>
                <div className="metric-label">Default daily ceiling per identity</div>
              </div>
            </div>
          </div>
        </section>

        {/* CALCULATOR */}
        <section className="scaffold" id="estimate">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-eyebrow">Try it out</span>
              <h2 className="sec-title">Price your own loop.</h2>
              <p className="sec-sub">
                The price follows how often your agent asks and how often the world actually
                changes. Move the sliders to match your workload.
              </p>
            </div>

            <div className="showcase" style={{ paddingTop: 0 }}>
              <div className="calc">
                <div className="calc-row">
                  <span className="calc-label">Topics watched</span>
                  <span className="calc-value">{beats}</span>
                  <input
                    type="range"
                    min={1}
                    max={50}
                    value={beats}
                    onChange={(e) => setBeats(Number(e.target.value))}
                    aria-label="Topics watched"
                  />
                </div>
                <div className="calc-row">
                  <span className="calc-label">Checks per topic per day</span>
                  <span className="calc-value">{polls}</span>
                  <input
                    type="range"
                    min={1}
                    max={288}
                    step={1}
                    value={polls}
                    onChange={(e) => setPolls(Number(e.target.value))}
                    aria-label="Checks per topic per day"
                  />
                </div>
                <div className="calc-row">
                  <span className="calc-label">How often something moved</span>
                  <span className="calc-value">{moveRate}%</span>
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={moveRate}
                    onChange={(e) => setMoveRate(Number(e.target.value))}
                    aria-label="Move rate"
                  />
                </div>
                <div className="calc-row">
                  <span className="calc-label">Briefs per day</span>
                  <span className="calc-value">{briefs}</span>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    value={briefs}
                    onChange={(e) => setBriefs(Number(e.target.value))}
                    aria-label="Briefs per day"
                  />
                </div>
              </div>

              <div>
                <div className="calc-out">
                  <div>
                    <div className="calc-num">{usd(dailyMicros)}</div>
                    <div className="calc-note">per day, at this mix</div>
                  </div>
                  <div>
                    <div className="calc-num">{usd(monthMicros)}</div>
                    <div className="calc-note">per 30 days</div>
                  </div>
                  <div>
                    <div className="calc-num">{Math.max(fundedDays, 0)}</div>
                    <div className="calc-note">days a $1 top-up covers</div>
                  </div>
                </div>
                <p className="calc-note" style={{ marginTop: 18 }}>
                  {totalPolls} checks a day: {empty} come back empty at $0.0005 and {moved} return a
                  pack at $0.004
                  {briefs > 0 ? `, plus ${briefs} brief${briefs === 1 ? "" : "s"} at $0.03` : ""}.
                  Nothing here is a subscription — stop polling and the cost is zero.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* RATES */}
        <section className="scaffold" id="rates">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-eyebrow">The rate card</span>
              <h2 className="sec-title">Every call, and what it costs.</h2>
              <p className="sec-sub">
                Published numbers, not a quote. Nothing on this page requires talking to anyone.
              </p>
            </div>
            <table className="docs-body" style={{ maxWidth: "100%" }}>
              <thead>
                <tr>
                  <th>What you want</th>
                  <th>Call</th>
                  <th>What you get back</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {RATES.map(([what, call, gets, price]) => (
                  <tr key={`${call}-${gets}`}>
                    <td style={{ color: "#fff" }}>{what}</td>
                    <td>
                      <code>{call}</code>
                    </td>
                    <td>{gets}</td>
                    <td style={{ color: "#fff", fontFamily: "var(--font-mono)", fontSize: 12.5 }}>
                      {price}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="hero-tiny" style={{ marginTop: 8 }}>
              resolve, brief and watch are published but not built yet · nothing is charged until
              metering is switched on
            </p>
          </div>
        </section>

        {/* HOW YOU PAY */}
        <section className="scaffold" id="how">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-eyebrow">How you pay</span>
              <h2 className="sec-title">Two ways, and you can mix them.</h2>
              <p className="sec-sub">
                Both draw on the same balance and both return a receipt. Start with whichever
                matches how your agent already runs.
              </p>
            </div>
            <div className="features">
              <div className="feature" style={{ minHeight: 250 }}>
                <h3 className="feature-title">Pay as you go</h3>
                <p className="feature-desc">
                  Each call is billed to the account that made it. No balance to manage, and no
                  separate funding step before the first request.
                </p>
                <span className="feature-tag">best for: evaluation and occasional calls</span>
              </div>
              <div className="feature" style={{ minHeight: 250 }}>
                <h3 className="feature-title">Draw from a balance</h3>
                <p className="feature-desc">
                  Top up once and each call deducts its price in the same transaction that writes
                  the receipt. No per-call payment step.
                </p>
                <span className="feature-tag">best for: anything that polls on a schedule</span>
              </div>
              <div className="feature" style={{ minHeight: 250 }}>
                <h3 className="feature-title">What you never pay</h3>
                <p className="feature-desc">
                  No seat, no platform fee, no monthly minimum, no setup, no charge for the catalog,
                  the tool schema or pricing. Empty answers are charged, but at a twentieth of a
                  cent.
                </p>
                <span className="feature-tag">no subscription</span>
              </div>
            </div>
            <p className="more"><a href="/docs/billing">The full payment reference</a></p>
          </div>
        </section>

        {/* TOP UP */}
        <section className="scaffold" id="topup">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-eyebrow">Topping up</span>
              <h2 className="sec-title">How your balance gets funded.</h2>
              <p className="sec-sub">
                One deposit, then the meter draws it down. You can top up at any time and the
                balance is never spent on anything but answers.
              </p>
            </div>

            <div className="showcase" style={{ paddingTop: 0 }}>
              <div>
                <h3>Fund it once, then draw down.</h3>
                <p>
                  Create a top-up, pay the instruction it returns, and the credits land in your
                  balance. Minimum $1, and whatever you top up stays yours until a call uses it.
                </p>
                <ul>
                  <li>Card, invoice or stablecoin — all credited in USD</li>
                  <li>Credits never expire and are held as integer USD micros</li>
                  <li>Top-ups over $1 credit exactly what arrives, including overpayment</li>
                  <li>A unique reference per top-up, so nothing is misattributed</li>
                </ul>
              </div>
              <div className="code">
                <div className="code-bar">POST /v1/deposits · 201 Created</div>
                <pre>{`{
  "deposit_id": "dep_01JQ8ZK4M2X",
  "amount_micros": 5000000,
  "currency": "USD",
  "symbol": "USD",
  "pay_url": "<payment instruction>",
  "expires_at": "2026-09-12T12:30:00Z"
}

// then watch it land:
GET /v1/balance
-> { "balance_micros": 5000000, "today": { "calls": 12, "micros": 48000 } }`}</pre>
              </div>
            </div>

            <div className="features" style={{ marginTop: 40 }}>
              <div className="feature" style={{ minHeight: 190 }}>
                <h3 className="feature-title">Low balance</h3>
                <p className="feature-desc">
                  GET /v1/balance returns a low_balance flag once you drop under $0.50, so a loop can
                  top up before it runs dry rather than after.
                </p>
                <span className="feature-tag">check before a long loop</span>
              </div>
              <div className="feature" style={{ minHeight: 190 }}>
                <h3 className="feature-title">Empty balance</h3>
                <p className="feature-desc">
                  Calls return 402 with a quote for that one call. Settle that single call and
                  continue; nothing is queued and no cursor is lost.
                </p>
                <span className="feature-tag">402, not an outage</span>
              </div>
              <div className="feature" style={{ minHeight: 190 }}>
                <h3 className="feature-title">What you spent</h3>
                <p className="feature-desc">
                  GET /v1/receipts?since= returns every call with its price, the topic and the rail.
                  Reconcile a month of polling against a single deposit.
                </p>
                <span className="feature-tag">itemised, in USD micros</span>
              </div>
            </div>
          </div>
        </section>

        {/* CAPS */}
        <section className="scaffold" id="caps">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-eyebrow">Caps</span>
              <h2 className="sec-title">Guard rails, set low by default.</h2>
              <p className="sec-sub">
                A looping tool call is the default failure mode of an agent. These exist so a
                misconfigured loop hits a wall instead of an invoice.
              </p>
            </div>
            <div className="features">
              <div className="feature" style={{ minHeight: 180 }}>
                <h3 className="feature-title">$0.50 a day</h3>
                <p className="feature-desc">
                  The default daily ceiling per identity, checked before the debit rather than after.
                  Ask us to raise it when your workload is real.
                </p>
                <span className="feature-tag">per identity</span>
              </div>
              <div className="feature" style={{ minHeight: 180 }}>
                <h3 className="feature-title">50 topics a day</h3>
                <p className="feature-desc">
                  Distinct beats per day. If your agent is wandering through the catalog, it will
                  find this wall early and cheaply.
                </p>
                <span className="feature-tag">distinct beats</span>
              </div>
              <div className="feature" style={{ minHeight: 180 }}>
                <h3 className="feature-title">30 days of depth</h3>
                <p className="feature-desc">
                  The agent rail never serves content older than 30 days, at any price. Depth is what
                  the desk rail is for.
                </p>
                <span className="feature-tag">hard wall</span>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="scaffold" id="faq">
          <div className="wrap-tight">
            <div className="sec-head">
              <span className="sec-eyebrow">Billing questions</span>
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
            <h2 className="cta-title">Start free. Pay per answer.</h2>
            <p className="cta-sub">
              Explore the catalog and the tool schema without spending anything, then top up $5 when
              you are ready to run it in a loop.
            </p>
            <div className="cta-row">
              <a className="btn-primary" href="/docs/quickstart">
                Get started free <ArrowRight size={14} />
              </a>
              <a className="btn-ghost" href="/docs/billing">Read the payment reference</a>
            </div>
            <p className="cta-tiny">no card · no contract · free while we are in early access</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
