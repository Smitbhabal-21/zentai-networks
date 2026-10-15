import { test } from "node:test";
import assert from "node:assert/strict";
import { signalHistory, signalTransitions } from "../lib/signal-map";

test("signal score uses prior observations and exposes its factor arithmetic", () => {
  const history = Array.from({ length: 45 }, (_, i) => ({ date: new Date(Date.UTC(2026, 0, i + 1)).toISOString(), close: 100 + i, volume: i === 44 ? 300 : 100 }));
  const series = signalHistory(history);
  const latest = series.at(-1)!;
  assert.equal(latest.state, "Bullish");
  assert.equal(latest.score, latest.factors.reduce((sum, factor) => sum + factor.contribution, 0));
  assert.equal(latest.relativeVolume, 3);
  assert.equal(latest.factors[4].contribution, 1);
  assert.equal(series.length, 16);
});

test("flat or incomplete prices never produce a confident direction", () => {
  const history = Array.from({ length: 35 }, (_, i) => ({ date: new Date(Date.UTC(2026, 0, i + 1)).toISOString(), close: i === 34 ? NaN : 100, volume: null }));
  const latest = signalHistory(history).at(-1)!;
  assert.equal(latest.state, "Mixed");
  assert.equal(latest.score, 0);
  assert.equal(latest.relativeVolume, null);
  assert.deepEqual(signalTransitions(signalHistory(history)), []);
});
