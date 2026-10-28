"use client";

import { createContext, useContext, useEffect, useId, useState } from "react";
import { Clock3, ExternalLink, FileDown, Info, RefreshCw } from "lucide-react";
import type { Company } from "@/lib/companies";
import type { AnalystSnapshot, NewsResponse, Quote } from "@/lib/types";
import { useFeed } from "./use-feed";
import { FinancialChart } from "./charts";
import type { ModelInputs } from "@/lib/valuation";
import { challengeDcf, stressCredit } from "@/lib/research";
import { ResearchWorkbench } from "./research-workbench";
import { headlinePriority } from "@/lib/news-priority";
import { ValuationComparison } from "./valuation-comparison";
import { analystEvidenceChecks } from "@/lib/data-quality";
import { researchPoints } from "@/lib/research";

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

const ExplainContext = createContext<{ active: string | null; setActive: (id: string | null) => void } | null>(null);
function Explain({ label, children }: { label: string; children: React.ReactNode }) {
  const id = useId();
  const context = useContext(ExplainContext);
  const open = context?.active === id;
  return <span className={`report-explain ${open ? "is-open" : ""}`} onMouseEnter={() => context?.setActive(id)} onMouseLeave={() => context?.setActive(null)}><button type="button" aria-label={`Explain ${label}`} aria-describedby={open ? id : undefined} aria-expanded={open} onFocus={() => context?.setActive(id)} onBlur={() => context?.setActive(null)} onClick={() => context?.setActive(id)} onKeyDown={event => { if (event.key === "Escape") { context?.setActive(null); event.currentTarget.blur(); } }}><Info size={14} /></button><span id={id} className="report-explain-pop" role="tooltip"><strong>{label}</strong><span>{children}</span></span></span>;
}

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
  const evidenceChecks = report ? analystEvidenceChecks(report, quote) : [];
  const [activeExplain, setActiveExplain] = useState<string | null>(null);
  useEffect(() => {
    const close = (event: PointerEvent) => { if (!(event.target instanceof Element) || !event.target.closest(".report-explain")) setActiveExplain(null); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  return (
    <ExplainContext.Provider value={{ active: activeExplain, setActive: setActiveExplain }}>
    <div className="analyst-report stack">
      <section className="analyst-banner panel">
        <div>
          <p className="eyebrow">EQUITY + CREDIT · PUBLIC DATA</p>
          <h2>{company.name} <span>{company.ticker}</span></h2>
          <p>One source-labeled view of the market quote, reported fundamentals, an illustrative equity valuation, and an internal credit screen.</p>
          {report && <p className="source">Research snapshot fetched {stamp(report.fetched_at)} · fiscal period {report.as_of || "unavailable"} · review the evidence status below before use.</p>}
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

      {feed.error && <div className="notice error" role="alert">{feed.data ? `Update failed. Showing the report fetched ${stamp(feed.data.fetched_at)}; its evidence may be stale. ` : "No report is available. "}{feed.error} Check the cited source dates or <button onClick={feed.refresh}>retry</button>.</div>}
      {!report && !feed.error && <div className="loading" role="status"><RefreshCw size={15} className="spin" /> Assembling the analyst report…</div>}

      {report && <div className="report-content result-reveal" key={company.key}>
        <div className="report-kpis">
          <div className="report-kpi"><Explain label="Market quote">{quote ? `${quote.source} observation at ${stamp(quote.asOf)}; fetched ${stamp(quote.fetchedAt)}. ${quote.feedLabel}. Public quotes may be delayed.` : "The market quote feed did not return a usable price."}</Explain><span>Market quote</span><strong>{cash(quote?.price)}</strong><small>{quote ? `${quote.feedLabel} · ${stamp(quote.asOf)}` : "Quote unavailable"}</small></div>
          <div className="report-kpi"><Explain label="Balance-sheet concern">{credit?.status === "available" ? `Weighted points: ${credit.factors?.map(f => `${f.name} ${f.points} × ${Math.round(f.weight * 100)}%`).join(" + ")} = ${num(credit.score)}. Concern bands are in the credit section. This is not an agency rating.` : credit?.reason || "A concern band is withheld when required data is missing."}</Explain><span>Balance-sheet concern</span><strong className={credit?.status === "available" ? "tier-value" : ""}>{credit?.grade || "Not assessed"}</strong><small>{credit?.status === "available" ? `Screen score ${num(credit.score)} / 100` : credit?.reason}</small></div>
          <div className="report-kpi"><Explain label="Quarterly revenue">Latest reported Yahoo Finance income-statement revenue, in USD millions, for fiscal period {report.as_of || "unavailable"}. Check the SEC filing facts below before relying on it.</Explain><span>Latest quarterly revenue</span><strong>{kpi?.revenue_m == null ? "—" : `${cash(kpi.revenue_m)}M`}</strong><small>Fiscal period {report.as_of || "unavailable"}</small></div>
          <div className="report-kpi"><Explain label="Zentai DCF estimate">A five-year free-cash-flow-per-share calculation using Yahoo Finance inputs and a terminal value. Growth, discount rate and terminal growth assumptions are visible and editable below. This is a model scenario, not a price target.</Explain><span>DCF model estimate / share</span><strong>{cash(valuation?.intrinsic_value)}</strong><small>{valuation?.error || "Illustrative scenario, not a price target"}</small></div>
        </div>
        <section className="panel report-evidence-status" aria-label="Data quality and evidence coverage"><div className="panel-heading"><div><p className="eyebrow">SOURCE COVERAGE · REVIEW BEFORE USE</p><h2>Evidence status</h2></div><span className="quiet-badge">{evidenceChecks.filter(check => check.state === "available").length} OF {evidenceChecks.length} PRESENT</span></div><p className="note">These checks describe available inputs, not the accuracy of a valuation or the probability of an outcome. A flagged item needs source review.</p><div className="report-evidence-grid">{evidenceChecks.map(check => <div key={check.label} className={`report-evidence-item ${check.state}`}><strong>{check.label}</strong><span>{check.state === "available" ? "Present" : check.state === "review" ? "Review" : "Missing"}</span><small>{check.detail}</small></div>)}</div></section>

        <div className="report-columns">
          <section className="panel report-section">
            <div className="panel-heading"><div><p className="eyebrow">CREDIT RISK</p><h2>Balance-sheet screen</h2></div><span className="quiet-badge">INTERNAL MODEL</span></div>
            {credit?.status === "available" ? <>
              <div className="credit-score"><strong>{credit.grade}</strong><div><span>Internal concern band</span><b>{num(credit.score)} / 100</b></div></div>
              <div className="credit-factors">
                {credit.factors?.map((factor) => <div className="credit-factor" key={factor.name}>
                  <div><span>{factor.name} <Explain label={factor.name}>{factor.name === "Net debt / TTM EBITDA" ? `max(0, total debt ${num(kpi?.total_debt_m)}M − cash ${num(kpi?.cash_m)}M) ÷ four-quarter EBITDA ${num(credit.metrics?.ttm_ebitda_m)}M.` : factor.name === "Debt / assets" ? `Total debt ${num(kpi?.total_debt_m)}M divided by total assets; the source ratio is ${num(kpi?.debt_to_assets, 3)}.` : `Cash ${num(kpi?.cash_m)}M divided by total debt ${num(kpi?.total_debt_m)}M.`} This factor receives {factor.points} of 100 possible points and carries a {Math.round(factor.weight * 100)}% weight.</Explain></span><strong>{num(factor.value, 2)}{factor.name === "Debt / assets" ? "" : "×"}</strong></div>
                  <div className="factor-track" aria-label={`${factor.name}: ${factor.points} of 100 points`}><span style={{ width: `${factor.points}%` }} /></div>
                  <small>{Math.round(factor.weight * 100)}% weight · {factor.points} points</small>
                </div>)}
              </div>
              <p className="report-context">EBITDA / interest expense: {credit.metrics?.ebitda_interest_coverage == null ? "Unavailable" : `${num(credit.metrics.ebitda_interest_coverage, 2)}×`}. Shown as context, not included in the score.</p>
              <div className="credit-review-grid">
                <div><span>Current ratio <Explain label="Current ratio">Current assets divided by current liabilities from the latest Yahoo balance sheet. It is context only and does not change the score.</Explain></span><strong>{credit.metrics?.current_ratio == null ? "Unavailable" : `${num(credit.metrics.current_ratio, 2)}×`}</strong></div>
                <div><span>Current long-term debt <Explain label="Current debt">SEC XBRL current portion of long-term debt, when tagged. This is not a complete debt maturity ladder.</Explain></span><strong>{report.filings.facts.current_debt_m ? `${cash(report.filings.facts.current_debt_m.value_m)}M` : "Unavailable"}</strong></div>
                <div><span>Debt covenants</span><strong>Manual filing review</strong></div>
                <div><span>Full maturities</span><strong>Manual filing review</strong></div>
              </div>
            </> : <><p className="note">{credit?.reason || "No credit assessment is available."}</p>{report.industry === "Financials" && <BankReview report={report} />}</>}
            <p className="report-disclosure">{credit?.caveat}</p>
            {credit?.methodology && <details className="report-method"><summary>Scoring method and concern bands</summary><p>{credit.methodology}</p></details>}
          </section>

          <section className="panel report-section">
            <div className="panel-heading"><div><p className="eyebrow">EQUITY RESEARCH</p><h2>Fundamentals and valuation</h2></div><span className="quiet-badge">REPORTED + MODEL</span></div>
            <div className="report-stat-grid">
              <div><span>Quarterly EBITDA <Explain label="Quarterly EBITDA">Reported EBITDA from the latest Yahoo Finance quarterly income statement, fiscal period {report.as_of || "unavailable"}. EBITDA is earnings before interest, taxes, depreciation and amortization.</Explain></span><strong>{kpi?.ebitda_m == null ? "—" : `${cash(kpi.ebitda_m)}M`}</strong></div>
              <div><span>Net margin <Explain label="Net margin">Quarterly net income divided by quarterly revenue, multiplied by 100, from Yahoo Finance statement lines for {report.as_of || "the latest available period"}.</Explain></span><strong>{kpi?.net_margin_pct == null ? "—" : `${num(kpi.net_margin_pct)}%`}</strong></div>
              <div><span>Cash <Explain label="Provider cash">Cash and equivalents from the latest Yahoo Finance balance sheet. Compare with the dated SEC XBRL cash fact and reconciliation check below.</Explain></span><strong>{kpi?.cash_m == null ? "—" : `${cash(kpi.cash_m)}M`}</strong></div>
              <div><span>Total debt <Explain label="Provider total debt">Total debt from the latest Yahoo Finance balance sheet. Check the original filing's debt note for maturity, lease, and covenant detail.</Explain></span><strong>{kpi?.total_debt_m == null ? "—" : `${cash(kpi.total_debt_m)}M`}</strong></div>
            </div>
            <FinancialChart data={report.financials.quarterly} />
          {valuation?.error ? <p className="note">Valuation unavailable: {valuation.error}</p> : <p className="note">DCF implied difference to provider price: {num(valuation?.upside_pct)}%. {valuation?.methodology} Assumptions: growth {num((valuation?.assumptions?.growth_rate ?? 0) * 100)}%, discount {num((valuation?.assumptions?.discount_rate ?? 0) * 100)}%, terminal growth {num((valuation?.assumptions?.terminal_growth ?? 0) * 100)}%.</p>}
          </section>
        </div>

        <ScenarioLab ticker={company.ticker} report={report} valuation={report.valuation} quote={quote} news={news.data} auto={auto} />
        <FilingsPanel report={report} />
        <ResearchWorkbench report={report} quote={quote} />
        <ResearchMemo report={report} quote={quote} />

        <section className="panel report-section">
          <div className="panel-heading"><div><p className="eyebrow">MONITOR</p><h2>Recent company headlines</h2></div><span className="quiet-badge">PUBLIC RSS</span></div>
          {news.error && <p className="note">Headline update failed. {news.data ? "Showing the last successful snapshot." : "No headline snapshot is available."}</p>}
          {!news.data && !news.error && <div className="loading" role="status">Loading headlines…</div>}
          {news.data && (articles.length ? <div className="report-headlines">{articles.map((article) => <a className={headlinePriority(article.title) ? "news-important" : ""} href={article.url} target="_blank" rel="noopener noreferrer" key={article.id}><span>{article.publisher} · {stamp(article.publishedAt)}</span><strong>{article.title}</strong>{headlinePriority(article.title) && <small>POTENTIALLY IMPORTANT · {headlinePriority(article.title)}</small>}<ExternalLink size={15} /></a>)}</div> : <p className="note">No timestamped headlines found in the past seven days.</p>)}
          <p className="source">Red labels are headline-based attention cues, not verified event assessments. {news.data?.warning} {news.data ? `· Headlines fetched ${stamp(news.data.fetchedAt)}` : ""}</p>
        </section>

        <section className="report-provenance" aria-label="Sources and freshness">
          <h2>Sources & freshness</h2>
          <p><Clock3 size={14} /> Quote: {quote?.source || "unavailable"} · observation {stamp(quote?.asOf)} · fetched {stamp(quote?.fetchedAt)}</p>
          <p><Clock3 size={14} /> Statements: {report.financials.source} · fiscal period {report.as_of || "unavailable"} · fetched {stamp(report.fetched_at)}</p>
          <p><Clock3 size={14} /> Valuation fields: Yahoo Finance · report fetched {stamp(report.fetched_at)}</p>
          <p><Clock3 size={14} /> SEC EDGAR: {report.filings.status === "available" ? `XBRL and filings · report fetched ${stamp(report.fetched_at)}` : report.filings.reason}</p>
          <p><Clock3 size={14} /> Headlines: {news.data?.source || "unavailable"} · fetched {stamp(news.data?.fetchedAt)}</p>
          <small>Public feeds may be delayed or incomplete. Financial statements update when the issuer reports; automatic refresh checks for new data every five minutes while this page is visible. This report is research support, not investment advice.</small>
        </section>
      </div>}
    </div>
    </ExplainContext.Provider>
  );
}

function ScenarioLab({ ticker, report, valuation, quote, news, auto }: { ticker: string; report: AnalystSnapshot; valuation: AnalystSnapshot["valuation"]; quote?: Quote; news: NewsResponse | null; auto: boolean }) {
  const defaults = valuation.assumptions || { growth_rate: .05, discount_rate: .09, terminal_growth: .02 };
  const ratePct = (rate: number) => Math.round(rate * 1000) / 10;
  const [model, setModel] = useState({ growth: ratePct(defaults.growth_rate), discount: ratePct(defaults.discount_rate), terminal: ratePct(defaults.terminal_growth) });
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`zentai-model-${ticker}`) || "null");
      if (saved && [saved.growth, saved.discount, saved.terminal].every((x: unknown) => typeof x === "number" && Number.isFinite(x))) setModel(saved);
      else setModel({ growth: ratePct(defaults.growth_rate), discount: ratePct(defaults.discount_rate), terminal: ratePct(defaults.terminal_growth) });
    } catch {}
  }, [ticker, defaults.growth_rate, defaults.discount_rate, defaults.terminal_growth]);
  const update = (key: keyof typeof model, value: number) => {
    const next = { ...model, [key]: value };
    setModel(next);
    try { localStorage.setItem(`zentai-model-${ticker}`, JSON.stringify(next)); } catch {}
    window.dispatchEvent(new CustomEvent("zentai-model-change", { detail: ticker }));
  };
  const reset = () => {
    const next = { growth: ratePct(defaults.growth_rate), discount: ratePct(defaults.discount_rate), terminal: ratePct(defaults.terminal_growth) };
    setModel(next);
    try { localStorage.removeItem(`zentai-model-${ticker}`); } catch {}
    window.dispatchEvent(new CustomEvent("zentai-model-change", { detail: ticker }));
  };
  const base: ModelInputs = { freeCashFlowM: valuation.free_cash_flow_m || 0, sharesM: valuation.shares_outstanding_m || 0,
    growth: model.growth / 100, discount: model.discount / 100, terminal: model.terminal / 100 };
  const scenarios = challengeDcf(base, quote?.price ?? null).map(item => ({ ...item, note: item.name === "Bear" ? "Growth −5 pp, discount +1 pp" : item.name === "Bull" ? "Growth +5 pp, discount −1 pp" : "Your editable assumptions" }));
  const creditStress = stressCredit(report);
  return <><section className="panel report-section">
    <div className="panel-heading"><div><p className="eyebrow">EDITABLE EQUITY MODEL</p><h2>Valuation scenarios</h2></div><button className="button" onClick={reset}>Reset assumptions</button></div>
    {valuation.error || !valuation.free_cash_flow_m || !valuation.shares_outstanding_m ? <p className="note">Scenario model unavailable: {valuation.error || "Positive free cash flow and share count are required."}</p> : <>
      <p className="report-context">Starting inputs: free cash flow {cash(valuation.free_cash_flow_m)}M ÷ {num(valuation.shares_outstanding_m, 1)}M shares. Edit the base case; bear and bull cases move from it. Changes are saved in this browser.</p>
      <div className="model-controls">
        {([ ["growth", "Annual FCF growth", -50, 50], ["discount", "Discount rate", 0.1, 50], ["terminal", "Terminal growth", -10, 10] ] as const).map(([key, label, min, max]) => <label key={key}>{label} <Explain label={label}>{key === "growth" ? "Annual growth of free cash flow per share for years 1–5. The provider's revenue-growth estimate is the initial proxy." : key === "discount" ? "Required annual return used to discount projected cash flows and terminal value to today." : "Growth assumed after year 5 in the Gordon-growth terminal value. It must be below the discount rate."}</Explain><span><input type="number" min={min} max={max} step="0.1" value={model[key]} onChange={event => update(key, Number(event.target.value))} />%</span></label>)}
      </div>
      {!scenarios[1].result && <p className="notice error" role="alert">Use finite assumptions: growth −50% to 50%, discount above terminal growth and at most 50%.</p>}
      <div className="scenario-grid">{scenarios.map(({ name, input, result, note }) => <div className="scenario-card" key={name}>
        <span>{name} case <Explain label={`${name} case value`}>{result ? `FCF per share ${cash(base.freeCashFlowM / base.sharesM)} grows ${num(input.growth * 100)}% annually for five years. Each year is discounted at ${num(input.discount * 100)}%. The year-five cash flow grows ${num(input.terminal * 100)}% thereafter; terminal present value ${cash(result.terminalPresentValue)} is added to the five annual present values.` : "The current assumptions cannot produce a valid discounted cash flow result."}</Explain></span>
        <strong>{cash(result?.value)}</strong><small>{note}</small>
        <p>{result && quote?.price ? `${num((result.value / quote.price - 1) * 100)}% versus observed quote` : "Quote comparison unavailable"}</p>
      </div>)}</div>
      <div className="challenge-summary"><h3>Challenge the conclusion</h3><div className="challenge-grid"><div><span>Equity model versus quote</span><strong>{scenarios.every(item => item.aboveQuote === true) ? "Above in all cases" : scenarios.every(item => item.aboveQuote === false) ? "Below in all cases" : scenarios.some(item => item.aboveQuote == null) ? "Insufficient data" : "Changes with assumptions"}</strong><small>Bear, base, and bull values compared with the observed quote. This is not a buy/sell signal.</small></div><div><span>Balance-sheet concern under stress</span><strong>{creditStress ? `${report.credit.grade} → ${creditStress.grade}` : "Unavailable"}</strong><small>{creditStress ? `${creditStress.assumptions} Score ${num(report.credit.score)} → ${num(creditStress.score)}.` : "No eligible corporate credit screen to stress."}</small></div></div><p>Inspect the model and factor explanations before drawing a conclusion. Stress cases are deterministic illustrations, not forecasts or agency ratings.</p></div>
      <details className="report-method"><summary>See five-year base-case cash flow calculation</summary>{scenarios[1].result && <div className="table-scroll"><table><thead><tr><th>Year</th><th>Forecast FCF / share</th><th>Present value</th></tr></thead><tbody>{scenarios[1].result.years.map(row => <tr key={row.year}><td>{row.year}</td><td>{cash(row.forecast)}</td><td>{cash(row.presentValue)}</td></tr>)}<tr><td>Terminal</td><td>Year 5 × (1 + terminal growth) ÷ (discount − terminal growth)</td><td>{cash(scenarios[1].result?.terminalPresentValue)}</td></tr></tbody></table></div>}</details>
      <p className="note">Illustrative FCF-per-share model. Revenue growth is only a proxy for FCF growth; capital structure, dilution, cyclicality and terminal assumptions require analyst review. No investment recommendation is generated.</p>
    </>}
  </section><ValuationComparison report={report} quote={quote} news={news} dcfValue={scenarios[1].result?.value ?? null} auto={auto} /></>;
}

