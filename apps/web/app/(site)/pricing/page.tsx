import SiteNav from "@/components/site/site-nav";
import SiteFooter from "@/components/site/site-footer";
import { PRICES } from "@/components/site/content";

export default function Page() {
  return (
    <>
      <SiteNav active="/pricing" />
      <main>
        <div className="page-head">
          <div className="wrap">
            <span className="sec-eyebrow">Pricing</span>
            <h1 className="sec-title">Priced per wake-up.</h1>
            <p className="sec-sub">Published numbers, a real free path, and no seat licence. Empty polls are nearly free, so asking often is rational.</p>
          </div>
        </div>
        {/* 05 PRICE CARD */}
        <section className="scaffold" id="pricing">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-eyebrow">05 · Price card</span>
              <h2 className="sec-title">Charge the wake-up, not the month.</h2>
              <p className="sec-sub">
                Empty is nearly free so hourly polling is rational. Cold is dear so reuse is
                rewarded. Prices live in a table, not in code.
              </p>
            </div>

            <div className="features" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
              {PRICES.map((p) => (
                <div key={p.label} className="feature" style={{ minHeight: 200 }}>
                  <span className="feature-tag" style={{ marginTop: 0, paddingTop: 0 }}>{p.label}</span>
                  <div className="metric-num" style={{ fontSize: 30, margin: "14px 0 10px" }}>{p.price}</div>
                  <p className="feature-desc">{p.desc}</p>
                </div>
              ))}
            </div>
            <p className="hero-tiny" style={{ marginTop: 18 }}>
              credits are USD micros · priced the same on both rails · x402 pays per call, a deposit pays once
            </p>

            <div className="showcase">
              <div>
                <span className="sec-eyebrow">Caps</span>
                <h3>A looping tool call is the default failure mode.</h3>
                <p>
                  Not a theoretical risk — it is the first thing a misconfigured agent does. Caps
                  ship with the meter, so a runaway loop hits a wall instead of an invoice.
                </p>
                <ul>
                  <li>Default daily ceiling: $0.50 per identity</li>
                  <li>50 distinct beats per day per identity</li>
                  <li>8 items and 800 tokens are enforced in schema today</li>
                  <li>The 30-day depth wall lands with the meter</li>
                </ul>
              </div>
              <div className="code">
                <div className="code-bar">builder estimate · not a subscription</div>
                <pre>{`beats watched              3
polls per beat / day      24
move rate                 30%
briefs per day             1
────────────────────────────
est. agent-day         $0.14
≈ 30 days              $4.25`}</pre>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
