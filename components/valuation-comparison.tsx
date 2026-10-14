"use client";

import { useEffect, useMemo, useState } from "react";
import type { Range } from "@/lib/companies";
import type { AnalystSnapshot, MarketResponse, NewsResponse, Quote } from "@/lib/types";
import { buildMultipleBasis, marketMultiples, multipleValues, type MultipleInputs, type MultipleKey } from "@/lib/valuation-models";
import { matchFilingsToHistory, matchNewsToHistory, summarizeHistory } from "@/lib/chart-context";
import { headlinePriority } from "@/lib/news-priority";
import { useFeed } from "./use-feed";
import { ValuationHistoryChart } from "./charts";

const money = (value: number | null | undefined) => value == null || !Number.isFinite(value) ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
const ratio = (value: number | null | undefined) => value == null || !Number.isFinite(value) ? "—" : `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value)}×`;
const signedPercent = (value: number) => `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
const shortDate = (value: string) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" });
const keys: MultipleKey[] = ["pe", "evEbitda", "ps"];
const details: Record<MultipleKey, { name: string; formula: string; driver: string }> = {
  pe: { name: "P/E", formula: "Target P/E × trailing four-quarter net income ÷ shares", driver: "Net income" },
  evEbitda: { name: "EV/EBITDA", formula: "(Target EV/EBITDA × trailing four-quarter EBITDA − net debt) ÷ shares", driver: "EBITDA + net debt" },
  ps: { name: "P/S", formula: "Target P/S × trailing four-quarter revenue ÷ shares", driver: "Revenue" },
};
const colors: Record<string, string> = { DCF: "var(--purple)", "P/E": "var(--positive)", "EV/EBITDA": "var(--warning)", "P/S": "var(--muted)" };

export function ValuationComparison({ report, quote, news, dcfValue, auto }: { report: AnalystSnapshot; quote?: Quote; news: NewsResponse | null; dcfValue: number | null; auto: boolean }) {
  const basis = useMemo(() => buildMultipleBasis(report), [report]);
  const financials = report.industry === "Financials";
  const anchors = marketMultiples(basis, quote?.price ?? null, financials);
  const [edited, setEdited] = useState<{ ticker: string; values: MultipleInputs } | null>(null);
  const defaults: MultipleInputs = {
    pe: anchors.pe ? Math.round(anchors.pe * 10) / 10 : 20,
    evEbitda: anchors.evEbitda ? Math.round(anchors.evEbitda * 10) / 10 : 12,
    ps: anchors.ps ? Math.round(anchors.ps * 10) / 10 : 3,
  };
  const storageKey = `zentai-multiples-${report.ticker}`;
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (saved && keys.every(key => typeof saved[key] === "number" && Number.isFinite(saved[key]) && saved[key] > 0 && saved[key] <= 200)) {
        setEdited({ ticker: report.ticker, values: saved });
      } else setEdited(null);
    } catch { setEdited(null); }
    // Restore once per ticker; subsequent market refreshes must not erase edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report.ticker, storageKey]);
  const targets = edited?.ticker === report.ticker ? edited.values : defaults;
  const values = multipleValues(basis, targets, financials);
  const update = (key: MultipleKey, value: number) => {
    const next = { ...targets, [key]: value };
    setEdited({ ticker: report.ticker, values: next });
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
  };
  const reset = () => { setEdited(null); try { localStorage.removeItem(storageKey); } catch {} };
  const [range, setRange] = useState<Range>("1y");
  const history = useFeed<MarketResponse>(`/api/market?symbols=${report.ticker}&range=${range}`, 300000, auto);
  const observed = history.data?.quotes.find(item => item.symbol === report.ticker);
  const priceHistory = observed?.history || [];
  const summary = summarizeHistory(priceHistory);
  const newsContext = matchNewsToHistory(priceHistory, news?.articles || []);
  const filingContext = matchFilingsToHistory(priceHistory, report.filings.filings);
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const selectedNews = newsContext.find(item => item.article.id === selectedNewsId) || newsContext[0];
  const newsMarkersByDate = new Map<string, { date: string; close: number; important: boolean }>();
  for (const item of newsContext) if (item.observation) {
    const previous = newsMarkersByDate.get(item.observation.date);
    newsMarkersByDate.set(item.observation.date, { date: item.observation.date, close: item.observation.close, important: !!headlinePriority(item.article.title) || !!previous?.important });
  }
  const newsMarkers = [...newsMarkersByDate.values()];
  const filingMarkers = [...new Map(filingContext.map(item => [item.observation.date, { date: item.observation.date, close: item.observation.close }])).values()];
  const eventNotes = [
    ...newsContext.filter(item => item.observation).map(item => ({ date: item.observation!.date, kind: "news" as const, title: item.article.title })),
    ...filingContext.map(item => ({ date: item.observation.date, kind: "filing" as const, title: `${item.filing.form} filed ${item.filing.filed}` })),
  ];
  const weakestFactor = report.credit.factors?.slice().sort((a, b) => a.points - b.points)[0];
  const biggestMoveNews = summary ? newsContext.filter(item => item.observation?.date === summary.largestMove.to.date) : [];
  const biggestMoveFilings = summary ? filingContext.filter(item => item.observation.date === summary.largestMove.to.date) : [];
  const [visible, setVisible] = useState<Record<string, boolean>>({ DCF: true, "P/E": true, "EV/EBITDA": false, "P/S": false });
  const references = [
    { name: "DCF", value: dcfValue },
    { name: "P/E", value: values.pe },
    { name: "EV/EBITDA", value: values.evEbitda },
    { name: "P/S", value: values.ps },
  ].filter((item): item is { name: string; value: number } => item.value !== null && Number.isFinite(item.value) && item.value > 0);
  const selected = references.filter(item => visible[item.name]).map(item => ({ ...item, color: colors[item.name] }));

  return <section className="panel report-section valuation-comparison">
    <div className="panel-heading"><div><p className="eyebrow">MULTI-MODEL LENS</p><h2>Compare valuation methods</h2></div><button className="button" onClick={reset}>Reset target multiples</button></div>
    <p className="report-context">DCF projects future free cash flow. P/E, EV/EBITDA, and P/S apply editable target multiples to the latest four reported quarters. Starting multiples are rounded from the current observed trading ratios when available; they are <strong>not peer benchmarks</strong> or independent price targets.</p>
    <div className="valuation-basis"><span>Quote {money(quote?.price)} · {quote?.asOf ? new Date(quote.asOf).toLocaleString() : "time unavailable"}</span><span>Statements through {report.as_of || "unavailable"}</span><span>Four-quarter window {basis.complete ? `${basis.periods[0]} → ${basis.periods[3]}` : "incomplete"}</span><span>Shares {basis.sharesM == null ? "unavailable" : `${basis.sharesM.toLocaleString()}M`}</span></div>
    <div className="valuation-model-grid">
      <div className="valuation-model-card"><span className="eyebrow">CASH FLOW</span><h3>DCF</h3><strong>{money(dcfValue)}</strong><p>Five-year FCF and terminal value. Change growth, discount, and terminal assumptions above.</p><small>{dcfValue == null ? "Unavailable: see the DCF explanation above." : quote?.price ? `${((dcfValue / quote.price - 1) * 100).toFixed(1)}% versus observed quote` : "Editable base-case estimate / share"}</small></div>
      {keys.map(key => <div className="valuation-model-card" key={key}>
        <span className="eyebrow">MARKET MULTIPLE</span><h3>{details[key].name}</h3><strong>{money(values[key])}</strong>
        <label>Target multiple <span><input aria-label={`${details[key].name} target multiple`} type="number" min="0.1" max="200" step="0.1" value={targets[key]} onChange={event => update(key, event.target.value === "" ? NaN : Number(event.target.value))} />×</span></label>
        <small>Observed trading multiple: {ratio(anchors[key])}</small>
        {values[key] !== null && quote?.price && <small>{((values[key] / quote.price - 1) * 100).toFixed(1)}% versus observed quote</small>}
        <details><summary>Inputs and calculation</summary><p>{details[key].formula}. {details[key].driver}: {key === "pe" ? `${money(basis.ttm.netIncome)}M` : key === "evEbitda" ? `${money(basis.ttm.ebitda)}M; net debt ${money(basis.netDebtM)}M` : `${money(basis.ttm.revenue)}M`}. Shares: {basis.sharesM == null ? "unavailable" : `${basis.sharesM}M`}.</p></details>
        {values[key] === null && <p className="valuation-unavailable">{financials && key !== "pe" ? "Withheld for financial firms: this operating-company method is not comparable." : "Unavailable: requires positive four-quarter results, shares, a valid multiple, and net debt for EV/EBITDA."}</p>}
      </div>)}
    </div>
    <p className="source">All values are USD per share. Quarterly statement figures come from {report.financials.source}; shares and balance-sheet inputs come from the provider snapshot. Multiples are user assumptions saved in this browser. No peer group or analyst consensus is inferred.</p>
    <div className="valuation-history-head"><div><p className="eyebrow">MARKET HISTORY</p><h3>Past price vs today&apos;s model levels</h3></div><div className="valuation-ranges" aria-label="Chart history range">{(["3mo", "1y", "5y"] as Range[]).map(item => <button key={item} className={range === item ? "active" : ""} aria-pressed={range === item} onClick={() => setRange(item)}>{item}</button>)}</div></div>
    <p className="report-context">The solid line is observed price history. Dots mark recent headlines and SEC filing dates near chart observations. Dashed horizontal levels are calculated <strong>now</strong> from today&apos;s inputs; the vertical line selects one news observation. Event timing gives context, not proof of what caused a move.</p>
    {summary && <div className="history-explainer">
      <div><span>Change over selected range</span><strong className={summary.periodPercent < 0 ? "negative" : "positive"}>{signedPercent(summary.periodPercent)}</strong><small>{shortDate(priceHistory[0].date)} → {shortDate(priceHistory.at(-1)!.date)}</small></div>
      <div><span>Largest {range === "5y" ? "weekly" : "daily"} move</span><strong className={summary.largestMove.percent < 0 ? "negative" : "positive"}>{signedPercent(summary.largestMove.percent)}</strong><small>{shortDate(summary.largestMove.from.date)} → {shortDate(summary.largestMove.to.date)}</small></div>
      <div><span>Largest peak-to-trough decline</span><strong className="negative">−{summary.maxDrawdownPercent.toFixed(1)}%</strong><small>{shortDate(summary.drawdownPeak.date)} → {shortDate(summary.drawdownTrough.date)}</small></div>
    </div>}
    {summary && <p className="history-reading"><strong>Reading the largest move:</strong> {signedPercent(summary.largestMove.percent)} between {shortDate(summary.largestMove.from.date)} and {shortDate(summary.largestMove.to.date)}. {biggestMoveFilings.length ? <>A {biggestMoveFilings.map(item => item.filing.form).join(", ")} filing date aligns with the later observation; <a href={biggestMoveFilings[0].filing.url} target="_blank" rel="noopener noreferrer">review the filing ↗</a> for context. Its publication time is not available here. </> : null}{biggestMoveNews.length ? `${biggestMoveNews.length} recent headline${biggestMoveNews.length === 1 ? "" : "s"} align with the later observation; timing alone cannot establish a driver.` : "The seven-day news feed has no matching headline; the cause is not established here."}</p>}
    {history.error && <p className="notice error" role="alert">Price history unavailable: {history.error} <button onClick={history.refresh}>Retry</button></p>}
    {priceHistory.length ? <ValuationHistoryChart data={priceHistory} lines={selected} newsMarkers={newsMarkers} filingMarkers={filingMarkers} eventNotes={eventNotes} selectedNewsDate={selectedNews?.observation?.date} /> : <div className="loading" role="status">{history.loading ? "Loading observed price history…" : "No historical prices available for this range."}</div>}
    <div className="valuation-legend"><span className="valuation-price-key">Observed price</span><span className="valuation-news-key">News · red if flagged</span><span className="valuation-filing-key">SEC filing</span>{references.map(item => <label key={item.name} style={{ color: colors[item.name] }}><input type="checkbox" checked={!!visible[item.name]} onChange={event => setVisible(current => ({ ...current, [item.name]: event.target.checked }))} />{item.name} {money(item.value)}</label>)}</div>
    <div className="chart-context-grid">
      <div className="chart-context-panel"><div className="chart-context-heading"><div><span className="eyebrow">DATED CONTEXT</span><h4>News near the chart</h4></div><span className="quiet-badge">LAST 7 DAYS</span></div>
        {newsContext.length ? <div className="chart-news-list">{newsContext.map(item => <div className={`chart-news-item ${item.article.id === selectedNews?.article.id ? "is-selected" : ""} ${headlinePriority(item.article.title) ? "is-important" : ""}`} key={item.article.id}>
          <button type="button" onClick={() => setSelectedNewsId(item.article.id)} aria-pressed={item.article.id === selectedNews?.article.id}>
            <small>{item.article.publisher} · {new Date(item.article.publishedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" })} ET</small>
            <strong>{item.article.title}</strong>
            <span>{item.movePercent === null ? "Awaiting a following price observation" : `${range === "5y" ? "Adjacent weekly" : "Adjacent daily"} observations: ${money(item.previous?.close)} → ${money(item.observation?.close)} (${signedPercent(item.movePercent)})`}</span>
          </button><a href={item.article.url} target="_blank" rel="noopener noreferrer">Open source ↗</a>
        </div>)}</div> : <p className="note">{news ? "No recent, timestamped headlines align with this chart range." : "Recent headline feed unavailable."}</p>}
        <p className="source">Markers use publication time in New York and the next available provider observation. A headline can follow a move or be unrelated to it; other market, sector, and company factors may matter. The feed covers only recent stories, not the full chart history.</p>
      </div>
      <div className="chart-context-panel"><span className="eyebrow">CURRENT RISK SNAPSHOT</span><h4>What risk is visible now?</h4>
        <strong className="chart-risk-score">{report.credit.status === "available" ? `${report.credit.grade} · ${report.credit.score?.toFixed(1)}/100` : "Not assessed"}</strong>
        <p>{weakestFactor ? `Weakest current credit factor: ${weakestFactor.name} (${weakestFactor.points}/100 factor points; ${Math.round(weakestFactor.weight * 100)}% weight).` : report.credit.reason || "No eligible credit factors are available."}</p>
        {summary && <p>Market-price risk in this selected range: a {summary.maxDrawdownPercent.toFixed(1)}% observed peak-to-trough decline.</p>}
        {filingContext.length > 0 && <div className="chart-filing-list"><strong>Recent SEC filing dates</strong>{filingContext.slice(0, 4).map(({ filing, observation }) => <a key={filing.accession} href={filing.url} target="_blank" rel="noopener noreferrer">{filing.form} filed {filing.filed} · chart point {shortDate(observation.date)} ↗</a>)}</div>}
        <p className="source">Credit inputs reflect statements through {report.as_of || "an unavailable period"}; the score was fetched {new Date(report.fetched_at).toLocaleString()}. Filing markers use filing dates, without publication times. The credit screen is not a historical risk series or agency rating. The price decline does not measure default risk.</p>
      </div>
    </div>
    <p className="source">Historical prices: {observed?.source || "public quote provider"} · last observation {observed?.asOf ? new Date(observed.asOf).toLocaleString() : "unavailable"}. May be delayed or adjusted by the provider; the latest point can be incomplete during market hours. Chart refreshes while this page is visible.</p>
  </section>;
}
