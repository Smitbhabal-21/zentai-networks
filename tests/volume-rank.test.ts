import test from "node:test";
import assert from "node:assert/strict";
import { rankVolume } from "../lib/volume-rank";

const row = (ticker: string, day: string, volume: number | null, relativeVolume: number | null) => ({
  company: { ticker, name: ticker },
  summary: { observedAt: `${day}T20:00:00.000Z`, volume, relativeVolume, dayReturn: 1, source: "Yahoo Finance" },
});

test("volume ranks compare only the latest session and keep high and low lists distinct", () => {
  const rows = [row("OLD", "2026-10-14", 999_999, 9), ...Array.from({ length: 24 }, (_, index) => row(`C${String(index).padStart(2, "0")}`, "2026-10-15", (index + 1) * 100, (index + 1) / 10))];
  const ranking = rankVolume(rows, "relative");
  assert.equal(ranking.session, "2026-10-15");
  assert.equal(ranking.eligible, 24);
  assert.equal(ranking.high.length, 10);
  assert.equal(ranking.low.length, 10);
  assert.equal(ranking.high[0].company.ticker, "C23");
  assert.equal(ranking.low[0].company.ticker, "C00");
  assert.equal(new Set([...ranking.high, ...ranking.low].map(item => item.company.ticker)).size, 20);
});

test("volume ranks omit missing measures and never reuse a company in short lists", () => {
  const rows = [row("A", "2026-10-15", 1000, 2), row("B", "2026-10-15", 900, null), row("C", "2026-10-15", 800, 1)];
  const relative = rankVolume(rows, "relative");
  assert.deepEqual(relative.high.map(item => item.company.ticker), ["A"]);
  assert.deepEqual(relative.low.map(item => item.company.ticker), ["C"]);
  const shares = rankVolume(rows, "shares");
  assert.deepEqual(shares.high.map(item => item.company.ticker), ["A", "B"]);
  assert.deepEqual(shares.low.map(item => item.company.ticker), ["C"]);
});
