import test from "node:test";
import assert from "node:assert/strict";
import { demoModel, MONTHS, UNITS, CATEGORIES } from "../lib/fpa";
import { applyFpaCsv, parseFpaCsv, suggestedAccountMap } from "../lib/fpa-import";

function fullCsv() {
  const model = demoModel();
  const lines = ["month,unit,account,currency,kind,amount"];
  for (const month of MONTHS) {
    for (const unit of UNITS) for (const category of CATEGORIES) {
      const currency = model.drivers.find(driver => driver.unit === unit)!.currency;
      lines.push(`${month},${unit},${category},${currency},budget,100`);
      if (month === "2026-01") lines.push(`${month},${unit},${category},${currency},actual,110`);
    }
    lines.push(`${month},Shared services,SHARED,USD,budget,25`);
    if (month === "2026-01") lines.push(`${month},Shared services,SHARED,USD,actual,30`);
  }
  return lines.join("\n");
}

test("CSV import maps accounts, reconciles source totals, and leaves absent actuals pending", () => {
  const entries = parseFpaCsv(fullCsv());
  const model = applyFpaCsv(demoModel(), entries, suggestedAccountMap(entries), "ledger.csv", "2026-01-01T00:00:00Z");
  assert.equal(model.dataSource, "imported");
  assert.equal(model.importMeta?.sourceRows, entries.length);
  assert.deepEqual(model.importMeta?.budgetTotalsByCurrency, { USD: 3900, EUR: 3600, GBP: 3600 });
  assert.deepEqual(model.importMeta?.actualTotalsByCurrency, { USD: 360, EUR: 330, GBP: 330 });
  assert.equal(model.rows.find(row => row.month === "2026-02")?.actual, null);
  assert.equal(model.sharedActuals["2026-02"], null);
  assert.equal(model.close.length, 0);
});

test("CSV import rejects missing budget coverage and currency mismatches", () => {
  const entries = parseFpaCsv(fullCsv());
  assert.throws(() => applyFpaCsv(demoModel(), entries.slice(1), suggestedAccountMap(entries), "partial.csv"), /coverage is incomplete/);
  const wrong = entries.map((entry, index) => index === 0 ? { ...entry, currency: "GBP" as const } : entry);
  assert.throws(() => applyFpaCsv(demoModel(), wrong, suggestedAccountMap(wrong), "wrong.csv"), /expects USD/);
});

test("CSV parser preserves quoted account codes and rejects negative amounts", () => {
  const parsed = parseFpaCsv('month,unit,account,currency,kind,amount\n2026-01,North America,"Payroll, US",USD,budget,12.50');
  assert.equal(parsed[0].account, "Payroll, US");
  assert.throws(() => parseFpaCsv('month,unit,account,currency,kind,amount\n2026-01,North America,People,USD,budget,-12'), /nonnegative/);
  assert.equal(suggestedAccountMap(parsed)["Payroll, US"], "");
  assert.throws(() => applyFpaCsv(demoModel(), parsed, suggestedAccountMap(parsed), "unmapped.csv"), /no category mapping/);
});
