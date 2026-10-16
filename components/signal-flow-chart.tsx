"use client";

import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowRight } from "lucide-react";
import type { Company } from "@/lib/companies";
import type { SignalFactor } from "@/lib/signal-map";

type FlowSignal = {
  state: "Bullish" | "Mixed" | "Bearish" | null;
  score: number | null;
  close: number | null;
  observedAt: string | null;
  source: string | null;
  factors: SignalFactor[];
  error: string | null;
};
export type FlowRow = { company: Company; summary?: FlowSignal };

const buckets = [
  { key: "Bullish", label: "Bullish", y: 105 },
  { key: "Mixed", label: "Mixed", y: 238 },
  { key: "Bearish", label: "Bearish", y: 371 },
  { key: "Unscanned", label: "Unscanned", y: 504 },
] as const;
const bucketOf = (row: FlowRow) => row.summary?.state || "Unscanned";
const money = (value: number | null | undefined) => value == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);

export function SignalFlowChart({ rows, selectedTicker, onSelect, onSectorSelect }: {
  rows: FlowRow[];
  selectedTicker: string;
  onSelect: (company: Company) => void;
  onSectorSelect: (sector: string) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const sectors = useMemo(() => [...new Set(rows.map(row => row.company.sector))].sort(), [rows]);
  const layout = useMemo(() => {
    const bySector = new Map<string, number>();
    const byBucket = new Map<string, number>();
    const totals = new Map(buckets.map(bucket => [bucket.key, rows.filter(row => bucketOf(row) === bucket.key).length]));
    return rows.map(row => {
      const sector = row.company.sector;
      const bucket = bucketOf(row);
      const sectorIndex = sectors.indexOf(sector);
      const sectorRank = bySector.get(sector) || 0;
      const bucketRank = byBucket.get(bucket) || 0;
      bySector.set(sector, sectorRank + 1);
      byBucket.set(bucket, bucketRank + 1);
      const sectorCount = rows.filter(item => item.company.sector === sector).length;
      const sourceCenter = sectors.length === 1 ? 304 : 42 + sectorIndex * 52;
      const sourceY = sourceCenter + (sectorCount < 2 ? 0 : (sectorRank / (sectorCount - 1) - .5) * 34);
      const destinationCenter = buckets.find(item => item.key === bucket)!.y;
      const bucketCount = totals.get(bucket) || 1;
      const destinationY = destinationCenter + (bucketCount < 2 ? 0 : (bucketRank / (bucketCount - 1) - .5) * 72);
      return { ...row, bucket, sourceY, destinationY,
        path: `M 184 ${sourceY.toFixed(2)} C 337 ${sourceY.toFixed(2)}, 437 ${destinationY.toFixed(2)}, 744 ${destinationY.toFixed(2)}` };
    });
  }, [rows, sectors]);
  const focus = rows.find(row => row.company.ticker === hovered) || rows.find(row => row.company.ticker === selectedTicker) || rows[0];
  const focusLine = layout.find(row => row.company.ticker === focus?.company.ticker);
  const focusState = focus ? bucketOf(focus) : "Unscanned";
  const open = (company: Company) => {
    onSelect(company);
    requestAnimationFrame(() => document.getElementById("signal-detail")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  return <div className="signal-river-shell">
    <div className="signal-river-scroll"><svg className="signal-river" viewBox="0 0 960 610" role="img" aria-label={`${rows.length} company paths from ${sectors.length} sectors into dated bullish, mixed, bearish, or unscanned buckets`}>
      <defs><linearGradient id="river-field" x1="0" x2="1" y1="0" y2="1"><stop stopColor="var(--panel2)" /><stop offset="1" stopColor="var(--panel)" /></linearGradient></defs>
      <rect x="0" y="0" width="960" height="610" rx="18" fill="url(#river-field)" />
      <text x="22" y="24" className="signal-river-label">SECTORS</text><text x="410" y="24" className="signal-river-label">OBSERVED PATHS · ONE PER COMPANY</text><text x="775" y="24" className="signal-river-label">CURRENT STATE</text>
      {sectors.map((name, index) => { const y = sectors.length === 1 ? 304 : 42 + index * 52; return <g key={name} className="signal-river-sector" onClick={() => onSectorSelect(name)}><rect x="10" y={y - 18} width="160" height="36" rx="9" /><text x="20" y={y + 4}>{name.length > 19 ? `${name.slice(0, 18)}…` : name}</text><title>Filter to {name}</title></g>; })}
      {buckets.map(bucket => { const count = layout.filter(row => row.bucket === bucket.key).length; return <g className={`signal-river-bucket ${bucket.key.toLowerCase()}`} key={bucket.key}><rect x="766" y={bucket.y - 38} width="180" height="76" rx="13" /><text x="782" y={bucket.y - 4} className="signal-river-bucket-name">{bucket.label}</text><text x="782" y={bucket.y + 22} className="signal-river-bucket-count">{count} {count === 1 ? "company" : "companies"}</text></g>; })}
      {layout.filter(row => row.bucket === "Unscanned").map(row => <g key={row.company.ticker}><path d={row.path} className="signal-river-path unscanned" /><path d={row.path} className="signal-river-hit" onMouseEnter={() => setHovered(row.company.ticker)} onMouseLeave={() => setHovered(null)} onClick={() => open(row.company)}><title>{row.company.name}: not scanned; open to request dated history.</title></path></g>)}
      {layout.filter(row => row.bucket !== "Unscanned").map(row => <g key={row.company.ticker}><path d={row.path} className={`signal-river-path ${row.bucket.toLowerCase()}`} /><path d={row.path} className={`signal-river-stream ${row.bucket.toLowerCase()}`} /><path d={row.path} className="signal-river-hit" onMouseEnter={() => setHovered(row.company.ticker)} onMouseLeave={() => setHovered(null)} onClick={() => open(row.company)}><title>{row.company.name}: {row.bucket}, score {row.summary?.score}/5 from {row.summary?.observedAt?.slice(0, 10)}.</title></path></g>)}
      {focusLine && <><path d={focusLine.path} className={`signal-river-highlight ${focusState.toLowerCase()}`} /><circle cx="184" cy={focusLine.sourceY} r="5" className={`signal-river-point ${focusState.toLowerCase()}`} /><circle cx="744" cy={focusLine.destinationY} r="5" className={`signal-river-point ${focusState.toLowerCase()}`} /></>}
    </svg></div>
    <aside className="signal-river-focus" aria-live="polite"><p className="eyebrow">HOVER A PATH · OPEN A COMPANY</p>{focus ? <><strong className="signal-river-ticker">{focus.company.ticker}</strong><h3>{focus.company.name}</h3><span className="signal-river-sector-label">{focus.company.sector}</span><div className={`signal-river-focus-state ${focusState.toLowerCase()}`}><strong>{focusState}</strong><span>{focus.summary?.score == null ? "Awaiting chart" : `${focus.summary.score > 0 ? "+" : ""}${focus.summary.score} / 5`}</span></div><div className="signal-river-facts"><span>Observed close <b>{money(focus.summary?.close)}</b></span><span>Chart date <b>{focus.summary?.observedAt?.slice(0, 10) || "—"}</b></span><span>Source <b>{focus.summary?.source || "Not fetched"}</b></span></div>{focus.summary?.factors.length ? <div className="signal-river-factor-list">{focus.summary.factors.map(factor => <span key={factor.name}><small>{factor.name}</small><b className={factor.contribution > 0 ? "bullish" : factor.contribution < 0 ? "bearish" : "mixed"}>{factor.contribution > 0 ? "+" : ""}{factor.contribution}</b></span>)}</div> : <p className="note">{focus.summary?.error || "Scan this company to calculate a dated state. Unscanned is not neutral."}</p>}<button className="button primary" onClick={() => open(focus.company)}>Open chart and rules <ArrowDownRight size={15} /></button></> : <p className="note">Search or select a company to inspect its path.</p>}<p className="source">Each curve is one holding. Path thickness does not represent order flow or trading volume. <ArrowRight size={12} /></p></aside>
  </div>;
}
