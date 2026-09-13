"use client";

import { ArrowRight } from "lucide-react";
import Marquee from "@/components/ui/marquee/marquee";
import SiteNav from "@/components/site/site-nav";
import SiteFooter from "@/components/site/site-footer";
import { usePleiadesStats } from "@/components/site/use-stats";
import { PRICES, RAILS, VERBS } from "@/components/site/content";

export default function Home() {
  const { stats, stamp, items, ticker } = usePleiadesStats();

  return (
    <>
      <SiteNav active="/" />
      <main>
        {/* HERO */}
        <section className="hero" id="top">
          <div className="wrap">
            <span className="eyebrow">
              <span className="eyebrow-tag">Live API</span>
              {stats?.beats ?? 20} topics
              <span style={{ color: "var(--border-strong)" }}>·</span>
              150,000 publishers
              <span style={{ color: "var(--border-strong)" }}>·</span>
              English sources
            </span>

            <h1>The real-time news API for AI agents.</h1>
            <p className="lede">
              Pleiades watches 150,000 publishers around the clock and returns a short, cited brief
              whenever a topic your agent follows changes. Your agent asks on a schedule; Pleiades
              answers what moved and who reported it. It pays for each answer itself, in USDC on
              Solana, over x402.
            </p>

            <div className="hero-cta">
              <a className="btn-primary" href="/dashboard">
                Open the live terminal <ArrowRight size={14} />
              </a>
              <a className="btn-ghost" href="#install">Explore the API</a>
            </div>
            <p className="hero-tiny">
              x402 on Solana · paid per call from the agent's wallet · USDC · USDT · SOL · English only · free while the meter is wired
            </p>

            <div className="mock" style={{ marginTop: 46 }}>
              <div className="mock-bar">
                <span className="mock-dots"><span /><span /><span /></span>
                <span className="mock-title">pleiades — your agent asks, pleiades answers</span>
                <span className="mock-live">streaming</span>
              </div>
              <div className="mock-body">
                <div className="mock-ticker">
                  <Marquee speed={55} gap="3.5rem" pauseOnHover>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      {ticker.map((it, i) => (
                        <span key={i} style={{ whiteSpace: "nowrap", font: "11px var(--font-mono), monospace", color: "#bdbdbd" }}>
                          <span style={{ color: "#fff", fontWeight: 600 }}>{it.beat_label}</span>
                          <span style={{ margin: "0 12px", color: "#333" }}>·</span>
                          {it.lede}
                        </span>
                      ))}
                    </div>
                  </Marquee>
                </div>
                <div className="mock-feed">
                  <div className="mock-row">
                    <span className="k">01 resolve</span>
                    <span className="v">{`{"task": "due diligence on Nvidia China exposure"}`}</span>
                    <span className="s">free · next</span>
                  </div>
                  <div className="mock-row">
                    <span className="k">→ beat_id</span>
                    <span className="v">b_bb964843350e · NVIDIA</span>
                    <span className="s">warm</span>
                  </div>
                  <div className="mock-row">
                    <span className="k">02 poll</span>
                    <span className="v">moved: false — nothing since cursor c_eyJiIjoi…</span>
                    <span className="s">$0.0005</span>
                  </div>
                  <div className="mock-row">
                    <span className="k">02 poll</span>
                    <span className="v">moved: true · pack · {items.length || 3} items</span>
                    <span className="s">$0.004</span>
                  </div>
                  {items.slice(0, 3).map((it, i) => (
                    <div key={i} className="mock-row">
                      <span className="k">{it.beat_label}</span>
                      <span className="v">{it.lede}</span>
                      <span className="s">{it.source}</span>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="mock-row">
                      <span className="k">awaiting</span>
                      <span className="v">Ingestion paused while the topic catalog is rebuilt.</span>
                      <span className="s">system</span>
                    </div>
                  )}
                </div>
                <div className="mock-foot">
                  <span>poll · /v1/poll</span>
                  <span>empty · $0.0005</span>
                  <span>moved · $0.004</span>
                  <span>≤8 items / ≤800 tokens</span>
                  <span style={{ marginLeft: "auto" }}>{stamp ? `updated ${stamp}` : "connecting…"}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* METRICS */}
        <section className="metrics">
          <div className="wrap">
            <div className="metrics-grid">
              <div>
                <div className="metric-num">150,000</div>
                <div className="metric-label">Publishers watched continuously — every story traced to its source</div>
              </div>
              <div>
                <div className="metric-num">≤8</div>
                <div className="metric-label">Stories per answer — small enough to read, cheap enough to ask hourly</div>
              </div>
              <div>
                <div className="metric-num">≤800</div>
                <div className="metric-label">Tokens per answer, so a news check fits a small context window</div>
              </div>
              <div>
                <div className="metric-num">30d</div>
                <div className="metric-label">Depth on the agent API — recent by design, never a full archive</div>
              </div>
            </div>
            <p className="hero-tiny" style={{ marginTop: 34 }}>
              {stats?.total_articles
                ? `live · ${stats.beats} topics · ${stats.total_articles} english articles · ${stats.total_clusters} article clusters · updated ${stamp || "\u2026"}`
                : `${stats?.beats ?? 20} topics configured · ingestion paused while the topic catalog is rebuilt`}
            </p>
          </div>
        </section>

        {/* RAILS rail */}
        <section className="rail">
          <Marquee speed={40} gap="2.5rem" pauseOnHover>
            <div className="rail-items">
              {RAILS.map((r) => (
                <span key={r} className="rail-item"><i />{r}</span>
              ))}
            </div>
          </Marquee>
        </section>

        {/* 01 CATEGORY */}
        <section className="scaffold" id="category">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-eyebrow">01 · Category</span>
              <h2 className="sec-title">This is not search.</h2>
              <p className="sec-sub">
                Search answers a question once and forgets it. A beat keeps state, so the question
                your agent asks on a schedule is simply whether anything moved.
              </p>
            </div>
            <div className="features">
              <div className="feature">
                <h3 className="feature-title">Who asks</h3>
                <p className="feature-desc">A human, once. Or a machine, forever, on a schedule you set.</p>
                <span className="feature-tag">search to scheduled</span>
              </div>
              <div className="feature">
                <h3 className="feature-title">What wins</h3>
                <p className="feature-desc">Recall and ranking, or state and breadth behind a cursor that never repeats.</p>
                <span className="feature-tag">ranking to state</span>
              </div>
              <div className="feature">
                <h3 className="feature-title">What it costs</h3>
                <p className="feature-desc">Search bills per query. Pleiades bills per wake-up, and nothing moved is the cheap answer.</p>
                <span className="feature-tag">per query to per wake-up</span>
              </div>
            </div>
            <p className="more"><a href="/how-it-works">How the rails work</a></p>
          </div>
        </section>

        {/* THE HYPER-NEWS AGENT */}
        <section className="scaffold" id="agent">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-eyebrow">The hyper-news agent</span>
              <h2 className="sec-title">An agent that buys its own news.</h2>
              <p className="sec-sub">
                It wakes on a schedule, asks what moved, and pays for the answer from its own
                Solana wallet. No account, no API key, no invoice, no human.
              </p>
            </div>

            <div className="showcase">
              <div>
                <h3>Fourteen cents buys a day of vigilance.</h3>
                <p>
                  Most wakes return nothing, and nothing is cheap. When a beat does move, the same
                  agent pays four tenths of a cent for a bounded, cited pack and moves on. The cost
                  tracks the news, not the seat.
                </p>
                <ul>
                  <li>Wake on a schedule — a minute on a market beat, hourly on the rest</li>
                  <li>Pay per answer over x402, straight from the agent&rsquo;s wallet</li>
                  <li>Nothing moved is a real answer, and the cheapest one</li>
                  <li>Every call returns a receipt the operator can reconcile</li>
                </ul>
              </div>
              <div className="mock">
                <div className="mock-bar">
                  <span className="mock-dots"><span /><span /><span /></span>
                  <span className="mock-title">agent loop · one beat · one day</span>
                  <span className="mock-live">x402</span>
                </div>
                <div className="mock-feed">
                  <div className="mock-row">
                    <span className="k">06:00 wake</span>
                    <span className="v">poll · b_bb964843350e · NVIDIA</span>
                    <span className="s">$0.0005</span>
                  </div>
                  <div className="mock-row">
                    <span className="k">06:00 nothing</span>
                    <span className="v">moved: false · cursor held</span>
                    <span className="s">$0.0005</span>
                  </div>
                  <div className="mock-row">
                    <span className="k">06:30 wake</span>
                    <span className="v">moved: true · pack · 3 items · 14 sources</span>
                    <span className="s">$0.004</span>
                  </div>
                  <div className="mock-row">
                    <span className="k">06:30 cite</span>
                    <span className="v">Reuters · published 06:41 · indexed 06:43</span>
                    <span className="s">cited</span>
                  </div>
                  <div className="mock-row">
                    <span className="k">06:31 write</span>
                    <span className="v">memo to the desk, source URL only</span>
                    <span className="s">no bodies</span>
                  </div>
                </div>
                <div className="mock-foot">
                  <span>48 wakes a day</span>
                  <span>≈ $0.14</span>
                  <span style={{ marginLeft: "auto" }}>paid from the agent&rsquo;s wallet</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 02 CONTRACT TEASER */}
        <section className="scaffold" id="contract">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-eyebrow">02 · The contract</span>
              <h2 className="sec-title">Three verbs and a cursor.</h2>
              <p className="sec-sub">
                Describe a task, ask whether it moved, take the delta. Everything else is a detail
                you never have to hold in your head.
              </p>
            </div>
            <div className="mock">
              <div className="mock-bar">
                <span className="mock-dots"><span /><span /><span /></span>
                <span className="mock-title">the verbs you actually call</span>
                <span className="mock-live">live</span>
              </div>
              <div className="mock-feed">
                {VERBS.slice(0, 3).map((v) => (
                  <div key={v.verb} className="mock-row">
                    <span className="k" style={{ textTransform: "none", letterSpacing: "0.02em", color: "var(--text-primary)", fontSize: 11 }}>
                      {v.verb}
                    </span>
                    <span className="v">
                      {v.asks} <span style={{ color: "var(--text-ghost)" }}>→</span> {v.returns}
                    </span>
                    <span className="s">
                      {v.next && <span style={{ color: "var(--text-ghost)" }}>next · </span>}
                      {v.price}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mock-foot">
                <span>GET /v1/catalog · POST /v1/poll · POST /v1/delta ship today</span>
                <span style={{ marginLeft: "auto" }}>cursor is opaque, signed, beat-bound</span>
              </div>
            </div>
            <p className="more"><a href="/how-it-works">The full contract and the pack schema</a></p>
          </div>
        </section>

        {/* 03 PRICING TEASER */}
        <section className="scaffold" id="pricing">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-eyebrow">03 · Pricing</span>
              <h2 className="sec-title">Charge the wake-up, not the month.</h2>
              <p className="sec-sub">
                Empty is nearly free so hourly polling is rational. Cold is dear so reuse is
                rewarded.
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
            <p className="more"><a href="/pricing">The full price card and daily caps</a></p>
          </div>
        </section>

        {/* 04 PAYMENT TEASER */}
        <section className="scaffold" id="settlement">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-eyebrow">04 · Payment</span>
              <h2 className="sec-title">Paid on Solana, per call.</h2>
              <p className="sec-sub">
                x402 lets an agent buy a single call from its own wallet with no account and no
                invoice. A deposit rail skips the chain per call for desks that poll hourly.
              </p>
            </div>
            <div className="showcase">
              <div>
                <h3>Two rails, one balance.</h3>
                <p>
                  The agent hits a call, gets a 402 quoting it in USDC, signs a Solana transfer and
                  retries. Or it funds a balance once and draws micros per call with no signature at
                  all. Either way, every call returns a receipt.
                </p>
                <ul>
                  <li>x402 — one call, one payment, no signup</li>
                  <li>Prepaid — USDC, USDT or SOL, credited in USD micros</li>
                  <li>Solana fees are a fraction of a cent, not 9% of a card top-up</li>
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
    "max_amount_required": "4000",
    "resource": "POST /v1/poll"
  }]
}`}</pre>
              </div>
            </div>
            <p className="more"><a href="/solana">Deposits, receipts and the token</a></p>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section">
          <div className="wrap">
            <h2 className="cta-title">Never miss the signal.</h2>
            <p className="cta-sub">
              Tell Pleiades which topics matter, then let your agent ask what changed. One API,
              every story cited back to the publisher that broke it.
            </p>
            <div className="cta-row">
              <a className="btn-primary" href="/dashboard">Open the live terminal <ArrowRight size={14} /></a>
              <a className="btn-ghost" href="#install">Explore the API</a>
            </div>
            <p className="cta-tiny">
              English only · free while we are in early access · one API call at a time
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
