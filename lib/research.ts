import { calculateDcf, type ModelInputs } from "./valuation";
import type { AnalystSnapshot, Quote } from "./types";

export type ResearchPoint = { key: string; label: string; value: number | null; unit: string; source: string; period: string; url: string | null; formula: string };
export type ResearchRevision = { capturedAt: string; period: string | null; filing: string | null; grade: string | null; points: ResearchPoint[] };
export type ResearchChange = { key: string; label: string; before: number | null; after: number | null; unit: string; source: string; url: string | null };
export type Forecast = { id: string; ticker: string; createdAt: string; dueAt: string; predictedPrice: number; startingPrice: number; quoteAsOf: string; grade: string | null; scenario: ModelInputs; result?: { observedPrice: number; observedAt: string; absolutePercentError: number; directionCorrect: boolean } };

const secUrl = (report: AnalystSnapshot, accession?: string) => accession
  ? `https://www.sec.gov/Archives/edgar/data/${report.filings.cik}/${accession.replaceAll("-", "")}/${accession}-index.htm`
  : `https://www.sec.gov/edgar/browse/?CIK=${report.filings.cik}`;
const yahooUrl = (ticker: string, page: string) => `https://finance.yahoo.com/quote/${encodeURIComponent(ticker)}/${page}/`;

export function researchPoints(report: AnalystSnapshot, quote?: Quote): ResearchPoint[] {
  const k = report.financials.latest_kpis;
  const facts = report.filings.facts;
  const provider = report.financials.source;
  const period = report.as_of || "Unknown fiscal period";
  const point = (key: string, label: string, value: number | null | undefined, unit: string, formula: string, page: string): ResearchPoint => ({
    key, label, value: typeof value === "number" && Number.isFinite(value) ? value : null,
    unit, formula, source: provider, period, url: yahooUrl(report.ticker, page),
  });
  const rows: ResearchPoint[] = [
    { key: "quote", label: "Market price", value: quote?.price ?? null, unit: "USD/share", source: quote?.source || "Quote unavailable", period: quote?.asOf || "Unknown quote time", url: yahooUrl(report.ticker, "chart"), formula: "Latest provider observation; may be delayed." },
    point("revenue", "Quarterly revenue", k.revenue_m, "USD M", "Reported quarterly income-statement revenue.", "financials"),
    point("ebitda", "Quarterly EBITDA", k.ebitda_m, "USD M", "Reported quarterly EBITDA.", "financials"),
    point("cash", "Cash and equivalents", k.cash_m, "USD M", "Latest provider balance-sheet cash; compare the separately dated SEC fact.", "balance-sheet"),
    point("debt", "Total debt", k.total_debt_m, "USD M", "Latest provider balance-sheet total debt.", "balance-sheet"),
  ];
  for (const [key, fact] of Object.entries(facts)) rows.push({
    key: `sec-${key}`, label: `SEC ${key.replaceAll("_m", "").replaceAll("_", " ")}`,
    value: fact.value_m, unit: "USD M", source: `${fact.form} · ${fact.concept}`,
    period: fact.period_end, url: secUrl(report, fact.accession), formula: `Reported XBRL fact filed ${fact.filed || "date unavailable"}; filing context controls.`,
  });
  rows.push({ key: "credit", label: "Internal credit score", value: report.credit.score, unit: "/100", source: provider, period,
    url: yahooUrl(report.ticker, "balance-sheet"), formula: report.credit.status === "available"
      ? `${report.credit.factors?.map(f => `${f.points} × ${Math.round(f.weight * 100)}% (${f.name})`).join(" + ")} = ${report.credit.score}. Grade ${report.credit.grade} uses fixed bands; not an agency rating.`
      : report.credit.reason || "Insufficient inputs." });
  rows.push({ key: "dcf", label: "Zentai DCF estimate", value: report.valuation.intrinsic_value ?? null, unit: "USD/share", source: "Yahoo Finance inputs · Zentai model", period: report.fetched_at,
    url: yahooUrl(report.ticker, "cash-flow"), formula: `Five years of FCF per share plus discounted terminal value. FCF ${report.valuation.free_cash_flow_m ?? "?"}M ÷ shares ${report.valuation.shares_outstanding_m ?? "?"}M; growth ${report.valuation.assumptions?.growth_rate ?? "?"}, discount ${report.valuation.assumptions?.discount_rate ?? "?"}, terminal growth ${report.valuation.assumptions?.terminal_growth ?? "?"}.` });
  return rows;
}

export function revisionOf(report: AnalystSnapshot, quote?: Quote): ResearchRevision {
  return { capturedAt: new Date().toISOString(), period: report.as_of, filing: report.filings.filings[0]?.accession || null,
    grade: report.credit.grade, points: researchPoints(report, quote) };
}

