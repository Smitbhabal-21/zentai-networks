import test from "node:test";
import assert from "node:assert/strict";
import { headlinePriority } from "../lib/news-priority";

test("flags specific corporate events, not generic market commentary", () => {
  assert.equal(headlinePriority("Acme cuts full-year guidance after weak quarter"), "Guidance change");
  assert.equal(headlinePriority("Acme to acquire Beta in $3 billion deal"), "Major transaction");
  assert.equal(headlinePriority("SEC investigates Acme accounting"), "Regulatory action");
  assert.equal(headlinePriority("Tesla beat delivery estimates by 25,000 vehicles"), "Reported result");
  assert.equal(headlinePriority("Why investors are watching Acme earnings"), null);
  assert.equal(headlinePriority("Analyst discusses possible merger scenarios"), null);
});
