"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Clock,
  FileX,
  Gauge,
  Hash,
  KeyRound,
  Link2Off,
} from "lucide-react";
import Marquee from "@/components/ui/marquee/marquee";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://dnnoypytdfvsdenykooq.supabase.co/functions/v1/api";

interface Stats {
  beats: number;
  total_articles: number;
  total_clusters: number;
  english_only: boolean;
  clusters: Array<{
    cluster_id: string;
    beat_id: string;
    label: string;
    articles: number;
    latest_at: string | null;
  }>;
  recent: Array<{
    beat_label: string;
    lede: string;
    source: string;
    url: string;
    published_at: string;
    lang: string | null;
  }>;
}

interface Catalog {
  beats: Array<{ beat_id: string; label: string }>;
}

const RAILS = [
  "x402 · Solana",
  "Solana Pay",
  "USDC · USDT · SOL",
  "MCP",
  "REST API",
  "WebSocket",
  "Telegram",
  "Discord",
];

const VERBS = [
  {
    verb: "POST /resolve",
    asks: "A task in English",
    returns: "stable beat_id, warm first",
    price: "free → $0.001",
    next: true,
  },
  {
    verb: "POST /poll",
    asks: "Has this beat moved?",
    returns: "moved:false, or a pack",
    price: "$0.0005 / $0.004",
    next: false,
  },
  {
    verb: "POST /delta",
    asks: "What exactly, since the cursor?",
    returns: "items newer than high-water",
    price: "$0.004 / $0.02",
    next: false,
  },
  {
    verb: "POST /brief",
    asks: "A human asked a question",
    returns: "3–6 cited sentences + pack",
    price: "$0.03",
    next: true,
  },
  {
    verb: "POST /watch",
    asks: "Keep this beat warm",
    returns: "24-hour hold at 60 or 15 min",
    price: "$0.15–$0.50",
    next: true,
  },
];

const DEPOSIT_STEPS = [
  {
    n: "1",
    title: "Create a deposit",
    desc: "POST /v1/deposits returns a Solana Pay URL, a mint, an amount and a fresh reference key. The intent expires in 30 minutes.",
    tag: "solana:<treasury>?amount=…&spl-token=…&reference=…",
  },
  {
    n: "2",
    title: "Pay from any wallet",
    desc: "Phantom, Solflare, Backpack or anything that speaks Solana Pay. The reference rides along as a read-only account on the transfer.",
    tag: "one signature, one transfer",
  },
  {
    n: "3",
    title: "Credits land, calls draw",
    desc: "A watcher reads the reference on-chain, verifies mint, amount and recipient, then credits the balance. Calls draw from it, one receipt each.",
    tag: "getSignaturesForAddress(reference)",
  },
];

const INVARIANTS = [
  {
    icon: KeyRound,
    title: "No raw keys",
    desc: "Agents never receive a newsapi.ai key and never see the query language underneath. Beats are the whole interface.",
    tag: "invariant 01",
  },
  {
    icon: FileX,
    title: "No bodies",
    desc: "Packs never contain full article text. No body field exists at any price on this rail.",
    tag: "invariant 02",
  },
  {
    icon: Clock,
    title: "30-day wall",
    desc: "The agent rail never serves content older than 30 days. Not for a bigger customer. Not once.",
    tag: "invariant 03",
  },
  {
    icon: Link2Off,
    title: "Two rails, one balance",
    desc: "x402 buys a single call straight from the agent's wallet, with no account at all. A funded balance skips the chain per call. Both land in the same ledger.",
    tag: "invariant 04",
  },
  {
    icon: Gauge,
    title: "Resolve stays cheap",
    desc: "The front door is free to 100 calls a day and near-free after that, permanently. Never meter the funnel.",
    tag: "invariant 05",
  },
  {
    icon: Hash,
    title: "Deterministic beats",
    desc: "Two agents describing the same task hash to the same beat_id. Always — so a cursor stays valid across runtimes.",
    tag: "invariant 06",
  },
];

