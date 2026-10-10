"use client";

import { Clock3, ExternalLink, FileDown, RefreshCw } from "lucide-react";
import type { Company } from "@/lib/companies";
import type { AnalystSnapshot, NewsResponse, Quote } from "@/lib/types";
import { useFeed } from "./use-feed";
import { FinancialChart } from "./charts";

const cash = (value?: number | null) =>
  value == null || !Number.isFinite(value)
    ? "—"
    : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
const num = (value?: number | null, digits = 1) =>
  value == null || !Number.isFinite(value)
    ? "—"
    : new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);
const stamp = (value?: string | null) =>
  value ? new Date(value).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "Unavailable";

export function AnalystReport({ company, quote, news, auto }: {
  company: Company;
  quote?: Quote;
  news: ReturnType<typeof useFeed<NewsResponse>>;
  auto: boolean;
}) {
  const feed = useFeed<AnalystSnapshot>(
    `/api/analytics?section=analyst&company=${company.key}`,
    300000,
    auto,
  );
  const report = feed.data;
  const credit = report?.credit;
  const kpi = report?.financials.latest_kpis;
  const valuation = report?.valuation;
  const articles = news.data?.articles.slice(0, 4) || [];

  return (
    <div className="analyst-report stack">
      <section className="analyst-banner panel">
        <div>
          <p className="eyebrow">EQUITY + CREDIT · PUBLIC DATA</p>
          <h2>{company.name} <span>{company.ticker}</span></h2>
          <p>One source-labeled view of the market quote, reported fundamentals, an illustrative equity valuation, and an internal credit screen.</p>
        </div>
        <div className="report-actions">
          <button className="button" onClick={feed.refresh} disabled={feed.loading}>
            <RefreshCw size={15} className={feed.loading ? "spin" : ""} /> Refresh report
          </button>
          <button className="button" onClick={() => window.print()} disabled={!report}>
            <FileDown size={15} /> Print / PDF
          </button>
        </div>
      </section>

      {feed.error && <div className="notice error" role="alert">{feed.data ? "Update failed. Showing the last successful report. " : ""}{feed.error} <button onClick={feed.refresh}>Retry</button></div>}
      {!report && !feed.error && <div className="loading" role="status"><RefreshCw size={15} className="spin" /> Assembling the analyst report…</div>}

      {report && <div className="report-content result-reveal" key={`${company.key}-${feed.receivedAt}`}>
        <div className="report-kpis">
          <div className="report-kpi"><span>Market quote</span><strong>{cash(quote?.price)}</strong><small>{quote ? `${quote.feedLabel} · ${stamp(quote.asOf)}` : "Quote unavailable"}</small></div>
          <div className="report-kpi"><span>Internal credit tier</span><strong className={credit?.status === "available" ? "tier-value" : ""}>{credit?.grade || "Not assessed"}</strong><small>{credit?.status === "available" ? `Screen score ${num(credit.score)} / 100` : credit?.reason}</small></div>
          <div className="report-kpi"><span>Latest quarterly revenue</span><strong>{kpi?.revenue_m == null ? "—" : `${cash(kpi.revenue_m)}M`}</strong><small>Fiscal period {report.as_of || "unavailable"}</small></div>
          <div className="report-kpi"><span>DCF model estimate / share</span><strong>{cash(valuation?.intrinsic_value)}</strong><small>{valuation?.error || "Illustrative scenario, not a price target"}</small></div>
        </div>

        <div className="report-columns">
          <section className="panel report-section">
            <div className="panel-heading"><div><p className="eyebrow">CREDIT RISK</p><h2>Balance-sheet screen</h2></div><span className="quiet-badge">INTERNAL MODEL</span></div>
            {credit?.status === "available" ? <>
              <div className="credit-score"><strong>{credit.grade}</strong><div><span>Indicative internal tier</span><b>{num(credit.score)} / 100</b></div></div>
              <div className="credit-factors">
                {credit.factors?.map((factor) => <div className="credit-factor" key={factor.name}>
                  <div><span>{factor.name}</span><strong>{num(factor.value, 2)}{factor.name === "Debt / assets" ? "" : "×"}</strong></div>
                  <div className="factor-track" aria-label={`${factor.name}: ${factor.points} of 100 points`}><span style={{ width: `${factor.points}%` }} /></div>
                  <small>{Math.round(factor.weight * 100)}% weight · {factor.points} points</small>
                </div>)}
              </div>
              <p className="report-context">EBITDA / interest expense: {credit.metrics?.ebitda_interest_coverage == null ? "Unavailable" : `${num(credit.metrics.ebitda_interest_coverage, 2)}×`}. Shown as context, not included in the tier.</p>
            </> : <p className="note">{credit?.reason || "No credit assessment is available."}</p>}
            <p className="report-disclosure">{credit?.caveat}</p>
            {credit?.methodology && <details className="report-method"><summary>Scoring method and grade bands</summary><p>{credit.methodology}</p></details>}
          </section>

          <section className="panel report-section">
            <div className="panel-heading"><div><p className="eyebrow">EQUITY RESEARCH</p><h2>Fundamentals and valuation</h2></div><span className="quiet-badge">REPORTED + MODEL</span></div>
            <div className="report-stat-grid">
              <div><span>Quarterly EBITDA</span><strong>{kpi?.ebitda_m == null ? "—" : `${cash(kpi.ebitda_m)}M`}</strong></div>
              <div><span>Net margin</span><strong>{kpi?.net_margin_pct == null ? "—" : `${num(kpi.net_margin_pct)}%`}</strong></div>
              <div><span>Cash</span><strong>{kpi?.cash_m == null ? "—" : `${cash(kpi.cash_m)}M`}</strong></div>
              <div><span>Total debt</span><strong>{kpi?.total_debt_m == null ? "—" : `${cash(kpi.total_debt_m)}M`}</strong></div>
            </div>
            <FinancialChart data={report.financials.quarterly} />
            {valuation?.error ? <p className="note">Valuation unavailable: {valuation.error}</p> : <p className="note">DCF implied difference to provider price: {num(valuation?.upside_pct)}%. {valuation?.methodology} Assumptions: growth {num((valuation?.assumptions?.growth_rate ?? 0) * 100)}%, discount {num((valuation?.assumptions?.discount_rate ?? 0) * 100)}%, terminal growth {num((valuation?.assumptions?.terminal_growth ?? 0) * 100)}%.</p>}
          </section>
        </div>

        <section className="panel report-section">
          <div className="panel-heading"><div><p className="eyebrow">MONITOR</p><h2>Recent company headlines</h2></div><span className="quiet-badge">PUBLIC RSS</span></div>
          {news.error && <p className="note">Headline update failed. {news.data ? "Showing the last successful snapshot." : "No headline snapshot is available."}</p>}
          {!news.data && !news.error && <div className="loading" role="status">Loading headlines…</div>}
          {news.data && (articles.length ? <div className="report-headlines">{articles.map((article) => <a href={article.url} target="_blank" rel="noopener noreferrer" key={article.id}><span>{article.publisher} · {stamp(article.publishedAt)}</span><strong>{article.title}</strong><ExternalLink size={15} /></a>)}</div> : <p className="note">No timestamped headlines found in the past seven days.</p>)}
          <p className="source">{news.data?.warning} {news.data ? `· Headlines fetched ${stamp(news.data.fetchedAt)}` : ""}</p>
        </section>

        <section className="report-provenance" aria-label="Sources and freshness">
          <h2>Sources & freshness</h2>
          <p><Clock3 size={14} /> Quote: {quote?.source || "unavailable"} · observation {stamp(quote?.asOf)} · fetched {stamp(quote?.fetchedAt)}</p>
          <p><Clock3 size={14} /> Statements: {report.financials.source} · fiscal period {report.as_of || "unavailable"} · fetched {stamp(report.fetched_at)}</p>
          <p><Clock3 size={14} /> Valuation fields: Yahoo Finance · report fetched {stamp(report.fetched_at)}</p>
          <p><Clock3 size={14} /> Headlines: {news.data?.source || "unavailable"} · fetched {stamp(news.data?.fetchedAt)}</p>
          <small>Public feeds may be delayed or incomplete. Financial statements update when the issuer reports; automatic refresh checks for new data every five minutes while this page is visible. This report is research support, not investment advice.</small>
        </section>
      </div>}
    </div>
  );
}