export function compareRevisions(before: ResearchRevision, after: ResearchRevision): ResearchChange[] {
  const previous = new Map(before.points.map(point => [point.key, point]));
  const current = new Map(after.points.map(point => [point.key, point]));
  const changes = after.points.flatMap(point => {
    const old = previous.get(point.key);
    if ((!old && point.value == null) || old?.value === point.value) return [];
    return [{ key: point.key, label: point.label, before: old?.value ?? null, after: point.value, unit: point.unit, source: point.source, url: point.url }];
  });
  for (const old of before.points) if (!current.has(old.key) && old.value != null) changes.push({ key: old.key, label: old.label, before: old.value, after: null, unit: old.unit, source: old.source, url: old.url });
  return changes;
}

export function challengeDcf(base: ModelInputs, quotePrice: number | null) {
  const variants = [
    { name: "Bear", input: { ...base, growth: Math.max(-.5, base.growth - .05), discount: Math.min(.5, base.discount + .01) } },
    { name: "Base", input: base },
    { name: "Bull", input: { ...base, growth: Math.min(.5, base.growth + .05), discount: Math.max(base.terminal + .001, base.discount - .01) } },
  ];
  return variants.map(({ name, input }) => {
    const result = calculateDcf(input);
    return { name, input, result, aboveQuote: result && quotePrice && quotePrice > 0 ? result.value > quotePrice : null };
  });
}

export function stressCredit(report: AnalystSnapshot) {
  if (report.credit.status !== "available") return null;
  const debt = report.financials.latest_kpis.total_debt_m;
  const cash = report.financials.latest_kpis.cash_m;
  const debtAssets = report.credit.metrics?.debt_to_assets;
  const ebitda = report.credit.metrics?.ttm_ebitda_m;
  if (debt == null || cash == null || debtAssets == null || ebitda == null || ebitda <= 0 || debt < 0 || cash < 0 || debtAssets < 0 || debtAssets > 1) return null;
  const shockedDebt = debt * 1.2, shockedCash = cash * .8, shockedEbitda = ebitda * .8;
  const assets = debtAssets > 0 ? debt / debtAssets : null;
  const nextDebtAssets = assets && assets > 0 ? Math.min(1, shockedDebt / assets) : 0;
  const leverage = Math.max(0, shockedDebt - shockedCash) / shockedEbitda;
  const cashDebt = shockedDebt > 0 ? shockedCash / shockedDebt : Infinity;
  const points = (value: number, thresholds: [number, number][]) => thresholds.find(([upper]) => value <= upper)?.[1] ?? thresholds.at(-1)![1];
  const p1 = points(leverage, [[0, 100], [1, 90], [2, 75], [3, 60], [4, 45], [6, 25], [Infinity, 5]]);
  const p2 = points(nextDebtAssets, [[.1, 95], [.25, 80], [.4, 65], [.55, 50], [.7, 30], [1, 10]]);
  const p3 = shockedDebt === 0 ? 100 : points(cashDebt, [[.1, 15], [.25, 35], [.5, 55], [1, 75], [Infinity, 95]]);
  const score = Math.round((p1 * .45 + p2 * .3 + p3 * .25) * 10) / 10;
  const grade = ([[85, "AAA"], [75, "AA"], [65, "A"], [55, "BBB"], [45, "BB"], [35, "B"], [0, "CCC"]] as const).find(([minimum]) => score >= minimum)![1];
  return { score, grade, factors: { leverage, debtAssets: nextDebtAssets, cashDebt }, points: [p1, p2, p3],
    assumptions: "EBITDA −20%, cash −20%, debt +20%; assets held constant." };
}

export function evaluateForecast(forecast: Forecast, history: Quote["history"]): Forecast {
  if (forecast.result || Date.now() < Date.parse(forecast.dueAt)) return forecast;
  const due = forecast.dueAt.slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const close = history.filter(row => row.date.slice(0, 10) >= due && row.date.slice(0, 10) < today && row.date.slice(0, 10) <= new Date(Date.parse(due) + 7 * 86400000).toISOString().slice(0, 10) && Number.isFinite(row.close) && row.close > 0)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  if (!close) return forecast;
  return { ...forecast, result: { observedPrice: close.close, observedAt: close.date,
    absolutePercentError: Math.abs(forecast.predictedPrice - close.close) / close.close * 100,
    directionCorrect: Math.sign(forecast.predictedPrice - forecast.startingPrice) === Math.sign(close.close - forecast.startingPrice) } };
}
