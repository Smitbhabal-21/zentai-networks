"use client";

import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { Company } from "@/lib/companies";
import type { FlowRow } from "./signal-flow-chart";

type Mover = FlowRow & { activity: number; direction: "up" | "down"; rank: number };
const compact = (value: number) => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
const signed = (value: number) => `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;

export function SignalFlowOverview({ rows, onSectorSelect, onSelect }: {
  rows: FlowRow[];
  onSectorSelect: (sector: string) => void;
  onSelect: (company: Company) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [side, setSide] = useState<"both" | "up" | "down">("both");
  const ranked = useMemo(() => {
    const available = rows.filter(row => row.summary?.observedAt && row.summary.close != null && row.summary.volume != null && row.summary.dayReturn != null && row.summary.volume > 0 && row.summary.close > 0);
    const session = available.map(row => row.summary!.observedAt!.slice(0, 10)).sort().at(-1) || null;
    const valid = available.filter(row => row.summary!.observedAt!.slice(0, 10) === session);
    const toMover = (row: FlowRow, direction: "up" | "down", rank: number): Mover => ({ ...row, direction, rank, activity: row.summary!.close! * row.summary!.volume! });
    const byActivity = (a: FlowRow, b: FlowRow) => b.summary!.close! * b.summary!.volume! - a.summary!.close! * a.summary!.volume!;
    const up = valid.filter(row => row.summary!.dayReturn! > 0).sort(byActivity).slice(0, 10).map((row, index) => toMover(row, "up", index + 1));
    const down = valid.filter(row => row.summary!.dayReturn! < 0).sort(byActivity).slice(0, 10).map((row, index) => toMover(row, "down", index + 1));
    return { up, down, eligible: valid.length, session };
  }, [rows]);
  const movers = useMemo(() => [...ranked.up, ...ranked.down], [ranked]);
  const sectors = useMemo(() => [...new Set(rows.map(row => row.company.sector))].sort(), [rows]);
  const sectorStats = useMemo(() => new Map(sectors.map(sector => [sector, {
    total: rows.filter(row => row.company.sector === sector).length,
    up: ranked.up.filter(row => row.company.sector === sector).length,
    down: ranked.down.filter(row => row.company.sector === sector).length,
  }])), [rows, sectors, ranked]);
  const focused = movers.find(row => row.company.ticker === hovered) || movers.find(row => row.company.ticker === pinned) || movers[0];
  const sectorY = (sector: string) => 66 + sectors.indexOf(sector) * 48;
  const moverY = (mover: Mover) => (mover.direction === "up" ? 62 : 376) + (mover.rank - 1) * 27;
  return <div className="signal-pulse-shell">
    <div className="signal-pulse-head"><div><p className="eyebrow">{ranked.session || "NO SESSION YET"} · OBSERVED ACTIVITY</p><h3>Where trading activity is concentrated</h3><p>Sector → active company → rising or falling close. Each ribbon is one ranked company; thickness follows its estimated traded value.</p></div><div className="signal-pulse-metrics"><span><b>{ranked.eligible}</b> with dated volume</span><span className="up"><b>{ranked.up.length}</b> rising leaders</span><span className="down"><b>{ranked.down.length}</b> falling leaders</span></div></div>
    <div className="signal-pulse-tabs" role="group" aria-label="Filter activity flows"><button aria-pressed={side === "both"} onClick={() => setSide("both")}>All flows</button><button aria-pressed={side === "up"} onClick={() => setSide("up")}>Rising activity</button><button aria-pressed={side === "down"} onClick={() => setSide("down")}>Falling activity</button></div>
    <div className="signal-pulse-scroll"><svg className="signal-pulse-svg" viewBox="0 0 1100 690" role="img" aria-label={`Interactive flow from ${sectors.length} sectors through ${movers.length} high-activity companies to rising and falling close groups`}>
      <text x="24" y="28" className="signal-river-label">SECTORS</text><text x="464" y="28" className="signal-river-label">TOP 10 EACH SIDE · BY PRICE × VOLUME</text><text x="915" y="28" className="signal-river-label">SESSION DIRECTION</text>
      <rect x="433" y="41" width="335" height="286" rx="16" className="signal-pulse-zone up"/><rect x="433" y="355" width="335" height="286" rx="16" className="signal-pulse-zone down"/>
      {movers.map(mover => { const y = moverY(mover); const sy = sectorY(mover.company.sector); const active = hovered === mover.company.ticker || (!hovered && focused?.company.ticker === mover.company.ticker); const dim = (side !== "both" && side !== mover.direction) || (hovered !== null && !active); const width = Math.max(1.4, Math.min(7, 1.4 + Math.log10(mover.activity / 1_000_000 + 1) * 1.2)); const hubY = mover.direction === "up" ? 174 : 488; return <g key={mover.company.ticker} className={`signal-pulse-route ${mover.direction} ${dim ? "dimmed" : ""} ${active ? "active" : ""}`}>
        <path d={`M 198 ${sy} C 310 ${sy}, 330 ${y}, 443 ${y}`} strokeWidth={width} className="signal-pulse-link"/><path d={`M 756 ${y} C 836 ${y}, 846 ${hubY}, 914 ${hubY}`} strokeWidth={width} className="signal-pulse-link"/>
        <path d={`M 198 ${sy} C 310 ${sy}, 330 ${y}, 443 ${y}`} className="signal-pulse-motion"/><path d={`M 756 ${y} C 836 ${y}, 846 ${hubY}, 914 ${hubY}`} className="signal-pulse-motion"/>
        <g className="signal-pulse-company" role="button" tabIndex={0} aria-label={`${mover.company.ticker}, ${mover.company.name}, ${signed(mover.summary!.dayReturn!)}, estimated traded value ${compact(mover.activity)} dollars; open evidence`} onMouseEnter={() => setHovered(mover.company.ticker)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(mover.company.ticker)} onBlur={() => setHovered(null)} onClick={() => { setPinned(mover.company.ticker); onSelect(mover.company); }} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setPinned(mover.company.ticker); onSelect(mover.company); } }}><rect x="443" y={y - 11} width="313" height="22" rx="6"/><text x="453" y={y + 4} className="signal-pulse-rank">{String(mover.rank).padStart(2, "0")}</text><text x="481" y={y + 4} className="signal-pulse-symbol">{mover.company.ticker}</text><text x="593" y={y + 4} className="signal-pulse-activity">${compact(mover.activity)}</text><text x="746" y={y + 4} className="signal-pulse-return" textAnchor="end">{signed(mover.summary!.dayReturn!)}</text><title>{mover.company.name} · latest chart {mover.summary?.observedAt?.slice(0, 10) || "date unavailable"} · ${compact(mover.activity)} estimated traded value</title></g>
      </g>; })}
      {sectors.map(sector => { const stats = sectorStats.get(sector)!; const y = sectorY(sector); return <g key={sector} className={`signal-pulse-sector ${focused?.company.sector === sector ? "active" : ""}`} role="button" tabIndex={0} aria-label={`${sector}, ${stats.total} holdings, ${stats.up} rising and ${stats.down} falling leaders; filter sector`} onClick={() => onSectorSelect(sector)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSectorSelect(sector); } }}><rect x="16" y={y - 16} width="184" height="32" rx="8"/><text x="26" y={y + 4}>{sector.length > 20 ? `${sector.slice(0, 19)}…` : sector}</text><text x="190" y={y + 4} textAnchor="end">{stats.up + stats.down}</text><title>{sector}: {stats.total} holdings in universe, {stats.up + stats.down} in displayed leaders. Select to filter.</title></g>; })}
      <g className="signal-pulse-outcome up"><rect x="914" y="119" width="168" height="110" rx="16"/><text x="932" y="154" className="signal-pulse-outcome-name">Rising close</text><text x="932" y="182" className="signal-pulse-outcome-number">{ranked.up.length}</text><text x="932" y="207" className="signal-pulse-outcome-small">ranked leaders</text></g>
      <g className="signal-pulse-outcome down"><rect x="914" y="433" width="168" height="110" rx="16"/><text x="932" y="468" className="signal-pulse-outcome-name">Falling close</text><text x="932" y="496" className="signal-pulse-outcome-number">{ranked.down.length}</text><text x="932" y="521" className="signal-pulse-outcome-small">ranked leaders</text></g>
      {!movers.length && <text x="470" y="345" className="signal-pulse-empty">Scan companies to build dated activity flows</text>}
    </svg></div>
    <div className="signal-pulse-inspect" aria-live="polite">{focused ? <><div><p className="eyebrow">HOVER A COMPANY · SELECT FOR EVIDENCE</p><h4>{focused.company.ticker} <span>{focused.company.name}</span></h4><small>{focused.company.sector} · observed {focused.summary?.observedAt?.slice(0, 10) || "—"} · {focused.summary?.source || "source unavailable"}</small></div><div className={`signal-pulse-inspect-value ${focused.direction}`}><strong>{signed(focused.summary!.dayReturn!)}</strong><span>close vs prior observation</span></div><div><strong>${compact(focused.activity)}</strong><span>price × reported share volume</span></div><button className="button primary" onClick={() => { setPinned(focused.company.ticker); onSelect(focused.company); document.getElementById("signal-detail")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>Open evidence <ArrowRight size={14}/></button></> : <p>Scan companies to populate the flow with dated volume and close observations.</p>}</div>
    <p className="source signal-pulse-source">This is a <strong>trading-activity proxy</strong>, not actual money inflow or outflow: estimated traded value = latest chart close × reported daily share volume. Rising/falling uses the latest close versus the prior observation. The chart compares only companies with data for the same latest chart date and shows the top 10 on each side; it does not imply the whole market was scanned. Quotes and volume may be delayed.</p>
  </div>;
}
