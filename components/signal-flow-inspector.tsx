"use client";

import { ArrowDownRight, ExternalLink, X } from "lucide-react";
import type { Company } from "@/lib/companies";
import type { SignalFactor, SignalObservation } from "@/lib/signal-map";
import type { Article, Quote } from "@/lib/types";
import { headlinePriority } from "@/lib/news-priority";

type Summary = {
  state: "Bullish" | "Mixed" | "Bearish" | null;
  score: number | null;
  close: number | null;
  observedAt: string | null;
  quoteAsOf: string | null;
  source: string | null;
  volume: number | null;
  relativeVolume: number | null;
  dayReturn: number | null;
  factors: SignalFactor[];
  error: string | null;
};
const money = (value: number | null | undefined) => value == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
const number = (value: number | null | undefined) => value == null ? "—" : new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(value);
const signed = (value: number | null | undefined, suffix = "") => value == null ? "—" : `${value > 0 ? "+" : ""}${value.toFixed(2)}${suffix}`;
const score = (value: number) => `${value > 0 ? "+" : ""}${value}`;
const date = (value: string | null | undefined) => value ? new Date(value).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "Unavailable";

function HistoryChart({ timeline }: { timeline: SignalObservation[] }) {
  const points = timeline.slice(-60);
  if (points.length < 2) return <p className="note">Dated chart history is loading. At least 30 valid observations are needed to calculate a signal.</p>;
  const min = Math.min(...points.map(point => point.close));
  const max = Math.max(...points.map(point => point.close));
  const range = max - min || 1;
  const x = (index: number) => 12 + index / (points.length - 1) * 296;
  const y = (close: number) => 92 - (close - min) / range * 75;
  const path = points.map((point, index) => `${index ? "L" : "M"} ${x(index).toFixed(1)} ${y(point.close).toFixed(1)}`).join(" ");
  return <div className="signal-river-history"><svg viewBox="0 0 320 112" role="img" aria-label={`Observed closing price from ${points[0].date.slice(0, 10)} to ${points.at(-1)!.date.slice(0, 10)}`}>
    <line x1="12" x2="308" y1="93" y2="93" className="signal-river-axis" />
    <path d={path} className="signal-river-history-line" />
    {points.map((point, index) => index > 0 && point.state !== points[index - 1].state ? <circle key={point.date} cx={x(index)} cy={y(point.close)} r="4.5" className={`signal-river-history-point ${point.state.toLowerCase()}`}><title>{point.date.slice(0, 10)} · {point.state} · {money(point.close)} · score {point.score}</title></circle> : null)}
    <circle cx={x(points.length - 1)} cy={y(points.at(-1)!.close)} r="4" className="signal-river-history-latest"><title>Latest: {money(points.at(-1)!.close)}</title></circle>
  </svg><div className="signal-river-history-dates"><span>{points[0].date.slice(0, 10)}</span><span>{points.at(-1)!.date.slice(0, 10)}</span></div><small>Observed closes · colored dots mark model state changes</small></div>;
}

