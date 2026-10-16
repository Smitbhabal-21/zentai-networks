"use client";

import { useMemo, useState } from "react";
import type { Company } from "@/lib/companies";
import { rankVolume, type VolumeMetric, type VolumeRankRow } from "@/lib/volume-rank";

type Row = VolumeRankRow & { company: Company };
const shares = (value: number | null | undefined) => value == null ? "—" : new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
const movement = (value: number | null | undefined) => value == null ? "—" : `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;

export function VolumeLeaders({ rows, universeCount, selectedTicker, onSelect }: {
  rows: Row[];
  universeCount: number;
  selectedTicker: string;
  onSelect: (company: Company) => void;
}) {
  const [metric, setMetric] = useState<VolumeMetric>("relative");
  const ranking = useMemo(() => rankVolume(rows, metric), [rows, metric]);
  const max = Math.max(...ranking.high.map(row => metric === "relative" ? row.summary?.relativeVolume || 0 : row.summary?.volume || 0), 1);
  const open = (company: Company) => {
    onSelect(company);
    requestAnimationFrame(() => document.getElementById("signal-detail")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const list = (items: Row[], label: string, kind: "high" | "low") => <div className={`volume-rank-list ${kind}`}>
    <div className="volume-rank-list-head"><span>{kind === "high" ? "↑" : "↓"} {label}</span><small>{items.length} names</small></div>
    {items.length ? items.map((row, index) => {
      const summary = row.summary!;
      const value = metric === "relative" ? summary.relativeVolume! : summary.volume!;
      return <button type="button" key={row.company.ticker} className={`volume-rank-row ${row.company.ticker === selectedTicker ? "selected" : ""}`} onClick={() => open(row.company)} title={`${row.company.name} · ${shares(summary.volume)} reported shares · ${summary.relativeVolume?.toFixed(2) || "—"}× prior 20-session average · ${movement(summary.dayReturn)} close-to-close · ${summary.source || "Source unavailable"}`}>
        <span className="volume-rank-number">{index + 1}</span><span className="volume-rank-company"><strong>{row.company.ticker}</strong><small>{row.company.name}</small></span>
        <span className="volume-rank-value"><strong>{metric === "relative" ? `${value.toFixed(2)}×` : shares(value)}</strong><small className={summary.dayReturn == null ? "" : summary.dayReturn > 0 ? "up" : summary.dayReturn < 0 ? "down" : ""}>{movement(summary.dayReturn)} move</small></span>
        <span className="volume-rank-track"><i style={{ width: `${Math.max(5, Math.min(100, value / max * 100))}%` }} /></span>
      </button>;
    }) : <p className="note">Scan more companies to compare this end of the ranking.</p>}
  </div>;
  return <section className="volume-rank" aria-label="Reported volume rankings">
    <div className="volume-rank-heading"><div><p className="eyebrow">LATEST REPORTED SESSION · VOLUME FLOW</p><h3>High and low volume movers</h3><p>Ranked among companies with usable volume on the same session. Select a name to inspect its dated chart.</p></div><div className="volume-rank-switch" role="group" aria-label="Volume ranking measure"><button type="button" aria-pressed={metric === "relative"} onClick={() => setMetric("relative")}>Relative volume</button><button type="button" aria-pressed={metric === "shares"} onClick={() => setMetric("shares")}>Shares traded</button></div></div>
    <div className="volume-rank-meta"><strong>{ranking.session || "No dated volume"}</strong><span>{ranking.eligible} comparable of {rows.length} shown · {universeCount} in universe</span><span>{metric === "relative" ? "Latest volume ÷ prior 20-session average" : "Latest reported shares traded"}</span></div>
    <div className="volume-rank-columns">{list(ranking.high, "Highest 10", "high")}{list(ranking.low, "Lowest 10", "low")}</div>
    <p className="source">Yahoo Finance daily chart volume, fetched for scanned names; public data may be delayed. Use “Scan remaining companies” above for full-universe coverage. Today’s bar can be incomplete during market hours. “Low” means fewer shares or lower relative participation, not a bearish signal. Lists fill to 10 each as coverage grows; an unscanned name is never ranked.</p>
  </section>;
}
