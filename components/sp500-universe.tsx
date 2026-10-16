"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { companyFromHolding, type Company } from "@/lib/companies";
import { signalHistory } from "@/lib/signal-map";
import type { UniverseSnapshot } from "@/lib/ivv-universe";
import type { Quote } from "@/lib/types";
import { useFeed } from "./use-feed";

const money = (value?: number) => value === undefined ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
const PAGE_SIZE = 50;

function CloseChart({ quote }: { quote: Quote }) {
  const points = quote.history.filter(point => Number.isFinite(point.close) && point.close > 0).slice(-65);
  if (points.length < 2) return <p className="source">Historical chart unavailable.</p>;
  const low = Math.min(...points.map(point => point.close));
  const high = Math.max(...points.map(point => point.close));
  const span = high - low || 1;
  const path = points.map((point, index) => `${index ? "L" : "M"}${(index / (points.length - 1) * 600).toFixed(1)},${(150 - (point.close - low) / span * 136).toFixed(1)}`).join(" ");
  return <div className="universe-chart" role="img" aria-label={`${quote.symbol} daily chart closes from ${points[0].date.slice(0, 10)} to ${points.at(-1)!.date.slice(0, 10)}, low ${money(low)}, high ${money(high)}`}><svg viewBox="0 0 600 164" preserveAspectRatio="none" aria-hidden="true"><path d={path} fill="none" stroke="var(--positive)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" /></svg><div><span>{points[0].date.slice(0, 10)}</span><span>Daily closes · {money(low)}–{money(high)}</span><span>{points.at(-1)!.date.slice(0, 10)}</span></div></div>;
}

