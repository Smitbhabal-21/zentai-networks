import test from "node:test";
import assert from "node:assert/strict";
import { calculateDcf } from "../lib/valuation";

test("scenario changes are directional and invalid rates abstain", () => {
  const base = { freeCashFlowM: 1000, sharesM: 100, growth: .05, discount: .1, terminal: .02 };
  const normal = calculateDcf(base);
  assert.ok(normal && Number.isFinite(normal.value));
  assert.ok(calculateDcf({ ...base, growth: .1 })!.value > normal.value);
  assert.ok(calculateDcf({ ...base, discount: .12 })!.value < normal.value);
  assert.equal(calculateDcf({ ...base, discount: .02 }), null);
  assert.equal(calculateDcf({ ...base, freeCashFlowM: 0 }), null);
});
