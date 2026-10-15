"use client";

import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, Clock3, ExternalLink } from "lucide-react";
import { companies, type Company } from "@/lib/companies";
import type { MarketResponse, NewsResponse, Quote } from "@/lib/types";
import { signalHistory, signalTransitions } from "@/lib/signal-map";
import { headlinePriority } from "@/lib/news-priority";
import { useFeed } from "./use-feed";
import { AverageObservationEvidence } from "./observation-evidence";

const date = (value?: string) => value ? new Date(value).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "Unavailable";
const day = (value?: string) => value ? new Date(value).toLocaleDateString("en-US", { dateStyle: "medium" }) : "Unavailable";
const cash = (value?: number) => value === undefined ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);

export function SignalMap({ market, company, auto, onSelect, onOptions }: {
  market: { data: MarketResponse | null; loading: boolean; error: string | null; refresh: () => void };
  company: Company;
  auto: boolean;
  onSelect: (company: Company) => void;
  onOptions: () => void;
}) {
  const rows = useMemo(() => companies.map(item => {
    const quote = market.data?.quotes.find(value => value.symbol === item.ticker);
    const timeline = quote ? signalHistory(quote.history) : [];
    return { company: item, quote, timeline, signal: timeline.at(-1) };
  }).sort((a, b) => (b.signal?.score ?? -99) - (a.signal?.score ?? -99)), [market.data]);
  const selected = rows.find(row => row.company.key === company.key)!;
  const counts = { bullish: rows.filter(row => row.signal?.state === "Bullish").length, bearish: rows.filter(row => row.signal?.state === "Bearish").length, mixed: rows.filter(row => row.signal?.state === "Mixed").length };
  const news = useFeed<NewsResponse>(`/api/news?symbol=${company.ticker}`, 180000, auto);
  const transitions = signalTransitions(selected.timeline);
  const chart = selected.timeline.map(item => ({ ...item, day: item.date.slice(0, 10) }));
  return <div className="signal-map stack">
    <section className="panel signal-intro">
      <div><p className="eyebrow">OBSERVED DATA → EXPLAINABLE MODEL → SOURCE CONTEXT</p><h2>Follow the market, then inspect the evidence</h2><p>Each company moves between bullish, mixed, and bearish buckets as its observed close, trend, and volume change. Select a name to see the exact five rules behind its current score.</p></div>
      <div className="signal-summary"><div><strong>{counts.bullish}</strong><span>Bullish</span></div><div><strong>{counts.mixed}</strong><span>Mixed</span></div><div><strong>{counts.bearish}</strong><span>Bearish</span></div></div>
      <p className="source"><Clock3 size={12} /> Public Yahoo Finance chart observations · feed fetched {date(market.data?.fetchedAt)}. The newest observation can be incomplete during market hours. {market.error ? `Latest refresh failed: ${market.error}` : "Quotes may be delayed."}</p>
    </section>
    <section className="panel"><div className="panel-heading"><div><p className="eyebrow">UNIVERSE SCAN</p><h2>Relative signal map</h2></div><button className="button" onClick={market.refresh} disabled={market.loading}>Refresh scan</button></div>
      <div className="signal-flow" aria-label="Research workflow"><span>10 supported stocks</span><ArrowRight size={15} /><span>5 visible rules</span><ArrowRight size={15} /><span>Rank and inspect</span></div>
      <div className="signal-scale"><span>BEARISH −5</span><span>MIXED 0</span><span>BULLISH +5</span></div>
      <div className="signal-list">{rows.map(row => <button key={row.company.ticker} className={`signal-row ${row.company.ticker === company.ticker ? "active" : ""}`} onClick={() => onSelect(row.company)} aria-pressed={row.company.ticker === company.ticker} title={row.signal ? `${row.company.name}: ${row.signal.score > 0 ? "+" : ""}${row.signal.score}/5. Open to inspect every rule.` : `${row.company.name}: insufficient price history`}>
        <span className="signal-identity"><i style={{ background: row.company.color }} /><strong>{row.company.ticker}</strong><small>{row.company.name}</small></span>
        <span className="signal-track"><span className="signal-midline" /><span className={`signal-marker ${row.signal?.state.toLowerCase() || "missing"}`} style={{ left: `${50 + (row.signal?.score ?? 0) * 9}%` }} /></span>
        <span className={`signal-score ${row.signal?.state.toLowerCase() || "missing"}`}>{row.signal ? `${row.signal.score > 0 ? "+" : ""}${row.signal.score} · ${row.signal.state}` : "Data missing"}</span>
      </button>)}</div>
      <p className="source">Scores range from −5 to +5. Bullish requires +2 or more; bearish requires −2 or less; all others are mixed. This is a descriptive screen, not an order-block or options-flow signal. Missing histories are unranked.</p>
    </section>
    <section className="panel"><div className="panel-heading"><div><p className="eyebrow">COMPANY DRILLDOWN</p><h2>{company.name} · {company.ticker}</h2></div><button className="button" onClick={onOptions}>Build option plan <ArrowRight size={14} /></button></div>
      {selected.signal ? <><div className="signal-detail-header"><div className={`signal-state ${selected.signal.state.toLowerCase()}`}><span>Current model state</span><strong>{selected.signal.state}</strong><small>{selected.signal.score > 0 ? "+" : ""}{selected.signal.score} / 5</small></div><div><span>Latest daily chart point</span><strong>{cash(selected.signal.close)}</strong><small>{day(selected.signal.date)} · quote observed {date(selected.quote?.asOf)} · {selected.quote?.feedLabel}</small></div><div><span>20-observation move</span><strong>{selected.signal.return20 > 0 ? "+" : ""}{selected.signal.return20.toFixed(1)}%</strong><small>Chart point versus 20 observations earlier</small></div><div><span>Recent state changes</span><strong>{transitions.length}</strong><small>Up to eight most recent changes shown</small></div></div>
        <div className="signal-chart" role="img" aria-label={`${company.ticker} observed close, 10 and 30 observation moving averages, and model state changes`}><ResponsiveContainer width="100%" height="100%"><LineChart data={chart} margin={{ top: 15, right: 25, left: 3, bottom: 8 }}><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 5" /><XAxis dataKey="day" minTickGap={55} tick={{ fill: "var(--muted)", fontSize: 11 }} tickFormatter={value => new Date(`${value}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric" })} /><YAxis orientation="right" domain={["auto", "auto"]} width={58} tick={{ fill: "var(--muted)", fontSize: 11 }} tickFormatter={value => `$${Number(value).toFixed(0)}`} /><Tooltip contentStyle={{ background: "var(--panel)", border: "1px solid var(--border)", color: "var(--text)" }} labelFormatter={value => String(value)} formatter={(value, name) => [cash(Number(value)), String(name)]} /><Line name="Observed close" dataKey="close" type="monotone" stroke="var(--accent)" strokeWidth={3} dot={false} isAnimationActive={false} /><Line name="10 observations" dataKey="average10" type="monotone" stroke="var(--positive)" strokeWidth={1.6} strokeDasharray="4 3" dot={false} isAnimationActive={false} /><Line name="30 observations" dataKey="average30" type="monotone" stroke="var(--purple)" strokeWidth={1.6} strokeDasharray="3 4" dot={false} isAnimationActive={false} />{transitions.map(item => <ReferenceDot key={item.date} x={item.date.slice(0, 10)} y={item.close} r={5} fill={item.state === "Bullish" ? "var(--positive)" : item.state === "Bearish" ? "var(--red)" : "var(--warning)"} stroke="var(--panel)" strokeWidth={2} />)}<ReferenceLine y={selected.signal.close} stroke="var(--border)" strokeDasharray="3 5" /></LineChart></ResponsiveContainer></div>
        <div className="signal-chart-key"><span><i /> Observed close</span><span><i /> 10-observation average</span><span><i /> 30-observation average</span><small>Colored dots mark changes in the model bucket; they are not trade entries or exits.</small></div>
        {selected.quote && <AverageObservationEvidence quote={selected.quote} />}
        <div className="signal-detail-grid"><div><h3>How the model reached this state</h3><p>Each rule adds +1, −1, or 0. Expand a factor to see its threshold and current inputs.</p><div className="signal-factors">{selected.signal.factors.map(factor => <details key={factor.name}><summary><span>{factor.name}</span><strong className={factor.contribution > 0 ? "bullish" : factor.contribution < 0 ? "bearish" : "mixed"}>{factor.contribution > 0 ? "+" : ""}{factor.contribution}</strong></summary><p><b>Observed:</b> {factor.reading}<br /><b>Rule:</b> {factor.rule}</p></details>)}</div></div><div><h3>State-change history</h3><p>The screen recalculates from observations available at each chart point. A transition is a model change, not a validated trade.</p><div className="signal-transitions">{transitions.length ? transitions.slice(-5).reverse().map(item => <div key={item.date}><span className={item.state.toLowerCase()}>{item.state}</span><strong>{item.date.slice(0, 10)}</strong><small>{cash(item.close)} · score {item.score > 0 ? "+" : ""}{item.score}</small></div>) : <p>No bucket change in this window.</p>}</div></div></div>
      </> : <p className="note">At least 30 valid price observations are required for this screen. The provider has not returned enough data for {company.ticker}.</p>}
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
