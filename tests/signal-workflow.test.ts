import assert from "node:assert/strict";
import test from "node:test";
import type { SignalObservation } from "../lib/signal-map";
import { closedOptionPnl, watchedLevel } from "../lib/signal-workflow";

const point = (close: number, state: SignalObservation["state"]): SignalObservation => ({
  date: "2026-10-15", close, state, score: state === "Bullish" ? 2 : state === "Bearish" ? -2 : 0,
  average10: close, average30: close, return20: 0, dayReturn: 0, relativeVolume: null, factors: [],
});

test("breakout level uses ten prior observations and excludes the latest close", () => {
  const history = Array.from({ length: 10 }, (_, index) => point(100 + index, "Mixed"));
  assert.deepEqual(watchedLevel([...history, point(120, "Bullish")]), { side: "call", level: 109, crossed: true, date: "2026-10-15" });
  assert.deepEqual(watchedLevel([...history, point(95, "Bearish")]), { side: "put", level: 100, crossed: true, date: "2026-10-15" });
  assert.equal(watchedLevel([...history, point(105, "Mixed")]), null);
  assert.equal(watchedLevel(history), null);
});

test("journal gross P/L uses manually supplied fills and rejects invalid quantities", () => {
  assert.equal(closedOptionPnl(5, 7.5, 2, 100), 500);
  assert.equal(closedOptionPnl(5, 2, 1, 100), -300);
  assert.equal(closedOptionPnl(5, 2, 0, 100), null);
});