const LATENCY = [
  { name: "Pleiades", minutes: "2.4", fill: 3, us: true },
  { name: "Serper", minutes: "7.1", fill: 10, us: false },
  { name: "Brave", minutes: "9.8", fill: 14, us: false },
  { name: "Tavily", minutes: "11.6", fill: 16, us: false },
  { name: "Exa", minutes: "13.0", fill: 18, us: false },
  { name: "Perplexity", minutes: "14.4", fill: 20, us: false },
];

const PRICES = [
  {
    label: "poll · empty",
    price: "$0.0005",
    desc: "Most mornings, most beats have not moved. Empty is a feature, not a failure.",
  },
  {
    label: "poll moved / delta warm",
    price: "$0.004",
    desc: "Under a cent for a bounded, cited pack. Reuse is rewarded, re-reading is not.",
  },
  {
    label: "delta · cold",
    price: "$0.02",
    desc: "On-demand compute against the replica, cached for 15 minutes.",
  },
  {
    label: "brief",
    price: "$0.03",
    desc: "The only call that spends a mid-tier model. Kept off the cheap path on purpose.",
  },
];

const SEGMENT_ROWS: Array<[string, string, string]> = [
  ["Question", "What is happening on this?", "Full history"],
  ["Depth", "≤ 30 days", "2014 →"],
  ["Shape", "Pack · 8 ledes", "Bodies · ranges"],
  ["Cite", "Publisher URL", "Contracted feed"],
];

const AUDIENCES = [
  {
    title: "Traders & desks",
    desc: "Machine-speed awareness on English coverage, deduplicated and time-ordered, so a strategy reacts to structure instead of a headline.",
    tag: "poll on a schedule",
  },
  {
    title: "Agents & products",
    desc: "A real-time layer your system calls like any other tool — and, with x402 and ACP, pays for on its own without an invoice.",
    tag: "MCP · ACP · 402",
  },
  {
    title: "Newsrooms & creators",
    desc: "See which narratives are forming while they are still cheap to write about, with every claim traceable to a publisher.",
    tag: "citation on every item",
  },
];

const ROADMAP = [
  { when: "Live", what: "Catalog, 20 seeded beats, English article clusters, poll, delta, webhooks, live terminal" },
  { when: "Now", what: "x402 on Solana — 402 challenge, USDC quotes, facilitator settlement — plus deposits and the 100-beat catalog" },
  { when: "Next", what: "Wallet connect, prepaid balance drawdown, brief and watch verbs, MCP server, lead-time harness" },
  { when: "Later", what: "The Pleiades SPL credit token, batched x402 settlement, ACP jobs, desk export" },
];

const FAQ = [
  {
    q: "What is actually live today?",
    a: "Live now: the catalog, agent tool schema, pricing, stats, poll, delta and webhooks, against 20 seeded English beats that each carry their own article cluster. Not live yet: Solana deposits, the meter, resolve, receipts, brief, watch, the MCP server and x402 settlement. Live ingestion is paused while the topic queries are rebuilt for a 100-beat catalog, so the terminal shows the current state of the graph rather than a moving one.",
  },
  {
    q: "Is this a search engine?",
    a: "No, and it is not trying to be. Search answers a question once and forgets it. Pleiades keeps a cursor per beat, so the question your agent asks on a schedule is \u201chas this moved since I last looked?\u201d — and \u201cno\u201d is a cheap, successful, billable answer.",
  },
  {
    q: "Do I get article bodies?",
    a: "Never. No body field exists at any price on the agent rail. A pack holds at most 8 items with ledes capped at 320 characters, a bounded token estimate, and publisher URL, source, timestamp, language, concepts and sentiment on every item. You get the signal and the citation; you fetch the body yourself.",
  },
  {
    q: "How fast is \u201cbefore the mainstream\u201d?",
    a: "Beats refresh on a 60-minute target with a 90-minute freshness SLO, and market beats are built to tighten to 5\u201315 minutes. Every item carries first_indexed_at next to published_at, so lead time is a field in the payload rather than a marketing line. The public comparison harness ships with the next milestone; until then the board above is illustrative.",
  },
  {
    q: "How do I fund an account?",
    a: "Create a deposit, pay it from any Solana wallet, and the credits land once the transfer confirms. We take USDC, USDT and SOL; a unique reference key ties the payment to your deposit, so reconciliation is exact rather than a guess. The minimum deposit is $1, credits are held in USD micros, and they do not expire.",
  },
  {
    q: "Can my agent pay for itself?",
    a: "That is the whole point of the x402 rail, and it is not live yet. The agent hits a call, gets a 402 quoting the price in USDC, signs a Solana transfer and retries the same request, so it can buy news without an account, a key or a human. A deposit rail skips the chain per call for agents that poll on a schedule. A default daily cap of $0.50 and 50 distinct beats per identity keeps a looping tool call from becoming an incident.",
  },
  {
    q: "Which tokens do you accept?",
    a: "USDC and USDT (SPL) and native SOL. Deposits are credited in USD micros at the quoted rate, and the receipt keeps both the rate and the transaction signature. Send the wrong mint or the wrong network and the transfer cannot be credited — check the mint address in the deposit response before you sign.",
  },
  {
    q: "Is the Pleiades token an investment?",
    a: "No. It is a usage credit and nothing else: not a share, not a yield, not a claim on revenue, with no promised market and no buyback. It is planned as a standard SPL token with a fixed supply and no mint authority, accepted as a deposit rail at a quoted rate. Treat any other description of it as wrong.",
  },
  {
    q: "What is x402?",
    a: "An open payment scheme built on HTTP 402. The server answers an unpaid request with the price and the asset it wants; the client pays and retries the identical request with proof of payment. On Solana that is a USDC transfer, partially signed by the agent's wallet and completed by a facilitator that also covers the network fee.",
  },
  {
    q: "Does every call cost a transaction?",
    a: "It depends which rail you are on. With x402, one call is one payment. On the prepaid rail only the deposit touches the chain and calls draw from the balance off-chain, which is why hourly polling is cheaper there. Both rails write the same receipt, so you can always see which one a call used.",
  },
];

