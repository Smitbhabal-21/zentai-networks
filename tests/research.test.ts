import test from "node:test";
import assert from "node:assert/strict";
import { challengeDcf, compareRevisions, evaluateForecast, stressCredit, type Forecast, type ResearchRevision } from "../lib/research";
import type { AnalystSnapshot } from "../lib/types";

test("revision diff includes new and removed filing facts without treating missing as zero", () => {
  const first: ResearchRevision = { capturedAt: "2026-01-01", period: "2025-12-31", filing: "a", grade: "BBB", points: [
    { key: "cash", label: "Cash", value: 10, unit: "USD M", source: "provider", period: "2025-12-31", url: null, formula: "reported" },
    { key: "sec-debt", label: "SEC debt", value: 5, unit: "USD M", source: "SEC", period: "2025-12-31", url: null, formula: "reported" },
  ] };
  const second: ResearchRevision = { ...first, filing: "b", points: [
    { ...first.points[0], value: 12 },
    { ...first.points[1], key: "sec-revenue", label: "SEC revenue", value: 20 },
  ] };
  assert.deepEqual(compareRevisions(first, second).map(item => [item.key, item.before, item.after]), [
    ["cash", 10, 12], ["sec-revenue", null, 20], ["sec-debt", 5, null],
  ]);
});

test("challenge cases change the value conclusion when assumptions matter", () => {
  const result = challengeDcf({ freeCashFlowM: 1000, sharesM: 100, growth: .05, discount: .1, terminal: .02 }, 140);
  assert.ok(result[0].result!.value < result[1].result!.value);
  assert.ok(result[1].result!.value < result[2].result!.value);
  assert.equal(result[0].aboveQuote, false);
  assert.equal(result[2].aboveQuote, true);
});

test("credit stress recomputes score and never claims a bank tier", () => {
  const report: AnalystSnapshot = { company: "Test", ticker: "TEST", industry: "Technology", as_of: "2025-12-31", fetched_at: "2026-01-01",
    credit: { status: "available", grade: "A", score: 70, caveat: "Internal", metrics: { debt_to_assets: .3, ttm_ebitda_m: 100 } },
    financials: { latest_kpis: { total_debt_m: 200, cash_m: 50 }, quarterly: [], source: "Provider" },
    valuation: {}, filings: { status: "unavailable", cik: 0, facts: {}, filings: [] }, quality_checks: [] };
  const stressed = stressCredit(report)!;
  assert.ok(stressed.score < report.credit.score!);
  assert.equal(stressed.assumptions.includes("EBITDA −20%"), true);
  report.credit.status = "not_applicable";
  assert.equal(stressCredit(report), null);
});

test("prediction scores only an eligible close after the due date", () => {
  const record: Forecast = { id: "a", ticker: "AAPL", createdAt: "2025-01-01T00:00:00Z", dueAt: "2025-02-01T00:00:00Z", predictedPrice: 120,
    startingPrice: 100, quoteAsOf: "2025-01-01T00:00:00Z", grade: "A", scenario: { freeCashFlowM: 1, sharesM: 1, growth: .05, discount: .1, terminal: .02 } };
  assert.equal(evaluateForecast(record, [{ date: "2025-01-31T00:00:00Z", close: 115, volume: null }]).result, undefined);
  const scored = evaluateForecast(record, [{ date: "2025-02-03T00:00:00Z", close: 110, volume: null }]);
  assert.equal(scored.result?.observedPrice, 110);
  assert.equal(scored.result?.directionCorrect, true);
  assert.ok(Math.abs(scored.result!.absolutePercentError - 9.09) < .01);
});
