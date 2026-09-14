"use client";

import { ArrowRight, Bell, Coins, FileCheck, Filter, Plug, Zap } from "lucide-react";
import Marquee from "@/components/ui/marquee/marquee";
import SiteNav from "@/components/site/site-nav";
import SiteFooter from "@/components/site/site-footer";
import { usePleiadesStats } from "@/components/site/use-stats";
import { PRICES } from "@/components/site/content";

/** Benefit-led, in the order a buyer cares about them. */
const FEATURES = [
  {
    icon: Zap,
    title: "Hear it at publish time",
    desc: "Your agent asks on a schedule, so it learns about a story when it breaks rather than when it trends.",
    tag: "a question, not a feed",
    viz: (
      <>
        <div className="viz-line"><span className="viz-dot on" /><span className="viz-key">NVIDIA</span><span className="viz-val">3 new</span></div>
        <div className="viz-line"><span className="viz-dot" /><span>published</span><span className="viz-val">06:41Z</span></div>
        <div className="viz-line"><span className="viz-dot on" /><span>indexed</span><span className="viz-val">06:43Z</span></div>
        <div className="viz-bar"><i style={{ width: "86%" }} /></div>
      </>
    ),
  },
  {
    icon: Filter,
    title: "An answer, not a pile",
    desc: "You get up to eight stories already chosen and ordered. No result page, no ranking to argue with, no scrolling.",
    tag: "≤8 stories",
    viz: (
      <>
        <div className="viz-line"><span className="viz-key">pack · b_bb964843350e</span><span className="viz-val">3 of 8</span></div>
        <div className="viz-dots">
          <i className="on" /><i className="on" /><i className="on" /><i /><i /><i /><i /><i />
        </div>
        <div className="viz-line"><span>ranked by publication time</span></div>
      </>
    ),
  },
  {
    icon: Coins,
    title: "Cheap to ask often",
    desc: "Most checks come back empty, and an empty answer costs a twentieth of a cent. Asking every hour is affordable.",
    tag: "$0.0005 when nothing moved",
    viz: (
      <>
        <div className="viz-line"><span className="viz-key">48 checks today</span><span className="viz-val">$0.14</span></div>
        <div className="viz-bar"><i style={{ width: "93%" }} /></div>
        <div className="viz-line"><span>47 came back empty</span><span className="viz-val">$0.0005 each</span></div>
      </>
    ),
  },
  {
    icon: FileCheck,
    title: "Cited to the publisher",
    desc: "Every story carries the publisher's own link, name and timestamp. We hand you the signal, never the article.",
    tag: "source URL on every item",
    viz: (
      <>
        <div className="viz-line"><span className="viz-key">Reuters</span><span className="viz-val">cited</span></div>
        <div className="viz-line"><span>reuters.com/markets/…</span></div>
        <div className="viz-line"><span>no body</span><span className="viz-val">320c lede</span></div>
      </>
    ),
  },
  {
    icon: Bell,
    title: "Pays for itself",
    desc: "Metered per answer, so an empty check costs a twentieth of a cent. No seat licence, no subscription, no minimum spend.",
    tag: "per answer, not per seat",
    viz: (
      <>
        <div className="viz-line"><span className="viz-key">balance</span><span className="viz-val">$5.00 → $4.86</span></div>
        <div className="viz-bar"><i style={{ width: "97%" }} /></div>
        <div className="viz-line"><span>funded once</span><span className="viz-val">USDC on Solana</span></div>
      </>
    ),
  },
  {
    icon: Plug,
    title: "Drops into your stack",
    desc: "REST, an OpenAI-compatible tool schema, and an MCP server — the same shapes, so you wire it up once.",
    tag: "REST · tools · MCP",
    viz: (
      <>
        <div className="viz-chips">
          <span className="viz-chip on">REST</span>
          <span className="viz-chip on">tools</span>
          <span className="viz-chip on">MCP</span>
        </div>
        <div className="viz-line"><span>one payload shape</span><span className="viz-val">same handlers</span></div>
      </>
    ),
  },
];