function hhmm(iso: string | null): string {
  if (!iso) return "—";
  return `${iso.slice(11, 16)}Z`;
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [beats, setBeats] = useState<Array<{ beat_id: string; label: string }>>([]);
  const [stamp, setStamp] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [statsRes, catalogRes] = await Promise.all([
          fetch(`${API_BASE}/v1/stats`, { cache: "no-store" }),
          fetch(`${API_BASE}/v1/catalog`, { cache: "no-store" }),
        ]);
        if (cancelled) return;
        if (statsRes.ok) setStats((await statsRes.json()) as Stats);
        if (catalogRes.ok) {
          const catalog = (await catalogRes.json()) as Catalog;
          setBeats(catalog.beats ?? []);
        }
        setStamp(new Date().toLocaleTimeString());
      } catch {
        /* paused */
      }
    }
    load();
    const id = setInterval(load, 20000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const items = stats?.recent ?? [];
  const counts = new Map((stats?.clusters ?? []).map((c) => [c.beat_id, c]));
  const catalogRows = [...beats]
    .sort((a, b) => {
      const ca = counts.get(a.beat_id)?.articles ?? 0;
      const cb = counts.get(b.beat_id)?.articles ?? 0;
      if (cb !== ca) return cb - ca;
      return a.label.localeCompare(b.label);
    })
    .slice(0, 6);
  const ticker = items.length
    ? items.slice(0, 8)
    : [{ beat_label: "PLEIADES", lede: "Awaiting the next ingestion cycle.", source: "system", url: "#", published_at: "", lang: "eng" }];

  return (
    <>
      <nav className="nav">
        <div className="nav-pill">
          <a className="nav-logo" href="/">
            PLEIADES <i /> <small>agent rail</small>
          </a>
          <span className="nav-links">
            <a className="nav-link" href="#contract">How it works</a>
            <a className="nav-link" href="#pricing">Pricing</a>
            <a className="nav-link" href="#settlement">Solana</a>
            <a className="nav-link" href="#install">API</a>
            <a className="nav-link" href="#faq">FAQ</a>
          </span>
          <a className="nav-cta" href="/dashboard">Open terminal</a>
        </div>
      </nav>

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
                Search is commoditised at about $0.0012 a query. Pleiades is scheduled awareness —
                state, cluster breadth and a cursor. If a feature only makes sense in the left
                column, it belongs to a product we are not building.
              </p>
            </div>

            <div className="showcase">
              <div>
                <h3>Who asks: a human once, or a machine forever.</h3>
                <p>
                  A search box answers a question and forgets it. A beat keeps state. Your agent
                  polls a cursor and gets one of exactly two answers — nothing moved, or a bounded
                  pack. There is no result page to re-rank and no ranking to argue with.
                </p>
                <ul>
                  <li>No search box. No playground. No news homepage.</li>
                  <li>Builders copy a worker; they do not copy a screenshot.</li>
                  <li>Empty is a real answer, and it is nearly free.</li>
                </ul>
              </div>
              <div className="mock">
                <div className="mock-bar">
                  <span className="mock-dots"><span /><span /><span /></span>
                  <span className="mock-title">$0.0012 / query</span>
                  <span className="mock-title" style={{ marginLeft: "auto" }}>per wake-up</span>
                </div>
                <div className="mock-feed">
                  <div className="mock-row" style={{ background: "var(--bg-raised)" }}>
                    <span className="k">axis</span>
                    <span className="v" style={{ color: "var(--text-muted)" }}>search</span>
                    <span className="s" style={{ color: "var(--text-muted)" }}>scheduled awareness</span>
                  </div>
                  <div className="mock-row">
                    <span className="k">Who asks</span>
                    <span className="v">A human, once</span>
                    <span className="s">A machine, forever</span>
                  </div>
                  <div className="mock-row">
                    <span className="k">What wins</span>
                    <span className="v">Recall and ranking</span>
                    <span className="s">State + breadth</span>
                  </div>
                  <div className="mock-row">
                    <span className="k">Unit of billing</span>
                    <span className="v">Per query</span>
                    <span className="s">Per wake-up</span>
                  </div>
                  <div className="mock-row">
                    <span className="k">Incumbent</span>
                    <span className="v">Exa · Tavily · Brave · Serper</span>
                    <span className="s">None</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 02 CONTRACT */}
        <section className="scaffold" id="contract">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-eyebrow">02 · Contract</span>
              <h2 className="sec-title">Five verbs. One cursor.</h2>
              <p className="sec-sub">
                Field names freeze after week three; identifiers in mono are exact. The agent rail
                never serves bodies, and will never serve content older than 30 days.
              </p>
            </div>

            <div className="mock">
              <div className="mock-bar">
                <span className="mock-dots"><span /><span /><span /></span>
                <span className="mock-title">GET /v1/tools · the five verbs</span>
                <span className="mock-live">live</span>
              </div>
              <div className="mock-feed">
                <div className="mock-row" style={{ background: "var(--bg-raised)" }}>
                  <span className="k">verb</span>
                  <span className="v" style={{ color: "var(--text-muted)" }}>asks → returns</span>
                  <span className="s" style={{ color: "var(--text-muted)" }}>status · price</span>
                </div>
                {VERBS.map((v) => (
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
                <span>resolve · brief · watch · receipts next</span>
                <span style={{ marginLeft: "auto" }}>cursor is opaque, signed, beat-bound</span>
              </div>
            </div>

            <div className="showcase">
              <div>
                <span className="sec-eyebrow">The pack</span>
                <h3>A pack is not an article list.</h3>
                <p>
                  It is the smallest object that lets a model write one correct, cited sentence.
                  Source breadth — distinct publishers inside the beat&rsquo;s article cluster — is
                  the field competitors cannot copy, because they never had to compute it.
                </p>
                <ul>
                  <li>Citations point at publishers. Receipts point at Pleiades. The two identifiers never merge.</li>
                  <li>At most 8 items, 320-character ledes, ≤800 p95 tokens — citation, not reproduction.</li>
                  <li>first_indexed_at on every item: the lead-time claim, in the payload.</li>
                </ul>
              </div>
              <div className="code">
                <div className="code-bar">POST /v1/poll · 200 OK · moved</div>
                <pre>{`{
  "beat_id": "b_dab9c000dca5",
  "beat_label": "EU AI Act",
  "moved": true,
  "item_count": 3,
  "token_estimate": 611,
  "cursor": "c_eyJiIjoi…",
  "receipt_id": "r_01JQ8ZK4M2X",
  "items": [
    {
      "lede": "The Commission opened consultation on GPAI transparency obligations, with responses due 14 October.",
      "source": "Reuters",
      "published_at": "2026-09-09T06:41:00Z",
      "first_indexed_at": "2026-09-09T06:43:00Z",
      "lang": "eng",
      "sentiment": -0.12
    }
  ]
}`}</pre>
              </div>
            </div>
          </div>
        </section>

        {/* 03 CATALOG */}
        <section className="scaffold" id="catalog">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-eyebrow">03 · Catalog</span>
              <h2 className="sec-title">Demand grows the graph. We do not guess it.</h2>
              <p className="sec-sub">
                Warm beats will be precomputed; cold beats compute on demand and promote once two
                distinct paying agents read them inside seven days. Publishing buyer counts is the
                point — builders should self-select toward packs that are already cheap and fast.
              </p>
            </div>

            <div className="showcase">
              <div>
                <h3>One beat, one article cluster.</h3>
                <p>
                  We do not re-cluster the world for you. A beat is a living query, and its English
                  articles form that beat&rsquo;s article cluster — deduplicated and ordered by
                  publication time. What you subscribe to is exactly what you get: no opaque
                  grouping, no story-merging you did not ask for.
                </p>
                <ul>
                  <li>Cluster per beat, addressed by a stable beat_id</li>
                  <li>English only, so no translation drift in the stream</li>
                  <li>Newest first, with a cursor that never skips and never repeats</li>
                  <li>Every beat carries a warm or cold state you can route on</li>
                </ul>
              </div>
              <div className="mock">
                <div className="mock-bar">
                  <span className="mock-dots"><span /><span /><span /></span>
                  <span className="mock-title">GET /v1/catalog · live</span>
                  <span className="mock-live">{stats?.total_clusters ?? 0} active</span>
                </div>
                <div className="mock-feed">
                  {catalogRows.map((b) => {
                    const c = counts.get(b.beat_id);
                    const n = c?.articles ?? 0;
                    return (
                      <div key={b.beat_id} className="mock-row">
                        <span className="k" title={b.beat_id}>{b.label}</span>
                        <span className="v">
                          {n} english article{n === 1 ? "" : "s"}
                          {c?.latest_at ? ` · newest ${hhmm(c.latest_at)}` : " · awaiting ingestion"}
                        </span>
                        <span className="s">{n > 0 ? "◈ warm" : "◇ cold"}</span>
                      </div>
                    );
                  })}
                  {catalogRows.length === 0 && (
                    <div className="mock-row">
                      <span className="k">awaiting</span>
                      <span className="v">Catalog unreachable — the terminal shows what it last saw.</span>
                      <span className="s">system</span>
                    </div>
                  )}
                </div>
                <div className="mock-foot">
                  <span>warm · precomputed</span>
                  <span>cold · on demand</span>
                  <span style={{ marginLeft: "auto" }}>promotion + buyer counts next</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 04 LEAD TIME */}
        <section className="scaffold" id="lead-time">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-eyebrow">04 · Lead time</span>
              <h2 className="sec-title">The claim is a measurement.</h2>
              <p className="sec-sub">
                Minutes from publisher timestamp to first appearance in the index, against Exa,
                Tavily, Brave, Serper and Perplexity grounding. Every pack already carries its own
                evidence as first_indexed_at.
              </p>
            </div>

            <div className="mock">
              <div className="mock-bar">
                <span className="mock-dots"><span /><span /><span /></span>
                <span className="mock-title">median minutes · breaking sample · last 7d</span>
                <span className="mock-live">harness next</span>
              </div>
              <div className="mock-feed">
                {LATENCY.map((l) => (
                  <div key={l.name} className="mock-row">
                    <span className="k" style={l.us ? { color: "var(--text-primary)" } : undefined}>{l.name}</span>
                    <span className="v">
                      <span style={{ color: l.us ? "#fff" : "#5f5f5f" }}>{"█".repeat(l.fill)}</span>
                      <span style={{ color: "#242424" }}>{"░".repeat(20 - l.fill)}</span>
                    </span>
                    <span className="s" style={l.us ? { color: "var(--text-primary)" } : undefined}>{l.minutes}</span>
                  </div>
                ))}
              </div>
              <div className="mock-foot">
                <span>target board · illustrative until the public harness ships</span>
                <span style={{ marginLeft: "auto" }}>flat category → $0.004 is unsupportable</span>
              </div>
            </div>
            <p className="hero-tiny">
              a category that comes back flat is better learned in week six than month nine — the
              harness ships open source and runs on the same workers that serve the rail.
            </p>
          </div>
        </section>

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

        {/* THE INVARIANTS */}
        <section className="scaffold" id="invariants">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-eyebrow">The invariants</span>
              <h2 className="sec-title">Six promises that do not move.</h2>
              <p className="sec-sub">
                Every one of these is a constraint on us, not a feature for you. They are what make
                a cursor worth storing and a price worth trusting.
              </p>
            </div>
            <div className="features">
              {INVARIANTS.map(({ icon: Icon, title, desc, tag }) => (
                <div key={title} className="feature">
                  <span className="feature-icon"><Icon size={14} strokeWidth={1.75} /></span>
                  <h3 className="feature-title">{title}</h3>
                  <p className="feature-desc">{desc}</p>
                  <span className="feature-tag">{tag}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 08 INSTALL */}
        <section className="scaffold" id="install">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-eyebrow">08 · Install</span>
              <h2 className="sec-title">Boring tools survive model churn.</h2>
              <p className="sec-sub">
                An OpenAI-compatible tool schema ships today; an MCP server that hits the same
                handlers ships next. The open spec publishes beat_id canonicalisation, the pack
                schema and the five verbs — not the graph.
              </p>
            </div>

            <div className="showcase">
              <div>
                <h3>Resolve once, poll forever.</h3>
                <p>
                  A cron job, a wallet and two requests. If your agent can call a tool, it can hold
                  a beat through a news cycle without a human in the loop. Polling and delta work
                  today; resolve joins them with the canonicalisation spec.
                </p>
                <ul>
                  <li>Deterministic beats: the same task will hash to the same beat_id</li>
                  <li>Cursor comes back on every call — store it and never re-read</li>
                  <li>8 items and 800 tokens, enforced by the pack schema</li>
                </ul>
              </div>
              <div className="code">
                <div className="code-bar">// poll forever — live today</div>
                <pre>{`curl -s $PLEIADES/v1/poll \\
  -H "Content-Type: application/json" \\
  -d '{"beat_id":"b_bb964843350e","cursor":null}'

# resolve (task → beat_id) ships next
curl -s $PLEIADES/v1/resolve \\
  -H "Content-Type: application/json" \\
  -d '{"task":"I am writing a due diligence
       memo on Nvidia China exposure"}'

# x402 deposit + X-PAYMENT credential land with the meter`}</pre>
              </div>
            </div>

            <div className="showcase flip" style={{ alignItems: "start" }}>
              <div className="code">
                <div className="code-bar">GET /v1/tools · live</div>
                <pre>{`{
  "tools": [{
    "type": "function",
    "function": {
      "name": "pleiades_poll",
      "description": "Ask whether a beat has
        moved since the cursor. Prefer this
        on a schedule.",
      "parameters": {
        "type": "object",
        "properties": {
          "beat_id": { "type": "string" },
          "cursor": { "type": ["string","null"] }
        },
        "required": ["beat_id"]
      }
    }
  }]
}`}</pre>
              </div>
              <div className="code">
                <div className="code-bar">MCP · same handlers · next</div>
                <pre>{`// not served yet — GET /v1/tools is live today
{
  "mcpServers": {
    "pleiades": {
      "url": "https://pleiades.news/mcp",
      "headers": {
        "X-PAYMENT": "\${PLEIADES_CREDENTIAL}"
      }
    }
  }
}`}</pre>
              </div>
            </div>

            <div className="code" style={{ marginTop: 40 }}>
              <div className="code-bar">beat_id canonicalisation · public spec</div>
              <pre>{`canonical = sorted(concept_uris).join("|")
          + "::" + sorted(topic_filters).join("|")
          + "::" + sorted(languages).join("|")

beat_id = "b_" + sha256(canonical).hexdigest()[:12]

# Published so external implementations can converge on it.
# Not enforced yet: seeded beats carry literal ids until
# resolve ships. Changing it later breaks stored cursors.`}</pre>
            </div>
          </div>
        </section>

        {/* 09 SEGMENTATION */}
        <section className="scaffold" id="segmentation">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-eyebrow">09 · Segmentation</span>
              <h2 className="sec-title">Agents get now. Desks get then.</h2>
              <p className="sec-sub">
                The dividing line is time depth, not content depth. If a fund could replace a
                six-figure archive contract with forty dollars of metered agent calls, the new rail
                would eat the business it was meant to extend.
              </p>
            </div>

            <div className="showcase">
              <div>
                <h3>Two rails, one graph.</h3>
                <p>
                  The agent rail is a bounded pack inside a 30-day window: enough to answer what is
                  happening, cheap enough to ask every hour. The desk rail is the archive — bodies,
                  ranges and export, contracted and dated back to 2014.
                </p>
                <ul>
                  <li>Agent rail: pack of ≤8 ledes, publisher URL, ≤30 days, per wake-up</li>
                  <li>Desk rail: export, bodies, ranges, contracted feed</li>
                  <li>Same beats underneath, so nothing has to be reconciled twice</li>
                </ul>
              </div>
              <div className="mock">
                <div className="mock-bar">
                  <span className="mock-dots"><span /><span /><span /></span>
                  <span className="mock-title">segmentation · depth is the line</span>
                </div>
                <div className="mock-feed">
                  <div className="mock-row" style={{ background: "var(--bg-raised)" }}>
                    <span className="k">need</span>
                    <span className="v" style={{ color: "var(--text-muted)" }}>agent rail</span>
                    <span className="s" style={{ color: "var(--text-muted)" }}>desk rail</span>
                  </div>
                  {SEGMENT_ROWS.map(([need, agent, desk]) => (
                    <div key={need} className="mock-row">
                      <span className="k">{need}</span>
                      <span className="v">{agent}</span>
                      <span className="s">{desk}</span>
                    </div>
                  ))}
                </div>
                <div className="mock-foot">
                  <span>compute once</span>
                  <span>sell many times</span>
                  <span style={{ marginLeft: "auto" }}>charge the wake-up</span>
                </div>
              </div>
            </div>

            <div className="features" style={{ marginTop: 40 }}>
              {AUDIENCES.map((a) => (
                <div key={a.title} className="feature" style={{ minHeight: 190 }}>
                  <h3 className="feature-title">{a.title}</h3>
                  <p className="feature-desc">{a.desc}</p>
                  <span className="feature-tag">{a.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* STATUS */}
        <section className="scaffold" id="status">
          <div className="wrap">
            <div className="sec-head">
              <span className="sec-eyebrow">Status</span>
              <h2 className="sec-title">What is shipped, and what is not.</h2>
              <p className="sec-sub">
                Early users deserve to know exactly where the line is. This is it.
              </p>
            </div>
            <div className="features" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
              {ROADMAP.map((r) => (
                <div key={r.when} className="feature" style={{ minHeight: 160 }}>
                  <span className="feature-tag" style={{ marginTop: 0, paddingTop: 0 }}>{r.when}</span>
                  <p className="feature-desc" style={{ marginTop: 12 }}>{r.what}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="scaffold" id="faq">
          <div className="wrap-tight">
            <div className="sec-head">
              <span className="sec-eyebrow">FAQ</span>
              <h2 className="sec-title">The questions we get first.</h2>
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

        <footer className="site">
          <div className="wrap">
            <div className="footer-row">
              <div className="footer-brand-line">
                <span className="footer-co">PLEIADES</span>
                <span style={{ color: "var(--border-strong)" }}>/</span>
                <span className="footer-address">agent rail · spec v1</span>
              </div>
              <div className="footer-links">
                <a href="/dashboard">Terminal</a>
                <a href="#contract">How it works</a>
                <a href="#pricing">Pricing</a>
                <a href="#settlement">Solana</a>
                <a href="#install">API</a>
                <a href="#faq">FAQ</a>
              </div>
            </div>
            <div className="footer-row" style={{ marginTop: 10 }}>
              <span className="footer-address">
                the real-time news API for AI agents · markets move on news in seconds
              </span>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
