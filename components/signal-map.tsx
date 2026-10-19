"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, Clock3, ExternalLink, Maximize2, Minimize2, Search } from "lucide-react";
import { companies, companyFromHolding, type Company } from "@/lib/companies";
import type { MarketResponse, NewsResponse, Quote } from "@/lib/types";
import type { UniverseSnapshot } from "@/lib/ivv-universe";
import { signalHistory, signalTransitions, type SignalFactor } from "@/lib/signal-map";
import { headlinePriority } from "@/lib/news-priority";
import { useFeed } from "./use-feed";
import { AverageObservationEvidence } from "./observation-evidence";
import { SignalFlowChart } from "./signal-flow-chart";
import { VolumeLeaders } from "./volume-leaders";

const date = (value?: string) => value ? new Date(value).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "Unavailable";
const day = (value?: string) => value ? new Date(value).toLocaleDateString("en-US", { dateStyle: "medium" }) : "Unavailable";
const cash = (value?: number) => value === undefined ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);

type SignalSummary = { symbol: string; score: number | null; state: "Bullish" | "Mixed" | "Bearish" | null; close: number | null; observedAt: string | null; quoteAsOf: string | null; source: string | null; volume: number | null; relativeVolume: number | null; dayReturn: number | null; factors: SignalFactor[]; error: string | null };
const summaryFromQuote = (quote: Quote): SignalSummary => {
  const signal = signalHistory(quote.history).at(-1);
  const volume = quote.history.findLast(point => point.date === signal?.date)?.volume ?? null;
  return { symbol: quote.symbol, score: signal?.score ?? null, state: signal?.state ?? null, close: signal?.close ?? null,
    observedAt: signal?.date ?? null, quoteAsOf: quote.asOf, source: quote.source,
    volume, relativeVolume: signal?.relativeVolume ?? null, dayReturn: signal?.dayReturn ?? null, factors: signal?.factors ?? [],
    error: signal ? null : "Fewer than 30 valid observations." };
};
const signalTitle = (item: Company, signal?: SignalSummary) => signal?.state
  ? `${item.name} · ${signal.state} ${signal.score! > 0 ? "+" : ""}${signal.score}/5\nObserved ${signal.observedAt?.slice(0, 10)} · ${signal.source}\n${signal.factors.map(factor => `${factor.name}: ${factor.contribution > 0 ? "+" : ""}${factor.contribution} (${factor.reading})`).join("\n")}\nOpen for rule thresholds and history.`
  : `${item.name} · ${signal?.error || "Not scanned yet"}. Open to calculate its signal from dated chart observations.`;

