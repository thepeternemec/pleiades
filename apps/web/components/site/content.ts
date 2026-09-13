import { Clock, FileX, Gauge, Hash, KeyRound, Link2Off } from "lucide-react";

/**
 * Shared content for the Pleiades site.
 *
 * The landing page had grown to ~16 sections and 1300 lines. The substance now
 * lives on subpages, and this module is the single source every page reads.
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://dnnoypytdfvsdenykooq.supabase.co/functions/v1/api";

export interface Stats {
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

export interface Catalog {
  beats: Array<{ beat_id: string; label: string }>;
}

export const RAILS = [
  "x402 · Solana",
  "Solana Pay",
  "USDC · USDT · SOL",
  "MCP",
  "REST API",
  "WebSocket",
  "Telegram",
  "Discord",
];

export const VERBS = [
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

export const DEPOSIT_STEPS = [
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

export const INVARIANTS = [
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

export const LATENCY = [
  { name: "Pleiades", minutes: "2.4", fill: 3, us: true },
  { name: "Serper", minutes: "7.1", fill: 10, us: false },
  { name: "Brave", minutes: "9.8", fill: 14, us: false },
  { name: "Tavily", minutes: "11.6", fill: 16, us: false },
  { name: "Exa", minutes: "13.0", fill: 18, us: false },
  { name: "Perplexity", minutes: "14.4", fill: 20, us: false },
];

export const PRICES = [
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

export const SEGMENT_ROWS: Array<[string, string, string]> = [
  ["Question", "What is happening on this?", "Full history"],
  ["Depth", "≤ 30 days", "2014 →"],
  ["Shape", "Pack · 8 ledes", "Bodies · ranges"],
  ["Cite", "Publisher URL", "Contracted feed"],
];

export const AUDIENCES = [
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

export const ROADMAP = [
  { when: "Live", what: "Catalog, 20 seeded beats, English article clusters, poll, delta, webhooks, live terminal" },
  { when: "Now", what: "x402 on Solana — 402 challenge, USDC quotes, facilitator settlement — plus deposits and the 100-beat catalog" },
  { when: "Next", what: "Wallet connect, prepaid balance drawdown, brief and watch verbs, MCP server, lead-time harness" },
  { when: "Later", what: "The Pleiades SPL credit token, batched x402 settlement, ACP jobs, desk export" },
];

export const FAQ = [
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

export function hhmm(iso: string | null): string {
  if (!iso) return "\u2014";
  return `${iso.slice(11, 16)}Z`;
}