export function SignalFlowInspector({ company, summary, selectedQuote, timeline, articles, newsLoading, newsError, onClose }: {
  company: Company;
  summary?: Summary;
  selectedQuote?: Quote;
  timeline: SignalObservation[];
  articles: Article[];
  newsLoading: boolean;
  newsError: string | null;
  onClose: () => void;
}) {
  const state = summary?.state || "Unscanned";
  const transitions = timeline.filter((item, index) => index > 0 && item.state !== timeline[index - 1].state).slice(-4).reverse();
  const openReport = () => requestAnimationFrame(() => document.getElementById("signal-detail")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  return <aside className="signal-river-inspector" aria-label={`${company.ticker} evidence inside signal map`}>
    <div className="signal-river-inspector-head"><div><p className="eyebrow">PATH EVIDENCE · {company.sector}</p><h3>{company.ticker} <span>{company.name}</span></h3></div><button className="signal-river-inspector-close" aria-label="Close path evidence" onClick={onClose}><X size={17} /></button></div>
    <div className={`signal-river-inspector-state ${state.toLowerCase()}`}><strong>{state}</strong><span>{summary?.score == null ? "No computed score" : `${score(summary.score)} / 5`}</span></div>
    <div className="signal-river-inspector-body">
      {summary?.error && <p className="notice error">{summary.error}</p>}
      {!summary?.state && !summary?.error && <p className="note">Requesting dated chart history. This company remains unscanned until enough valid observations arrive.</p>}
      <div className="signal-river-inspector-section"><h4>Observed market data</h4><dl className="signal-river-inspector-facts"><div><dt>Close</dt><dd>{money(summary?.close)}</dd></div><div><dt>Daily move</dt><dd>{signed(summary?.dayReturn, "%")}</dd></div><div><dt>Volume</dt><dd>{number(summary?.volume)} shares</dd></div><div><dt>Relative volume</dt><dd>{summary?.relativeVolume == null ? "—" : `${summary.relativeVolume.toFixed(2)}×`}</dd></div><div><dt>Chart date</dt><dd>{summary?.observedAt?.slice(0, 10) || "—"}</dd></div><div><dt>Quote updated</dt><dd>{date(summary?.quoteAsOf)}</dd></div></dl><p className="source">{summary?.source || "Chart source pending"} · public quotes can be delayed. Relative volume compares the latest day with the preceding 20 observations.</p></div>
      <div className="signal-river-inspector-section"><h4>Why the model chose this state</h4><p className="source">Five dated rules each add +1, 0, or −1. Scores ≥ +2 are bullish; ≤ −2 bearish; the rest mixed.</p>{summary?.factors.length ? <div className="signal-river-inspector-rules">{summary.factors.map(factor => <div key={factor.name}><div><strong>{factor.name}</strong><b className={factor.contribution > 0 ? "bullish" : factor.contribution < 0 ? "bearish" : "mixed"}>{factor.contribution > 0 ? "+" : ""}{factor.contribution}</b></div><small>Observed: {factor.reading}</small><small>Rule: {factor.rule}</small></div>)}</div> : <p className="note">Rule readings appear after the dated chart is available.</p>}</div>
      <div className="signal-river-inspector-section"><h4>Historical path</h4><HistoryChart timeline={timeline} />{transitions.length > 0 && <div className="signal-river-inspector-transitions">{transitions.map(item => <div key={item.date}><span className={item.state.toLowerCase()}>{item.state}</span><time>{item.date.slice(0, 10)}</time><small>{money(item.close)} · {score(item.score)}/5</small></div>)}</div>}<p className="source">A state change is a model observation, not a trade signal or proof of what moved the price.</p></div>
      <div className="signal-river-inspector-section"><h4>Related headlines</h4>{selectedQuote && newsLoading && !articles.length && <p className="note">Loading recent headlines…</p>}{selectedQuote && newsError && <p className="note">{newsError}</p>}{selectedQuote && !newsLoading && !newsError && !articles.length && <p className="note">No recent timestamped headlines available.</p>}{selectedQuote && articles.length > 0 && <div className="signal-river-inspector-news">{articles.slice(0, 3).map(article => <a key={article.id} href={article.url} target="_blank" rel="noopener noreferrer" className={headlinePriority(article.title) ? "important" : ""}><small>{article.publisher} · {date(article.publishedAt)}</small><strong>{article.title}</strong>{headlinePriority(article.title) && <em>Potentially important: {headlinePriority(article.title)}</em>}<ExternalLink size={13} /></a>)}</div>}{!selectedQuote && <p className="note">Headlines load with this company’s quote.</p>}<p className="source">Headlines give context; timing alone does not prove causation. Open the source article to verify.</p></div>
    </div><button className="button signal-river-full-report" onClick={openReport}>Open full company report <ArrowDownRight size={15} /></button>
  </aside>;
}