export function SignalMap({ market, universe, company, selectedQuote, auto, onSelect, onOptions }: {
  market: { data: MarketResponse | null; loading: boolean; error: string | null; refresh: () => void };
  universe: UniverseSnapshot | null;
  company: Company;
  selectedQuote?: Quote;
  auto: boolean;
  onSelect: (company: Company) => void;
  onOptions: () => void;
}) {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("All sectors");
  const [showLanes, setShowLanes] = useState(false);
  const [focusMode, setFocusMode] = useState(true);
  const [scanned, setScanned] = useState<Record<string, SignalSummary>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const saved = JSON.parse(sessionStorage.getItem("zentai-signal-scan") || "null");
      return saved && Date.now() - saved.savedAt < 300000 && saved.results && typeof saved.results === "object" ? saved.results : {};
    } catch { return {}; }
  });
  const [scanActive, setScanActive] = useState(false);
  const [scanProgress, setScanProgress] = useState({ done: 0, total: 0 });
  const [scanError, setScanError] = useState<string | null>(null);
  const scanControl = useRef<AbortController | null>(null);
  useEffect(() => () => scanControl.current?.abort(), []);
  useEffect(() => {
    try { sessionStorage.setItem("zentai-signal-scan", JSON.stringify({ savedAt: Date.now(), results: scanned })); } catch {}
  }, [scanned]);
  const holdings = useMemo(() => {
    const items: Company[] = universe?.holdings.map(companyFromHolding) || [...companies];
    if (!items.some(item => item.ticker === company.ticker)) items.unshift(company);
    return items;
  }, [universe, company]);
  const quoteMap = useMemo(() => new Map((market.data?.quotes || []).map(quote => [quote.symbol, quote])), [market.data]);
  const rows = useMemo(() => holdings.map(item => {
    const quote = item.ticker === company.ticker && selectedQuote ? selectedQuote : quoteMap.get(item.ticker);
    return { company: item, summary: quote ? summaryFromQuote(quote) : scanned[item.ticker] };
  }), [holdings, company, selectedQuote, quoteMap, scanned]);
  const selectedQuoteValue = selectedQuote || quoteMap.get(company.ticker);
  const selectedTimeline = selectedQuoteValue ? signalHistory(selectedQuoteValue.history) : [];
  const selected = { quote: selectedQuoteValue, timeline: selectedTimeline, signal: selectedTimeline.at(-1) };
  const filteredRows = rows.filter(row => (sector === "All sectors" || row.company.sector === sector) && `${row.company.ticker} ${row.company.name}`.toLowerCase().includes(query.trim().toLowerCase()));
  const sectors = [...new Set(rows.map(row => row.company.sector))].sort();
  const groups = sectors.filter(name => sector === "All sectors" || name === sector).map(name => ({ name, rows: filteredRows.filter(row => row.company.sector === name) })).filter(group => group.rows.length);
  const counts = { bullish: rows.filter(row => row.summary?.state === "Bullish").length, bearish: rows.filter(row => row.summary?.state === "Bearish").length, mixed: rows.filter(row => row.summary?.state === "Mixed").length };
  const pending = rows.length - counts.bullish - counts.mixed - counts.bearish;
  const scan = async () => {
    const targets = filteredRows.filter(row => !row.summary?.state).map(row => row.company.ticker);
    if (!targets.length) return;
    const controller = new AbortController();
    scanControl.current = controller;
    setScanActive(true);
    setScanError(null);
    setScanProgress({ done: 0, total: targets.length });
    try {
      for (let index = 0; index < targets.length; index += 8) {
        const batch = targets.slice(index, index + 8);
        const response = await fetch(`/api/signals?symbols=${batch.join(",")}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Signal provider could not complete this batch. You can retry the remaining names.");
        const data: { results: SignalSummary[] } = await response.json();
        if (controller.signal.aborted) break;
        setScanned(current => ({ ...current, ...Object.fromEntries(data.results.map(result => [result.symbol, result])) }));
        setScanProgress({ done: Math.min(index + batch.length, targets.length), total: targets.length });
      }
    } catch (error) {
      if (!controller.signal.aborted) setScanError(error instanceof Error ? error.message : "Signal scan stopped.");
    } finally {
      if (scanControl.current === controller) scanControl.current = null;
      setScanActive(false);
    }
  };
  const news = useFeed<NewsResponse>(`/api/news?symbol=${company.ticker}`, 180000, auto);
  const transitions = signalTransitions(selected.timeline);
  const chart = selected.timeline.map(item => ({ ...item, day: item.date.slice(0, 10) }));
  return <div className={`signal-map stack ${focusMode ? "focus-mode" : ""}`}>
    {!focusMode && <section className="panel signal-intro">
      <div><p className="eyebrow">SECTOR → COMPANY → OBSERVED SIGNAL → EVIDENCE</p><h1 id="page-title" tabIndex={-1}>Signal map</h1><p>Explore the full IVV holdings universe in one view. Hover a company path for its dated signal, then open it for the five rules, historical chart, and source evidence.</p></div>
      <div className="signal-summary"><div><strong>{counts.bullish}</strong><span>Bullish</span></div><div><strong>{counts.mixed}</strong><span>Mixed</span></div><div><strong>{counts.bearish}</strong><span>Bearish</span></div><div><strong>{pending}</strong><span>Unscanned</span></div></div>
      <p className="source"><Clock3 size={12} /> {rows.length} equity lines · IVV holdings as of {universe?.asOf || "loading"}. Scores use dated Yahoo Finance chart observations, not the holdings price. {market.error ? `Featured quote refresh failed: ${market.error}` : "Quotes may be delayed."}</p>
    </section>}
    <section className="panel signal-universe"><div className="panel-heading signal-map-heading"><div><p className="eyebrow">SIDEWAYS UNIVERSE FLOW · IVV HOLDINGS</p>{focusMode ? <h1 id="page-title" tabIndex={-1}>Signal map · {filteredRows.length} companies</h1> : <h2>Sector lanes · {filteredRows.length} {filteredRows.length === 1 ? "company" : "companies"}</h2>}</div><div className="signal-map-heading-actions"><button className="button signal-view-toggle" onClick={() => setFocusMode(value => !value)}>{focusMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}{focusMode ? "Show navigation" : "Full-page map"}</button><button className="button" onClick={() => { market.refresh(); setScanned({}); }} disabled={scanActive || market.loading}>Refresh signals</button></div></div>
      {focusMode && <p className="signal-map-coverage">{rows.length} holdings · {sectors.length} sectors · {rows.length - pending} scored from dated charts · {pending} not yet scanned · IVV snapshot {universe?.asOf || "loading"} · public quotes may be delayed</p>}
      <div className="signal-map-controls"><label><Search size={15} /><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Find ticker or company" aria-label="Search signal map" /></label><select value={sector} onChange={event => setSector(event.target.value)} aria-label="Filter signal map by sector"><option>All sectors</option>{sectors.map(name => <option key={name}>{name}</option>)}</select><button className="button primary" onClick={scan} disabled={scanActive || !filteredRows.some(row => !row.summary?.state)}>Scan {sector === "All sectors" ? "remaining companies" : sector}</button>{scanActive && <button className="button" onClick={() => scanControl.current?.abort()}>Stop scan</button>}</div>
      {scanProgress.total > 0 && <div className="signal-scan-progress" role="status"><span>{scanActive ? "Scanning" : "Last scan"}: {scanProgress.done} / {scanProgress.total}</span><progress value={scanProgress.done} max={scanProgress.total} /></div>}
      {scanError && <p className="notice error" role="alert">{scanError}</p>}
      <div className="signal-flow" aria-label="Research workflow"><span>{sectors.length} sectors</span><ArrowRight size={15} /><span>{rows.length} companies</span><ArrowRight size={15} /><span>5 dated rules per scanned name</span><ArrowRight size={15} /><span>Open evidence below</span></div>
      <div className="signal-flow-legend"><span className="bullish">● Bullish</span><span className="mixed">● Mixed</span><span className="bearish">● Bearish</span><span>○ Not yet scanned</span><small>Hover curves to inspect · scroll lanes sideways →</small></div>
      <SignalFlowChart rows={filteredRows} selectedTicker={company.ticker} onSelect={onSelect} onSectorSelect={setSector} />
      <VolumeLeaders rows={filteredRows} universeCount={rows.length} selectedTicker={company.ticker} onSelect={onSelect} />
      <div className="signal-lane-heading"><div><h3>Company lanes</h3><p>Browse the individual company cards when you need a ticker-by-ticker view.</p></div><button className="button" aria-expanded={showLanes} onClick={() => setShowLanes(value => !value)}>{showLanes ? "Hide company lanes" : `Show ${filteredRows.length} company lanes`}</button></div>
      {showLanes && <div className="signal-flow-board">{groups.map(group => <div className="signal-sector-lane" key={group.name}><div className="signal-sector-name"><strong>{group.name}</strong><span>{group.rows.length} names</span></div><div className="signal-lane-track">{group.rows.map(row => <button key={row.company.ticker} className={`signal-node ${row.summary?.state?.toLowerCase() || "pending"} ${row.company.ticker === company.ticker ? "active" : ""}`} onClick={() => onSelect(row.company)} aria-pressed={row.company.ticker === company.ticker} aria-label={`${row.company.ticker}, ${row.company.name}: ${row.summary?.state ? `${row.summary.state}, score ${row.summary.score} of 5` : row.summary?.error || "not scanned"}`} title={signalTitle(row.company, row.summary)}><span className="signal-node-head"><b>{row.company.ticker}</b><em>{row.summary?.score == null ? "○" : `${row.summary.score > 0 ? "+" : ""}${row.summary.score}`}</em></span><span className="signal-node-name">{row.company.name}</span><small>{row.summary?.state || (row.summary?.error ? "Unavailable" : "Open to scan")}</small></button>)}</div><div className="signal-lane-end"><strong>{group.rows.filter(row => row.summary?.state).length}/{group.rows.length}</strong><span>scanned</span><small><i className="bullish">{group.rows.filter(row => row.summary?.state === "Bullish").length} ↑</i> <i className="bearish">{group.rows.filter(row => row.summary?.state === "Bearish").length} ↓</i></small></div></div>)}</div>}
      {!groups.length && <p className="note">No company matches this search.</p>}
      <p className="source">Each lane is ordered by IVV portfolio weight. Grey cards have no computed state; an unavailable chart never becomes a neutral signal. Scanning requests at most eight company histories per batch and may take time for the full universe. Scores range from −5 to +5: +2 or above bullish, −2 or below bearish, otherwise mixed. Hover a scored card for its dated inputs, then open it for rule thresholds.</p>
    </section>
    <section className="panel" id="signal-detail"><div className="panel-heading"><div><p className="eyebrow">COMPANY DRILLDOWN</p><h2>{company.name} · {company.ticker}</h2></div><button className="button" onClick={onOptions}>Build option plan <ArrowRight size={14} /></button></div>
      {selected.signal ? <><div className="signal-detail-header"><div className={`signal-state ${selected.signal.state.toLowerCase()}`}><span>Current model state</span><strong>{selected.signal.state}</strong><small>{selected.signal.score > 0 ? "+" : ""}{selected.signal.score} / 5</small></div><div><span>Latest daily chart point</span><strong>{cash(selected.signal.close)}</strong><small>{day(selected.signal.date)} · quote observed {date(selected.quote?.asOf)} · {selected.quote?.feedLabel}</small></div><div><span>20-observation move</span><strong>{selected.signal.return20 > 0 ? "+" : ""}{selected.signal.return20.toFixed(1)}%</strong><small>Chart point versus 20 observations earlier</small></div><div><span>Recent state changes</span><strong>{transitions.length}</strong><small>Up to eight most recent changes shown</small></div></div>
        <div className="signal-chart" role="img" aria-label={`${company.ticker} observed close, 10 and 30 observation moving averages, and model state changes`}><ResponsiveContainer width="100%" height="100%"><LineChart data={chart} margin={{ top: 15, right: 25, left: 3, bottom: 8 }}><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 5" /><XAxis dataKey="day" minTickGap={55} tick={{ fill: "var(--muted)", fontSize: 11 }} tickFormatter={value => new Date(`${value}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric" })} /><YAxis orientation="right" domain={["auto", "auto"]} width={58} tick={{ fill: "var(--muted)", fontSize: 11 }} tickFormatter={value => `$${Number(value).toFixed(0)}`} /><Tooltip contentStyle={{ background: "var(--panel)", border: "1px solid var(--border)", color: "var(--text)" }} labelFormatter={value => String(value)} formatter={(value, name) => [cash(Number(value)), String(name)]} /><Line name="Observed close" dataKey="close" type="monotone" stroke="var(--accent)" strokeWidth={3} dot={false} isAnimationActive={false} /><Line name="10 observations" dataKey="average10" type="monotone" stroke="var(--positive)" strokeWidth={1.6} strokeDasharray="4 3" dot={false} isAnimationActive={false} /><Line name="30 observations" dataKey="average30" type="monotone" stroke="var(--purple)" strokeWidth={1.6} strokeDasharray="3 4" dot={false} isAnimationActive={false} />{transitions.map(item => <ReferenceDot key={item.date} x={item.date.slice(0, 10)} y={item.close} r={5} fill={item.state === "Bullish" ? "var(--positive)" : item.state === "Bearish" ? "var(--red)" : "var(--warning)"} stroke="var(--panel)" strokeWidth={2} />)}<ReferenceLine y={selected.signal.close} stroke="var(--border)" strokeDasharray="3 5" /></LineChart></ResponsiveContainer></div>
        <div className="signal-chart-key"><span><i /> Observed close</span><span><i /> 10-observation average</span><span><i /> 30-observation average</span><small>Colored dots mark changes in the model bucket; they are not trade entries or exits.</small></div>
        {selected.quote && <AverageObservationEvidence quote={selected.quote} />}
        <div className="signal-detail-grid"><div><h3>How the model reached this state</h3><p>Each rule adds +1, −1, or 0. Expand a factor to see its threshold and current inputs.</p><div className="signal-factors">{selected.signal.factors.map(factor => <details key={factor.name}><summary><span>{factor.name}</span><strong className={factor.contribution > 0 ? "bullish" : factor.contribution < 0 ? "bearish" : "mixed"}>{factor.contribution > 0 ? "+" : ""}{factor.contribution}</strong></summary><p><b>Observed:</b> {factor.reading}<br /><b>Rule:</b> {factor.rule}</p></details>)}</div></div><div><h3>State-change history</h3><p>The screen recalculates from observations available at each chart point. A transition is a model change, not a validated trade.</p><div className="signal-transitions">{transitions.length ? transitions.slice(-5).reverse().map(item => <div key={item.date}><span className={item.state.toLowerCase()}>{item.state}</span><strong>{item.date.slice(0, 10)}</strong><small>{cash(item.close)} · score {item.score > 0 ? "+" : ""}{item.score}</small></div>) : <p>No bucket change in this window.</p>}</div></div></div>
      </> : <p className="note">{selected.quote ? `At least 30 valid price observations are required. The provider has not returned enough for ${company.ticker}.` : `Fetching dated price history for ${company.ticker}… If it remains unavailable, retry after the provider responds.`}</p>}
      <p className="source">This screen uses closes and reported volume, not order-book depth, option positioning, or hidden institutional orders. It does not estimate a probability of profit. Open the options lab to study a separate expiration payoff.</p>
    </section>
    <section className="panel"><div className="panel-heading"><div><p className="eyebrow">SOURCE CONTEXT</p><h2>Recent headlines for {company.ticker}</h2></div></div>
      {news.error && <p className="notice error" role="alert">{news.error}</p>}
      {news.loading && !news.data && <p className="loading">Loading recent headlines…</p>}
      {news.data && <div className="signal-headlines">{news.data.articles.slice(0, 5).map(article => <a key={article.id} href={article.url} target="_blank" rel="noopener noreferrer" className={headlinePriority(article.title) ? "important" : ""}><div><span>{article.publisher} · {date(article.publishedAt)}</span><strong>{article.title}</strong>{headlinePriority(article.title) && <small>Potentially important: {headlinePriority(article.title)}</small>}</div><ExternalLink size={15} /></a>)}</div>}
      {news.data && !news.data.articles.length && <p className="note">No recent timestamped headlines available.</p>}
      <p className="source">Headlines are limited to the recent feed and shown for context. Timing does not establish that a headline caused a price or model change. Verify the linked article before drawing a conclusion.</p>
    </section>
  </div>;
}
