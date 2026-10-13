import test from "node:test";
import assert from "node:assert/strict";
import { buildMultipleBasis, marketMultiples, multipleValues } from "../lib/valuation-models";
import type { AnalystSnapshot } from "../lib/types";

const report: AnalystSnapshot = {
  company: "Example", ticker: "EX", industry: "Technology", as_of: "2025-12-31", fetched_at: "2026-01-01",
  financials: { source: "Test", quarterly: ["2025-03-31", "2025-06-30", "2025-09-30", "2025-12-31"].map(period => ({ period, revenue_m: 100, ebitda_m: 20, net_income_m: 10 })), latest_kpis: { cash_m: 50, total_debt_m: 150 } },
  valuation: { shares_outstanding_m: 100 }, credit: { status: "insufficient", grade: null, score: null, caveat: "" },
  filings: { status: "unavailable", cik: 0, facts: {}, filings: [] }, quality_checks: [],
};

test("four-quarter multiples reconcile to a market-anchored quote and respond to edits", () => {
  const basis = buildMultipleBasis(report);
  assert.deepEqual(basis.ttm, { revenue: 400, ebitda: 80, netIncome: 40 });
  const market = marketMultiples(basis, 10, false);
  assert.deepEqual(market, { pe: 25, evEbitda: 13.75, ps: 2.5 });
  const atMarket = multipleValues(basis, { pe: 25, evEbitda: 13.75, ps: 2.5 }, false);
  assert.deepEqual(atMarket, { pe: 10, evEbitda: 10, ps: 10 });
  assert.deepEqual(multipleValues(basis, { pe: 20, evEbitda: 10, ps: 2 }, false), { pe: 8, evEbitda: 7, ps: 8 });
});

test("missing and nonconsecutive quarters abstain; bank operating multiples are withheld", () => {
  const gap = { ...report, financials: { ...report.financials, quarterly: report.financials.quarterly.map((row, index) => index === 1 ? { ...row, period: "2024-06-30" } : row) } };
  assert.equal(buildMultipleBasis(gap).ttm.revenue, null);
  const basis = buildMultipleBasis(report);
  assert.deepEqual(multipleValues(basis, { pe: 25, evEbitda: 13.75, ps: 2.5 }, true), { pe: 10, evEbitda: null, ps: null });
  assert.equal(multipleValues(basis, { pe: 0, evEbitda: 10, ps: 2 }, false).pe, null);
  const loss = { ...report, financials: { ...report.financials, quarterly: report.financials.quarterly.map(row => ({ ...row, net_income_m: -10 })) } };
  assert.equal(multipleValues(buildMultipleBasis(loss), { pe: 10, evEbitda: 10, ps: 2 }, false).pe, null);
});
