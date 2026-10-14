import test from "node:test";
import assert from "node:assert/strict";
import { matchFilingsToHistory, matchNewsToHistory, summarizeHistory } from "../lib/chart-context";
import type { Article, Quote } from "../lib/types";

const points: Quote["history"] = [
  { date: "2026-10-09T20:00:00Z", close: 100, volume: 1 },
  { date: "2026-10-12T20:00:00Z", close: 110, volume: 1 },
  { date: "2026-10-13T20:00:00Z", close: 99, volume: 1 },
];
const article = (id: string, publishedAt: string): Article => ({ id, publishedAt, title: id, url: "https://example.com", publisher: "Example", source: "Test" });

test("history summary shows observed return, largest adjacent move, and peak-to-trough drawdown", () => {
  const summary = summarizeHistory(points)!;
  assert.ok(Math.abs(summary.periodPercent + 1) < 1e-9);
  assert.ok(Math.abs(Math.abs(summary.largestMove.percent) - 10) < 1e-9);
  assert.ok(Math.abs(summary.maxDrawdownPercent - 10) < 1e-9);
  assert.equal(summarizeHistory(points.slice(0, 1)), null);
});

test("news before the close maps to that observation; after-close news maps to the next", () => {
  const result = matchNewsToHistory(points, [
    article("before", "2026-10-12T18:00:00Z"),
    article("after", "2026-10-12T21:00:00Z"),
    article("awaiting", "2026-10-13T21:00:00Z"),
  ]);
  assert.equal(result[0].observation?.close, 110);
  assert.ok(Math.abs(result[0].movePercent! - 10) < 1e-9);
  assert.equal(result[1].observation?.close, 99);
  assert.ok(Math.abs(result[1].movePercent! + 10) < 1e-9);
  assert.equal(result[2].observation, null);
  assert.equal(result[2].movePercent, null);
});

test("filing date aligns with the next available observed trading point", () => {
  const result = matchFilingsToHistory(points, [{ filed: "2026-10-10", form: "8-K" }, { filed: "2026-10-13", form: "10-Q" }]);
  assert.deepEqual(result.map(item => [item.filing.form, item.observation.close]), [["8-K", 110], ["10-Q", 99]]);
});
