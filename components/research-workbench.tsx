"use client";

import { useEffect, useState } from "react";
import { ExternalLink, FileDown, Info } from "lucide-react";
import type { AnalystSnapshot, MarketResponse, Quote } from "@/lib/types";
import { companies } from "@/lib/companies";
import { compareRevisions, evaluateForecast, researchPoints, revisionOf, type Forecast, type ResearchRevision } from "@/lib/research";
import { useFeed } from "./use-feed";

const amount = (value: number | null | undefined, digits = 2) => value == null || !Number.isFinite(value) ? "—" : new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);
const date = (value?: string | null) => value ? new Date(value).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "Unavailable";
const revisionsKey = (ticker: string) => `zentai-revisions-v1-${ticker}`;
const forecastsKey = (ticker: string) => `zentai-forecasts-v1-${ticker}`;

function readArray<T>(key: string): T[] {
  try { const value: unknown = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(value) ? value : []; }
  catch { return []; }
}

function EvidenceTrail({ report, quote }: { report: AnalystSnapshot; quote?: Quote }) {
  return <section className="panel report-section">
    <div className="panel-heading"><div><p className="eyebrow">REPRODUCIBLE RESEARCH</p><h2>Evidence trail</h2></div><span className="quiet-badge">SOURCE → INPUT → CONCLUSION</span></div>
    <p className="report-context">Open a row to inspect its value, source period, calculation, and original provider or filing. Provider links may require you to locate the reported line; SEC fact links open the filing containing its XBRL value.</p>
    <div className="evidence-list">{researchPoints(report, quote).map(point => <details className="evidence-row" key={point.key}>
      <summary><span>{point.label}</span><strong>{amount(point.value)} <small>{point.unit}</small></strong></summary>
      <div className="evidence-detail"><p><b>How it was reached</b> {point.formula}</p><p><b>Source</b> {point.source} · {point.period}</p>{point.url && <a href={point.url} target="_blank" rel="noopener noreferrer">Open source <ExternalLink size={13} /></a>}</div>
    </details>)}</div>
    <p className="source">The evidence trail is assembled from the current report. It is not proof that a provider figure matches an SEC filing; inspect reconciliation checks below.</p>
  </section>;
}

function ChangeLedger({ report, quote }: { report: AnalystSnapshot; quote?: Quote }) {
  const [revisions, setRevisions] = useState<ResearchRevision[]>([]);
  useEffect(() => {
    const key = revisionsKey(report.ticker);
    const prior = readArray<ResearchRevision>(key).filter(r => r && Array.isArray(r.points) && typeof r.capturedAt === "string");
    const current = revisionOf(report, quote);
    const last = prior.at(-1);
    // A changed quote alone should not obscure a later filing or statement revision.
    const meaningful = !last || last.period !== current.period || last.filing !== current.filing || last.grade !== current.grade ||
      compareRevisions(last, current).some(change => change.key !== "quote");
    const next = meaningful ? [...prior, current].slice(-30) : prior;
    setRevisions(next);
    if (meaningful) try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
  }, [report, quote]);
  const current = revisions.at(-1), previous = revisions.at(-2);
  const changes = previous && current ? compareRevisions(previous, current).filter(change => change.key !== "quote") : [];
  return <section className="panel report-section">
    <div className="panel-heading"><div><p className="eyebrow">WHAT CHANGED?</p><h2>Report revisions</h2></div><span className="quiet-badge">BROWSER HISTORY</span></div>
    {!previous ? <p className="note">This is the first saved report revision in this browser. Changes will appear after a later filing or source update is observed.</p> : <>
      <p className="report-context">Comparing the saved report from {date(previous.capturedAt)} with {date(current?.capturedAt)}. This is observation history, not a complete archive of every SEC filing.</p>
      <div className="revision-tags">{previous.period !== current?.period && <span>Fiscal period {previous.period || "unknown"} → {current?.period || "unknown"}</span>}{previous.filing !== current?.filing && <span>Latest filing changed <a href={report.filings.filings[0]?.url} target="_blank" rel="noopener noreferrer">Open new filing <ExternalLink size={12} /></a></span>}{previous.grade !== current?.grade && <span>Screen label {previous.grade && /^(AAA|AA|A|BBB|BB|B|CCC)$/.test(previous.grade) ? `legacy tier ${previous.grade}` : previous.grade || "unavailable"} → {current?.grade || "unavailable"}</span>}</div>
      {changes.length ? <div className="change-list">{changes.map(change => <div className="change-row" key={change.key}><span>{change.label}</span><strong>{amount(change.before)} → {amount(change.after)} <small>{change.unit}</small></strong><small>{change.source}{change.url && <> · <a href={change.url} target="_blank" rel="noopener noreferrer">Source <ExternalLink size={11} /></a></>}</small></div>)}</div> : <p className="note">The filing or fiscal-period reference changed, but none of the displayed numeric fields changed. Review the filing for narrative and unmapped facts.</p>}
    </>}
    <p className="source">Up to 30 observed revisions are kept locally in this browser. Clearing browser storage removes this history.</p>
  </section>;
}