const filingFactLabels: Record<string, string> = {
  annual_revenue_m: "Annual revenue", annual_net_income_m: "Annual net income",
  annual_operating_cash_flow_m: "Annual operating cash flow", annual_capex_m: "Annual capital expenditure",
  cash_m: "Cash and equivalents", assets_m: "Total assets",
  current_debt_m: "Current portion of long-term debt", long_term_debt_m: "Long-term debt",
  bank_deposits_m: "Bank deposits", bank_loans_net_m: "Net loans and leases",
  bank_loan_allowance_m: "Loan loss allowance", equity_m: "Stockholders’ equity",
};

function BankReview({ report }: { report: AnalystSnapshot }) {
  const facts = report.filings.facts;
  const assets = facts.assets_m, equity = facts.equity_m;
  const loans = facts.bank_loans_net_m, allowance = facts.bank_loan_allowance_m;
  const samePeriod = (a?: typeof assets, b?: typeof assets) => !!a && !!b && a.period_end === b.period_end;
  const capital = samePeriod(assets, equity) && assets.value_m > 0 ? equity.value_m / assets.value_m * 100 : null;
  const reserve = samePeriod(loans, allowance) && loans.value_m > 0 ? allowance.value_m / loans.value_m * 100 : null;
  return <div className="bank-review"><h3>Bank-specific context <Explain label="Bank review">Deposits, loans, reserves, and equity use SEC XBRL tags. Ratios are calculated only when the source periods match. These are context, not a regulatory capital or issuer rating model.</Explain></h3><div className="credit-review-grid"><div><span>Equity / assets</span><strong>{capital == null ? "Unavailable" : `${num(capital, 2)}%`}</strong></div><div><span>Loan allowance / net loans</span><strong>{reserve == null ? "Unavailable" : `${num(reserve, 2)}%`}</strong></div><div><span>Deposits</span><strong>{facts.bank_deposits_m ? `${cash(facts.bank_deposits_m.value_m)}M` : "Unavailable"}</strong></div><div><span>Regulatory capital / asset quality</span><strong>Review filing</strong></div></div><p className="report-context">No bank concern band is issued. CET1 capital, nonperforming assets, funding concentration, and stress results require verified bank disclosures.</p></div>;
}

