import { test } from "node:test";
import assert from "node:assert/strict";
import { expirationProfit, optionResult, type OptionInputs } from "../lib/options-lab";

const input: OptionInputs = { spot: 100, longStrike: 100, longAsk: 6, shortStrike: 110, shortBid: 2, contracts: 1, multiplier: 100 };

test("long call loss is premium and break-even includes premium", () => {
  assert.deepEqual(optionResult("long-call", input), { debitPerShare: 6, maxLoss: 600, maxGain: null, breakEven: 106, capitalAtRiskPct: 6 });
  assert.equal(expirationProfit("long-call", input, 90), -600);
  assert.equal(expirationProfit("long-call", input, 106), 0);
  assert.equal(expirationProfit("long-call", input, 120), 1400);
});

test("debit call spread has capped gain and loss", () => {
  assert.deepEqual(optionResult("bull-call-spread", input), { debitPerShare: 4, maxLoss: 400, maxGain: 600, breakEven: 104, capitalAtRiskPct: 4 });
  assert.equal(expirationProfit("bull-call-spread", input, 90), -400);
  assert.equal(expirationProfit("bull-call-spread", input, 104), 0);
  assert.equal(expirationProfit("bull-call-spread", input, 120), 600);
});

test("invalid or non-debit spreads are withheld", () => {
  assert.equal(optionResult("bull-call-spread", { ...input, shortStrike: 99 }), null);
  assert.equal(optionResult("bull-call-spread", { ...input, shortBid: 7 }), null);
  assert.equal(optionResult("long-call", { ...input, contracts: 0 }), null);
});