function TrackRecord({ report, quote }: { report: AnalystSnapshot; quote?: Quote }) {
  const [records, setRecords] = useState<Forecast[]>([]);
  const [target, setTarget] = useState("");
  const [days, setDays] = useState(30);
  const [message, setMessage] = useState("");
  const hasDue = records.some(item => !item.result && Date.now() >= Date.parse(item.dueAt));
  const featured = companies.some(item => item.ticker === report.ticker);
  const outcomeFeed = useFeed<MarketResponse>(hasDue && featured ? `/api/market?symbols=${report.ticker}&range=1y` : null, 0, false);
  const broadOutcome = useFeed<{ quote: Quote }>(hasDue && !featured ? `/api/universe/quote?symbol=${encodeURIComponent(report.ticker)}&range=1y` : null, 0, false);
  const outcomeHistory = (featured ? outcomeFeed.data?.quotes.find(item => item.symbol === report.ticker)?.history : broadOutcome.data?.quote.history) || quote?.history || [];
  useEffect(() => { setRecords(readArray<Forecast>(forecastsKey(report.ticker)).filter(item => item?.ticker === report.ticker && typeof item.predictedPrice === "number")); }, [report.ticker]);
  useEffect(() => {
    if (!outcomeHistory.length) return;
    setRecords(current => {
      const next = current.map(item => evaluateForecast(item, outcomeHistory));
      if (next.some((item, i) => item.result !== current[i].result)) {
        try { localStorage.setItem(forecastsKey(report.ticker), JSON.stringify(next)); } catch {}
        return next;
      }
      return current;
    });
  }, [outcomeFeed.data, broadOutcome.data, quote, report.ticker]);
  const add = () => {
    const predictedPrice = Number(target);
    if (!quote || !Number.isFinite(quote.price) || quote.price <= 0 || !Number.isFinite(predictedPrice) || predictedPrice <= 0 || target.trim() === "") { setMessage("Enter a positive target and wait for a valid observed quote."); return; }
    const assumption = report.valuation.assumptions;
    const savedModel = (() => { try { return JSON.parse(localStorage.getItem(`zentai-model-${report.ticker}`) || "null"); } catch { return null; } })();
    const valid = savedModel && [savedModel.growth, savedModel.discount, savedModel.terminal].every((value: unknown) => typeof value === "number" && Number.isFinite(value));
    const scenario = { freeCashFlowM: report.valuation.free_cash_flow_m || 0, sharesM: report.valuation.shares_outstanding_m || 0,
      growth: valid ? savedModel.growth / 100 : assumption?.growth_rate ?? 0,
      discount: valid ? savedModel.discount / 100 : assumption?.discount_rate ?? .09,
      terminal: valid ? savedModel.terminal / 100 : assumption?.terminal_growth ?? .02 };
    const now = new Date();
    const record: Forecast = { id: crypto.randomUUID(), ticker: report.ticker, createdAt: now.toISOString(),
      dueAt: new Date(now.getTime() + days * 86400000).toISOString(), predictedPrice, startingPrice: quote.price,
      quoteAsOf: quote.asOf, grade: report.credit.grade, scenario };
    const next = [record, ...records].slice(0, 50);
    try { localStorage.setItem(forecastsKey(report.ticker), JSON.stringify(next)); setRecords(next); setTarget(""); setMessage("Prediction locked in this browser."); }
    catch { setMessage("This browser could not save the prediction."); }
  };
  const exportRecords = () => {
    const blob = new Blob([JSON.stringify({ schema: "zentai-local-track-record-v1", ticker: report.ticker, exportedAt: new Date().toISOString(), records }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `zentai-${report.ticker.toLowerCase()}-track-record.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const scored = records.filter(item => item.result);
  const meanError = scored.length ? scored.reduce((sum, item) => sum + (item.result?.absolutePercentError || 0), 0) / scored.length : null;
  const directionRate = scored.length ? scored.filter(item => item.result?.directionCorrect).length / scored.length * 100 : null;
  return <section className="panel report-section">
    <div className="panel-heading"><div><p className="eyebrow">CREDIBILITY RECORD</p><h2>Prediction track record</h2></div><button className="button" onClick={exportRecords} disabled={!records.length}><FileDown size={14} /> Export data</button></div>
    <p className="report-context">Lock a dated price prediction and the current model assumptions. After its horizon, the first completed Yahoo Finance daily close within seven calendar days is used to score absolute percentage error and direction from the starting quote. A missing close stays unscored.</p>
    {(featured ? outcomeFeed.error : broadOutcome.error) && hasDue && <p className="note">Historical price check could not refresh: {featured ? outcomeFeed.error : broadOutcome.error}. Due predictions remain unscored until data is available.</p>}
    <div className="record-form"><label>Predicted price / share<input type="number" min="0.01" step="0.01" placeholder="USD" value={target} onChange={event => setTarget(event.target.value)} /></label><label>Horizon<select value={days} onChange={event => setDays(Number(event.target.value))}><option value={30}>30 days</option><option value={90}>90 days</option></select></label><button className="button primary" onClick={add}>Lock prediction</button></div>
    {message && <p className="source" role="status">{message}</p>}
    <div className="record-metrics"><div><span>Scored predictions</span><strong>{scored.length} / {records.length}</strong></div><div><span>Mean absolute % error <Info size={12} /></span><strong>{meanError == null ? "Awaiting outcomes" : `${amount(meanError, 1)}%`}</strong></div><div><span>Direction correct</span><strong>{directionRate == null ? "Awaiting outcomes" : `${amount(directionRate, 0)}%`}</strong></div></div>
    {records.length ? <div className="record-list">{records.map(item => <div className="record-row" key={item.id}><div><strong>{amount(item.predictedPrice)} USD</strong><small>from {amount(item.startingPrice)} · due {date(item.dueAt)} · concern band at entry: {item.grade || "unavailable"}</small></div><div>{item.result ? <><strong>Observed {amount(item.result.observedPrice)} USD</strong><small>{date(item.result.observedAt)} · error {amount(item.result.absolutePercentError, 1)}% · direction {item.result.directionCorrect ? "correct" : "missed"}</small></> : <span>Awaiting eligible closing price</span>}</div></div>)}</div> : <p className="note">No predictions saved yet. The accuracy metrics will remain blank until a dated prediction has an observed outcome.</p>}
    <p className="report-disclosure">This is a local, user-entered price track record, not a public performance audit. It does not validate the balance-sheet concern band or measure default probability. A public record requires server-side immutable storage and point-in-time outcome data.</p>
  </section>;
}

export function ResearchWorkbench({ report, quote }: { report: AnalystSnapshot; quote?: Quote }) {
  return <div className="research-workbench"><EvidenceTrail report={report} quote={quote} /><ChangeLedger report={report} quote={quote} /><TrackRecord report={report} quote={quote} /></div>;
}
