import test from "node:test";
import assert from "node:assert/strict";
import { normalizeChart, normalizeArticles, safeUrl } from "../lib/normalize";
const now = new Date("2026-09-22T18:00:00Z");
const chart = {
  chart: {
    result: [
      {
        meta: {
          regularMarketPrice: 110,
          regularMarketTime: now.getTime() / 1000,
          currency: "USD",
          chartPreviousClose: 50,
        },
        timestamp: [now.getTime() / 1000],
        indicators: { quote: [{ close: [110], volume: [100] }] },
      },
    ],
  },
};
test("long-range chart baseline is never used as daily change", () => {
  assert.equal(normalizeChart(chart, "AAPL", now).changePercent, null);
  assert.equal(
    normalizeChart({ ...chart, _dailyPrevious: 100 }, "AAPL", now).change,
    10,
  );
});
test("invalid and future quotes are rejected", () => {
  assert.throws(() => normalizeChart({}, "AAPL", now));
  assert.throws(() => normalizeChart(chart, "AAPL", new Date("2026-09-21")));
});
test("news rejects unsafe URLs, future dates, old articles, and duplicates", () => {
  const raw = [
    {
      title: "Apple results",
      link: "https://example.com/1",
      pubDate: now.toISOString(),
    },
    {
      title: "Apple results!",
      link: "https://example.com/2",
      pubDate: now.toISOString(),
    },
    { title: "bad", link: "javascript:alert(1)", pubDate: now.toISOString() },
    { title: "undated", link: "https://example.com/3" },
    { title: "old", link: "https://example.com/4", pubDate: "2020-01-01" },
    { title: "future", link: "https://example.com/5", pubDate: "2027-01-01" },
  ];
  const articles = normalizeArticles(raw, "test", now);
  assert.equal(articles.length, 1);
  assert.equal(articles[0].title, "Apple results");
  assert.equal(safeUrl("data:text/html,hello"), null);
});
