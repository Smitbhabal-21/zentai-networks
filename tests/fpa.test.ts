import assert from "node:assert/strict";
import test from "node:test";
import { allocationRows, closeChecks, demoModel, forecast, monthlyTotals, validImport, variancePercent } from "../lib/fpa";

test("a month stays pending until every actual, including shared services, is entered", () => {
  const model = demoModel();
  assert.equal(monthlyTotals(model).find(point => point.month === "2026-09")?.complete, true);
  assert.equal(monthlyTotals(model).find(point => point.month === "2026-10")?.actual, null);
  model.sharedActuals["2026-09"] = null;
  assert.equal(monthlyTotals(model).find(point => point.month === "2026-09")?.actual, null);
  assert.equal(closeChecks(model, "2026-09")[0].ok, false);
  model.sharedActuals["2026-09"] = 80000;
  assert.equal(closeChecks(model, "2026-09").every(check => check.ok), true);
});

test("expense variance reports overspend as positive and avoids division by zero", () => {
  assert.equal(variancePercent(110, 100), 10);
  assert.equal(variancePercent(90, 100), -10);
  assert.equal(variancePercent(90, 0), null);
});

test("allocations reconcile for each driver and flag a zero-weight rule", () => {
  const model = demoModel();
  for (const basis of ["Headcount", "Budget", "Fixed"] as const) {
    model.allocation = basis;
    assert.ok(Math.abs(allocationRows(model, "2026-09").reduce((sum, row) => sum + row.amount, 0) - model.sharedPool) < 0.01);
  }
  model.fixedWeights = { "North America": 0, Europe: 0, "United Kingdom": 0 };
  assert.equal(closeChecks(model, "2026-09")[3].ok, false);
});

test("forecast responds to headcount and scenario changes over 36 months", () => {
  const model = demoModel();
  const base = forecast(model);
  assert.equal(base.length, 36);
  assert.equal(base[0].month, "2026-10");
  assert.equal(base.at(-1)?.month, "2029-09");
  model.drivers[0].hires = 5;
  assert.ok(forecast(model)[11].total > base[11].total);
  model.scenario = "Downside";
  assert.ok(forecast(model)[0].total > base[0].total);
});

test("import accepts an exported model but rejects missing shared actuals and invalid FX", () => {
  const exported = JSON.parse(JSON.stringify(demoModel()));
  assert.equal(validImport(exported), true);
  delete exported.sharedActuals;
  assert.equal(validImport(exported), false);
  exported.sharedActuals = demoModel().sharedActuals;
  exported.fx.EUR = 0;
  assert.equal(validImport(exported), false);
});
