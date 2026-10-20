"use client";

import { useMemo, useState } from "react";
import type { FlowRow } from "./signal-flow-chart";

const states = [
  { key: "Bullish", y: 105 },
  { key: "Mixed", y: 238 },
  { key: "Bearish", y: 371 },
  { key: "Unscanned", y: 504 },
] as const;
type State = typeof states[number]["key"];

export function SignalFlowOverview({ rows, onSectorSelect }: { rows: FlowRow[]; onSectorSelect: (sector: string) => void }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const sectors = useMemo(() => [...new Set(rows.map(row => row.company.sector))].sort(), [rows]);
  const counts = useMemo(() => {
    const result = new Map<string, Record<State, number>>();
    for (const sector of sectors) result.set(sector, { Bullish: 0, Mixed: 0, Bearish: 0, Unscanned: 0 });
    for (const row of rows) result.get(row.company.sector)![row.summary?.state || "Unscanned"]++;
    return result;
  }, [rows, sectors]);
  const focus = hovered && counts.get(hovered);
  return <div className="signal-overview-shell"><div className="signal-river-scroll"><svg className="signal-river signal-overview-svg" viewBox="0 0 960 610" role="img" aria-label={`Sector-level flow of ${rows.length} companies to observed signal states; choose a sector to inspect company paths`}>
    <text x="22" y="24" className="signal-river-label">SECTOR · CLICK TO DRILL DOWN</text><text x="390" y="24" className="signal-river-label">COMPANY COUNTS · AGGREGATED FLOWS</text><text x="775" y="24" className="signal-river-label">CURRENT STATE</text>
    {sectors.flatMap((sector, index) => states.map((state) => {
      const count = counts.get(sector)![state.key];
      if (!count) return null;
      const sourceY = sectors.length === 1 ? 304 : 42 + index * 52;
      const endY = state.y + (index - (sectors.length - 1) / 2) * 5;
      return <path key={`${sector}-${state.key}`} d={`M 188 ${sourceY} C 390 ${sourceY}, 525 ${endY}, 748 ${endY}`} className={`signal-overview-flow ${state.key.toLowerCase()} ${hovered && hovered !== sector ? "dimmed" : ""}`} strokeWidth={Math.min(14, Math.max(2, count / 3))}><title>{sector}: {count} {state.key.toLowerCase()} {count === 1 ? "company" : "companies"}</title></path>;
    }))}
    {sectors.map((sector, index) => { const y = sectors.length === 1 ? 304 : 42 + index * 52; const total = Object.values(counts.get(sector)!).reduce((sum, count) => sum + count, 0); return <g key={sector} className={`signal-river-sector ${hovered === sector ? "selected" : ""}`} role="button" tabIndex={0} aria-label={`Show ${total} company paths in ${sector}`} onMouseEnter={() => setHovered(sector)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(sector)} onBlur={() => setHovered(null)} onClick={() => onSectorSelect(sector)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSectorSelect(sector); } }}><rect x="10" y={y - 18} width="170" height="36" rx="9" /><text x="20" y={y + 4}>{sector.length > 18 ? `${sector.slice(0, 17)}…` : sector}</text><text x="166" y={y + 4} textAnchor="end" className="signal-overview-total">{total}</text></g>; })}
    {states.map(state => { const count = rows.filter(row => (row.summary?.state || "Unscanned") === state.key).length; return <g className={`signal-river-bucket ${state.key.toLowerCase()}`} key={state.key}><rect x="766" y={state.y - 38} width="180" height="76" rx="13" /><text x="782" y={state.y - 4} className="signal-river-bucket-name">{state.key}</text><text x="782" y={state.y + 22} className="signal-river-bucket-count">{count} {count === 1 ? "company" : "companies"}</text></g>; })}
  </svg></div><div className="signal-overview-detail"><strong>{hovered || "Sector overview"}</strong>{focus ? <span>{states.map(state => `${focus[state.key]} ${state.key.toLowerCase()}`).join(" · ")}</span> : <span>Hover or select a sector to see its counts. Select it to inspect individual dated paths.</span>}<small>Line width represents company count only. Unscanned means no computed state.</small></div></div>;
}
