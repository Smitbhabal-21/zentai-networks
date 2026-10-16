import { test } from "node:test";
import assert from "node:assert/strict";
import fallback from "../lib/ivv-fallback.json";
import { parseIvvCsv } from "../lib/ivv-universe";

test("the saved IVV universe covers the broad market without duplicate symbols", () => {
  assert.ok(fallback.holdings.length >= 500);
  assert.equal(new Set(fallback.holdings.map(item => item.ticker)).size, fallback.holdings.length);
  assert.ok(fallback.holdings.some(item => item.ticker === "AAPL"));
  assert.ok(fallback.holdings.some(item => item.ticker === "BRK-B"));
});

test("holdings parser keeps quoted names and excludes non-stock lines", () => {
  const rows = Array.from({ length: 450 }, (_, index) => `"T${index}","Company, ${index}","Industrials","Equity","1","0.01","1","1","12.50","United States","NYSE"`);
  const csv = ["iShares Core S&P 500 ETF", 'Fund Holdings as of,"Oct 14, 2026"', "Ticker,Name,Sector,Asset Class,Market Value,Weight (%),Notional Value,Quantity,Price,Location,Exchange", ...rows, '"WRT","TEST WARRANT","Industrials","Equity","1","0","1","1","1","United States","NYSE"', '"CASH","Cash","Cash","Cash","1","0","1","1","1","United States","NYSE"'].join("\n");
  const parsed = parseIvvCsv(csv);
  assert.equal(parsed.asOf, "2026-10-14");
  assert.equal(parsed.holdings.length, 450);
  assert.equal(parsed.holdings[0].name, "Company, 0");
  assert.equal(parsed.holdings[0].price, 12.5);
});