export function Sp500Universe({ onOpen }: { onOpen: (company: Company, destination: "financials" | "analyst" | "signals" | "risk") => void }) {
  const feed = useFeed<UniverseSnapshot>("/api/universe", 3600000);
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("All sectors");
  const [page, setPage] = useState(0);
  const [selectedTicker, setSelectedTicker] = useState("");
  const sectors = useMemo(() => ["All sectors", ...new Set(feed.data?.holdings.map(item => item.sector) || [])].sort((a, b) => a === "All sectors" ? -1 : b === "All sectors" ? 1 : a.localeCompare(b)), [feed.data]);
  const matches = useMemo(() => (feed.data?.holdings || []).filter(item => (sector === "All sectors" || item.sector === sector) && `${item.ticker} ${item.name}`.toLowerCase().includes(query.trim().toLowerCase())), [feed.data, sector, query]);
  const visible = matches.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const selected = feed.data?.holdings.find(item => item.ticker === selectedTicker);
  const quoteFeed = useFeed<{ quote: Quote }>(selected ? `/api/universe/quote?symbol=${encodeURIComponent(selected.ticker)}` : null, 60000);
  const quote = quoteFeed.data?.quote;
  const signal = quote ? signalHistory(quote.history).at(-1) : null;
  return <div className="universe stack">
    <section className="panel universe-intro"><div><p className="eyebrow">BROAD MARKET UNIVERSE</p><h2>Search the S&amp;P 500 landscape</h2><p>Browse an IVV holdings proxy in one compact file. Search and filter locally; only the company you open requests a current chart. This keeps the 500-stock view responsive.</p></div><div className="universe-count"><strong>{feed.data?.holdings.length ?? "—"}</strong><span>equity lines available</span></div><p className="source">Holdings and displayed table prices: <a href={feed.data?.source || "https://www.ishares.com/us/products/239726/ishares-core-s-p-500-etf"} target="_blank" rel="noopener noreferrer">iShares Core S&amp;P 500 ETF ↗</a>, as of {feed.data?.asOf || "loading"}{feed.data?.fallback ? " · saved snapshot because the live holdings file was unavailable" : ""}. ETF holdings closely track the index but are not the official S&amp;P constituent list. Share classes can make the line count exceed 500. Table prices are dated holdings values, not live quotes.</p></section>
    <section className="panel"><div className="panel-heading"><div><p className="eyebrow">FIND A COMPANY</p><h2>Universe screener</h2></div><button className="button" onClick={feed.refresh} disabled={feed.loading}>Refresh holdings</button></div>
      <div className="universe-controls"><label><Search size={16} /><input type="search" value={query} placeholder="Search ticker or company" onChange={event => { setQuery(event.target.value); setPage(0); }} aria-label="Search ticker or company" /></label><select value={sector} onChange={event => { setSector(event.target.value); setPage(0); }} aria-label="Filter by sector">{sectors.map(item => <option key={item}>{item}</option>)}</select></div>
      {feed.loading && !feed.data && <p className="note">Loading the holdings universe…</p>}
      {feed.error && <p className="notice error" role="alert">{feed.error} <button onClick={feed.refresh}>Retry</button></p>}
      {feed.data && <><p className="source">{matches.length} matching equity lines · sorted by IVV portfolio weight · showing {matches.length ? page * PAGE_SIZE + 1 : 0}–{Math.min((page + 1) * PAGE_SIZE, matches.length)}</p><div className="universe-table-wrap"><table className="universe-table"><thead><tr><th>Company</th><th>Sector</th><th>IVV weight</th><th>Holdings price</th></tr></thead><tbody>{visible.map(item => <tr key={item.ticker} className={item.ticker === selectedTicker ? "active" : ""}><td><button onClick={() => setSelectedTicker(item.ticker)} aria-label={`Inspect ${item.name}, ${item.ticker}`}><strong>{item.ticker}</strong><span>{item.name}</span><ArrowRight size={13} /></button></td><td>{item.sector}</td><td>{item.weight.toFixed(2)}%</td><td>{money(item.price)}</td></tr>)}</tbody></table></div>{!matches.length && <p className="note">No holdings match that search.</p>}<div className="universe-pagination"><button className="button" disabled={page === 0} onClick={() => setPage(value => value - 1)}>Previous</button><span>Page {page + 1} of {Math.max(1, Math.ceil(matches.length / PAGE_SIZE))}</span><button className="button" disabled={(page + 1) * PAGE_SIZE >= matches.length} onClick={() => setPage(value => value + 1)}>Next</button></div></>}
    </section>
    {selected && <section className="panel universe-detail"><div className="panel-heading"><div><p className="eyebrow">ON-DEMAND CHART &amp; SIGNAL</p><h2>{selected.name} · {selected.ticker}</h2></div></div><div className="universe-actions">{([ ["financials", "Research"], ["analyst", "Analyst report"], ["signals", "Signal map"], ["risk", "Risk intelligence"] ] as const).map(([destination, label]) => <button key={destination} className="button" onClick={() => onOpen(companyFromHolding(selected), destination)}>{label} <ArrowRight size={14} /></button>)}</div><p className="source">IVV weight {selected.weight.toFixed(2)}% · {selected.sector} · holdings price {money(selected.price)} as of {feed.data?.asOf}. Research is requested only when opened; unavailable provider facts remain explicitly marked.</p>
      {quoteFeed.loading && !quote && <p className="note">Fetching this company’s chart…</p>}{quoteFeed.error && <p className="notice error" role="alert">{quoteFeed.error} <button onClick={quoteFeed.refresh}>Retry</button></p>}
      {quote && <><div className="universe-detail-kpis"><div><span>Latest quote</span><strong>{money(quote.price)}</strong><small>{quote.source} · {new Date(quote.asOf).toLocaleString()}</small></div><div><span>Model state</span><strong className={signal?.state.toLowerCase()}>{signal ? `${signal.state} ${signal.score > 0 ? "+" : ""}${signal.score}/5` : "Insufficient history"}</strong><small>Latest daily chart observation {signal?.date.slice(0, 10) || "unavailable"}</small></div></div><CloseChart quote={quote} />{signal && <div className="universe-factors">{signal.factors.map(factor => <div key={factor.name}><span>{factor.name}</span><strong>{factor.contribution > 0 ? "+" : ""}{factor.contribution}</strong><small>{factor.reading} · {factor.rule}</small></div>)}</div>}<p className="source">Source: {quote.source} chart, fetched {new Date(quote.fetchedAt).toLocaleString()}. {quote.feedLabel}. <a href={`https://finance.yahoo.com/quote/${encodeURIComponent(selected.ticker)}/history/`} target="_blank" rel="noopener noreferrer">View dated source history ↗</a>. The model uses daily chart closes and volume, not IVV holdings prices; it describes observed conditions and does not predict returns.</p></>}
    </section>}
  </div>;
}