function FilingsPanel({ report }: { report: AnalystSnapshot }) {
  const filings = report.filings;
  return <section className="panel report-section">
    <div className="panel-heading"><div><p className="eyebrow">PRIMARY FILINGS</p><h2>SEC evidence & data quality</h2></div><span className="quiet-badge">EDGAR</span></div>
    {filings.status !== "available" ? <p className="note">{filings.reason} <a href={filings.cik ? `https://www.sec.gov/edgar/browse/?CIK=${filings.cik}` : `https://www.sec.gov/edgar/search/#/q=${encodeURIComponent(report.ticker)}`} target="_blank" rel="noopener noreferrer">Review SEC filings directly <ExternalLink size={13} /></a></p> : <>
      <p className="report-context">These are extracted XBRL facts, each with its own reporting period and taxonomy concept. They do not silently overwrite the market-data provider's figures.</p>
      <div className="filing-facts">{Object.entries(filings.facts).map(([key, fact]) => {
        const sourceUrl = fact.accession ? `https://www.sec.gov/Archives/edgar/data/${filings.cik}/${fact.accession.replaceAll("-", "")}/${fact.accession}-index.htm` : `https://www.sec.gov/edgar/browse/?CIK=${filings.cik}`;
        return <div className="filing-fact" key={key}><span>{filingFactLabels[key] || key} <Explain label={filingFactLabels[key] || key}>{fact.concept} from {fact.form}, period ending {fact.period_end}, filed {fact.filed || "date unavailable"}. This fact is extracted from the SEC filing in USD millions; open the original filing to verify context.</Explain></span><strong>{cash(fact.value_m)}M</strong><small>{fact.form} · {fact.period_end} · <a href={sourceUrl} target="_blank" rel="noopener noreferrer">Original filing <ExternalLink size={11} /></a></small></div>;
      })}</div>
      {!Object.keys(filings.facts).length && <p className="note">No mapped SEC XBRL facts were available for this issuer. Review the original filing.</p>}
      <div className="filing-links"><strong>Recent filings</strong>{filings.filings.map(item => <a key={item.accession} href={item.url} target="_blank" rel="noopener noreferrer">{item.form} · {item.filed} <ExternalLink size={13} /></a>)}</div>
      <p className="source">{filings.methodology}</p>
    </>}
    <div className="report-quality"><strong>Reconciliation checks</strong>{report.quality_checks.length ? report.quality_checks.map(check => <p key={check.metric}><span className={`quality-${check.status}`}>{check.status.replaceAll("_", " ")}</span> {check.metric}: {check.detail}</p>) : <p>No matching-period provider/SEC facts were available to reconcile. Figures require manual verification.</p>}</div>
  </section>;
}