const SOURCES = [
  // Wires and financial press
  "Reuters",
  "Bloomberg",
  "The Associated Press",
  "Financial Times",
  "The Wall Street Journal",
  "CNBC",
  "The Economist",
  "BBC News",
  "Nikkei Asia",
  "Al Jazeera",
  "South China Morning Post",
  // Technology
  "TechCrunch",
  "The Verge",
  "Ars Technica",
  "Wired",
  // Crypto desks
  "CoinDesk",
  "Cointelegraph",
  "The Block",
  "Decrypt",
  "Blockworks",
  "DL News",
  "Unchained",
  "The Defiant",
  "Bitcoin Magazine",
  "Protos",
];
const STEPS = [
  {
    n: "1",
    title: "Pick your topics",
    desc: "Twenty are ready today, across markets, policy, energy and science. Each one is a beat with a stable ID you can store.",
    tag: "20 topics live",
  },
  {
    n: "2",
    title: "Your agent asks what changed",
    desc: "It sends the topic and the cursor from last time. The answer is either nothing moved, or a short pack of what did.",
    tag: "two possible answers",
  },
  {
    n: "3",
    title: "It pays for the answer",
    desc: "Per call over x402 straight from the wallet, or drawn from a balance you funded once in USDC, USDT or SOL.",
    tag: "no invoice, no seat",
  },
];

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
              <span className="eyebrow-tag">Agent-native</span>
              {stats?.beats ?? 20} topics live
              <span style={{ color: "var(--border-strong)" }}>·</span>
              150,000 publishers
              <span style={{ color: "var(--border-strong)" }}>·</span>
              pay per answer
            </span>

            <h1>The news layer for AI agents.</h1>
            <p className="lede">
              Your agent asks one question on a schedule — has this moved? — and pays a fraction of
              a cent for the answer. Point it at the topics that matter and it tells you the moment
              something changes, whichever model or framework it runs on.
            </p>

            <div className="hero-cta">
              <a className="btn-primary" href="/dashboard">
                Open the live terminal <ArrowRight size={14} />
              </a>
              <a className="btn-ghost" href="/docs">Read the docs</a>
            </div>
            <p className="hero-tiny">
              pay per answer · settled in USDC on Solana · free while we are in early access
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
                    <span className="k">your agent</span>
                    <span className="v">{`{"task": "due diligence on Nvidia China exposure"}`}</span>
                    <span className="s">free</span>
                  </div>
                  <div className="mock-row">
                    <span className="k">→ topic</span>
                    <span className="v">b_bb964843350e · NVIDIA</span>
                    <span className="s">ready</span>
                  </div>
                  <div className="mock-row">
                    <span className="k">ask</span>
                    <span className="v">has this moved since I last looked?</span>
                    <span className="s">$0.0005</span>
                  </div>
                  <div className="mock-row">
                    <span className="k">answer</span>
                    <span className="v">moved · 3 new stories · cited</span>
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
                  <span>paid in USDC</span>
                  <span>per call</span>
                  <span style={{ marginLeft: "auto" }}>{stamp ? `updated ${stamp}` : "connecting…"}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* NUMBERS */}
        <section className="metrics">
          <div className="wrap">
            <div className="metrics-grid">
              <div>
                <div className="metric-num">150,000</div>
                <div className="metric-label">Publishers watched around the clock</div>
              </div>
              <div>
                <div className="metric-num">$0.0005</div>
                <div className="metric-label">What it costs to hear that nothing changed</div>
              </div>
              <div>
                <div className="metric-num">≤8</div>
                <div className="metric-label">Stories in an answer, so it fits any context window</div>
              </div>
              <div>
                <div className="metric-num">1 call</div>
                <div className="metric-label">All it takes to find out whether anything moved</div>
              </div>
            </div>
            <p className="hero-tiny" style={{ marginTop: 34 }}>
              {stats?.total_articles
                ? `live · ${stats.beats} topics · ${stats.total_articles} english articles · ${stats.total_clusters} clusters · updated ${stamp || "\u2026"}`
                : `${stats?.beats ?? 20} topics configured · ingestion paused while the topic catalog is rebuilt`}
            </p>
          </div>
        </section>

        {/* COVERAGE */}
        <section className="marquee-strip">
          <div className="wrap">
            <span className="marquee-strip-label">Coverage includes</span>
          </div>
          <Marquee speed={52} gap="2.75rem" pauseOnHover>
            <div className="rail-items">
              {SOURCES.map((source) => (
                <span key={source} className="rail-item"><i />{source}</span>
              ))}
            </div>
          </Marquee>
        </section>

        {/* FEATURES */}
        <section className="scaffold" id="features">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-eyebrow">What you get</span>
              <h2 className="sec-title">News your agent can act on.</h2>
              <p className="sec-sub">
                Not another feed to read. A question you can afford to ask constantly, answered in
                something small enough to use straight away.
              </p>
            </div>
            <div className="features">
              {FEATURES.map(({ icon: Icon, title, desc, tag, viz }) => (
                <div key={title} className="feature viz-card">
                  <div className="viz">{viz}</div>
                  <div className="feature-body">
                    <span className="feature-icon"><Icon size={15} strokeWidth={1.75} /></span>
                    <h3 className="feature-title">{title}</h3>
                    <p className="feature-desc">{desc}</p>
                    <span className="feature-tag">{tag}</span>
                  </div>
                </div>
              ))}
            </div>
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
                  Most wakes return nothing, and nothing is cheap. When a topic does move, the same
                  agent pays four tenths of a cent for a short, cited brief and moves on. The cost
                  tracks the news, not the seat.
                </p>
                <ul>
                  <li>Wake on a schedule — a minute on a market topic, hourly on the rest</li>
                  <li>Pay per answer over x402, straight from the agent&rsquo;s wallet</li>
                  <li>Nothing moved is a real answer, and the cheapest one</li>
                  <li>Every call returns a receipt the operator can reconcile</li>
                </ul>
              </div>
              <div className="mock">
                <div className="mock-bar">
                  <span className="mock-dots"><span /><span /><span /></span>
                  <span className="mock-title">agent loop · one topic · one day</span>
                  <span className="mock-live">x402</span>
                </div>
                <div className="mock-feed">
                  <div className="mock-row">
                    <span className="k">06:00 wake</span>
                    <span className="v">check NVIDIA</span>
                    <span className="s">$0.0005</span>
                  </div>
                  <div className="mock-row">
                    <span className="k">06:00 nothing</span>
                    <span className="v">nothing moved · cursor held</span>
                    <span className="s">$0.0005</span>
                  </div>
                  <div className="mock-row">
                    <span className="k">06:30 wake</span>
                    <span className="v">three new stories · 14 publishers</span>
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

        {/* HOW IT WORKS */}
        <section className="scaffold" id="how">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-eyebrow">How it works</span>
              <h2 className="sec-title">Three steps, then it runs itself.</h2>
              <p className="sec-sub">
                You set it up once. After that the loop is the agent&rsquo;s problem, not yours.
              </p>
            </div>
            <div className="features">
              {STEPS.map((step) => (
                <div key={step.n} className="feature" style={{ minHeight: 220 }}>
                  <span className="feature-icon">{step.n}</span>
                  <h3 className="feature-title">{step.title}</h3>
                  <p className="feature-desc">{step.desc}</p>
                  <span className="feature-tag">{step.tag}</span>
                </div>
              ))}
            </div>
            <p className="more"><a href="/docs/quickstart">Follow the quickstart</a></p>
          </div>
        </section>

        {/* PRICING */}
        <section className="scaffold" id="pricing">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-eyebrow">Pricing</span>
              <h2 className="sec-title">Pay for answers, not for seats.</h2>
              <p className="sec-sub">
                Nothing moved is nearly free, so asking often is rational. A real answer costs less
                than half a cent.
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

        {/* SOLANA */}
        <section className="scaffold" id="settlement">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-eyebrow">Payment</span>
              <h2 className="sec-title">Metered per answer. Settled on Solana.</h2>
              <p className="sec-sub">
                Agent-native payment is a design choice, not a billing detail. There is no invoice to
                raise, no seat to license, and no human needed to approve a four-tenths-of-a-cent
                answer.
              </p>
            </div>
            <div className="showcase">
              <div>
                <h3>Two ways to pay, one balance.</h3>
                <p>
                  An agent with a wallet can pay per call and never sign up for anything. One that
                  polls all day funds a balance once and then skips the chain entirely. Solana
                  settles it, because it is the only rail where a sub-cent answer is economical.
                </p>
                <ul>
                  <li>x402 — one call, one payment, no account required</li>
                  <li>Prepaid — deposit USDC, USDT or SOL and draw down per call</li>
                  <li>Every call returns a receipt you can reconcile in USD</li>
                  <li>Empty answers stay cheap, so polling often is the point</li>
                </ul>
              </div>
              <div className="code">
                <div className="code-bar">402 Payment Required · Solana</div>
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
            <p className="more"><a href="/payment">How payment works</a></p>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section">
          <div className="wrap">
            <h2 className="cta-title">Never miss the signal.</h2>
            <p className="cta-sub">
              Point your agent at the topics that matter, give it a wallet, and let it tell you when
              something changes.
            </p>
            <div className="cta-row">
              <a className="btn-primary" href="/dashboard">Open the live terminal <ArrowRight size={14} /></a>
              <a className="btn-ghost" href="/docs">Read the docs</a>
            </div>
            <p className="cta-tiny">
              metered per answer · no seat licence · settled in USDC on Solana
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
