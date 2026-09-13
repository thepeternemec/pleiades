"use client";

import { useEffect, useState } from "react";
import { API_BASE, type Catalog, type Stats } from "./content";

/**
 * One live poll of the public API, shared by every page that shows real data.
 * `/v1/stats` drives the counts and `/v1/catalog` the beat list; both are public
 * and unmetered, so this costs nothing.
 */
export function usePleiadesStats(intervalMs = 20000) {
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
        /* ingestion paused — the page renders its empty states */
      }
    }
    load();
    const id = setInterval(load, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs]);

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
    : [
        {
          beat_label: "PLEIADES",
          lede: "Awaiting the next ingestion cycle.",
          source: "system",
          url: "#",
          published_at: "",
          lang: "eng",
        },
      ];

  return { stats, beats, stamp, items, counts, catalogRows, ticker };
}