function ResearchMemo({ report, quote }: { report: AnalystSnapshot; quote?: Quote }) {
  const [notes, setNotes] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const revision = [report.as_of, report.credit.score, report.filings.filings[0]?.accession, report.valuation.free_cash_flow_m, report.valuation.shares_outstanding_m, quote?.asOf, JSON.stringify(report.quality_checks)].join("|");
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`zentai-memo-${report.ticker}`) || "null");
      setNotes(saved?.notes || "");
      setReviewed(saved?.revision === revision && saved?.reviewed === true);
    } catch { setNotes(""); setReviewed(false); }
  }, [report.ticker, revision]);
  const save = (nextNotes: string, nextReviewed: boolean) => {
    setNotes(nextNotes); setReviewed(nextReviewed);
    try { localStorage.setItem(`zentai-memo-${report.ticker}`, JSON.stringify({ notes: nextNotes, reviewed: nextReviewed, revision })); } catch {}
  };
  useEffect(() => {
    const invalidate = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== report.ticker) return;
      setReviewed(false);
      try { localStorage.setItem(`zentai-memo-${report.ticker}`, JSON.stringify({ notes, reviewed: false, revision })); } catch {}
    };
    window.addEventListener("zentai-model-change", invalidate);
    return () => window.removeEventListener("zentai-model-change", invalidate);
  }, [report.ticker, notes, revision]);
  const downloadPacket = () => {
    let assumptions: unknown = report.valuation.assumptions || null;
    try { assumptions = JSON.parse(localStorage.getItem(`zentai-model-${report.ticker}`) || "null") || assumptions; } catch {}
    const packet = { schemaVersion: 1, generatedAt: new Date().toISOString(), model: "Zentai analyst screen v1", ticker: report.ticker,
      memo: { notes, reviewed, revision }, quote: quote ? { symbol: quote.symbol, price: quote.price, asOf: quote.asOf, fetchedAt: quote.fetchedAt, source: quote.source, feedLabel: quote.feedLabel } : null,
      assumptions, evidenceChecks: analystEvidenceChecks(report, quote), evidencePoints: researchPoints(report, quote), analystSnapshot: report };
    const url = URL.createObjectURL(new Blob([JSON.stringify(packet, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `zentai-evidence-${report.ticker}-${new Date().toISOString().slice(0, 10)}.json`; anchor.click(); URL.revokeObjectURL(url);
  };
  const risks = [
    report.credit.status !== "available" ? "Balance-sheet screen is not available for this issuer." : report.credit.factors?.filter(f => f.points < 55).map(f => `${f.name} is a weaker credit factor (${f.points}/100 points).`).join(" "),
    report.valuation.error ? "The valuation scenario lacks usable source inputs." : report.valuation.upside_pct != null && report.valuation.upside_pct < 0 ? "The Zentai DCF estimate is below the observed market price; assumptions need challenge." : "The valuation is sensitive to growth, discount and terminal assumptions.",
    report.filings.status !== "available" ? "Primary SEC filing facts are not yet connected." : "Debt covenants and a complete maturity schedule still need review in the original filing.",
  ].filter(Boolean);
  return <section className="panel report-section research-memo">
    <div className="panel-heading"><div><p className="eyebrow">RESEARCH WORKFLOW</p><h2>Evidence memo</h2></div><div className="report-actions"><span className="quiet-badge">DRAFT · HUMAN REVIEW</span><button className="button" onClick={downloadPacket}><FileDown size={15} /> Download evidence JSON</button></div></div>
    <p className="report-context">A structured draft from displayed facts, not a buy/sell call. Edit your notes and mark review complete when you have checked the underlying sources.</p>
    <div className="memo-grid"><div><h3>Observed evidence <Explain label="Memo evidence">Each line comes from the report's source-labeled fields. The memo does not infer facts from a headline alone.</Explain></h3><ul><li>{report.company} reported {report.financials.latest_kpis.revenue_m == null ? "unavailable" : `${cash(report.financials.latest_kpis.revenue_m)}M`} of revenue for {report.as_of || "an unavailable fiscal period"}.</li><li>Observed quote: {cash(quote?.price)} at {stamp(quote?.asOf)}.</li><li>Balance-sheet screen: {report.credit.grade || "not assessed"}{report.credit.score == null ? "" : ` (${num(report.credit.score)}/100)`}.</li><li>Zentai DCF scenario: {cash(report.valuation.intrinsic_value)} per share.</li></ul></div><div><h3>Challenges & open diligence</h3><ul>{risks.map((item, index) => <li key={index}>{item}</li>)}</ul></div></div>
    <label className="memo-notes">Analyst notes<textarea value={notes} onChange={event => save(event.target.value, false)} placeholder="Write your thesis, counterarguments, management questions, and source checks…" rows={5} /></label>
    <label className="memo-signoff"><input type="checkbox" checked={reviewed} onChange={event => save(notes, event.target.checked)} /> I reviewed the source figures and assumptions for this report revision.</label>
    <p className="source">{reviewed ? "Marked reviewed in this browser." : "Draft pending review."} Notes and review state stay in this browser; this is not institutional approval or a regulated recommendation.</p>
  </section>;
}
