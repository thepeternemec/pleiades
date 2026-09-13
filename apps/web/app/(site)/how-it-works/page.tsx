"use client";

import SiteNav from "@/components/site/site-nav";
import SiteFooter from "@/components/site/site-footer";
import { VERBS, INVARIANTS, SEGMENT_ROWS, AUDIENCES } from "@/components/site/content";
import { usePleiadesStats } from "@/components/site/use-stats";
import { hhmm } from "@/components/site/content";

export default function Page() {
  const { stats, stamp, items, counts, catalogRows, ticker } = usePleiadesStats();

  return (
    <>
      <SiteNav active="/how-it-works" />
      <main>
        <div className="page-head">
          <div className="wrap">
            <span className="sec-eyebrow">How it works</span>
            <h1 className="sec-title">Firehose in. Signal out.</h1>
            <p className="sec-sub">Three stages run continuously per topic, and you only ever touch the output of the last one.</p>
          </div>
        </div>
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
      </main>
      <SiteFooter />
    </>
  );
}
