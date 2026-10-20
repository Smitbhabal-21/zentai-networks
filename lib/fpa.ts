export type Currency = "USD" | "EUR" | "GBP";
export type Expense = "People" | "Technology" | "Vendors";
export type Unit = "North America" | "Europe" | "United Kingdom";
export type Scenario = "Base" | "Upside" | "Downside";
export type LedgerRow = { id: string; month: string; unit: Unit; category: Expense; currency: Currency; budget: number; actual: number | null };
export type Driver = { unit: Unit; currency: Currency; fte: number; hires: number; exits: number; annualPay: number; benefits: number; technology: number; vendors: number };
export type AuditEntry = { at: string; action: string; detail: string };
export type CloseEntry = { month: string; check: string; reviewer: string; note: string; at: string };
export type FpaModel = {
  version: 1;
  dataSource?: "demo" | "imported";
  importMeta?: { importedAt: string; fileName: string; sourceRows: number; budgetTotalsByCurrency: Record<Currency, number>; actualTotalsByCurrency: Record<Currency, number>; accountMap: Record<string, Expense | "Shared services" | ""> };
  rows: LedgerRow[];
  drivers: Driver[];
  fx: Record<Currency, number>;
  sharedPool: number;
  sharedActuals: Record<string, number | null>;
  allocation: "Headcount" | "Budget" | "Fixed";
  fixedWeights: Record<Unit, number>;
  inflation: number;
  scenario: Scenario;
  audit: AuditEntry[];
  close: CloseEntry[];
};
export const UNITS: Unit[] = ["North America", "Europe", "United Kingdom"];
export const CATEGORIES: Expense[] = ["People", "Technology", "Vendors"];
export const MONTHS = Array.from({ length: 12 }, (_, i) => `2026-${String(i + 1).padStart(2, "0")}`);

export function demoModel(): FpaModel {
  const drivers: Driver[] = [
    { unit: "North America", currency: "USD", fte: 42, hires: 1, exits: 0, annualPay: 142000, benefits: 24, technology: 110000, vendors: 57000 },
    { unit: "Europe", currency: "EUR", fte: 28, hires: 1, exits: 0, annualPay: 105000, benefits: 27, technology: 69000, vendors: 34000 },
    { unit: "United Kingdom", currency: "GBP", fte: 21, hires: 0, exits: 0, annualPay: 96000, benefits: 23, technology: 46000, vendors: 27000 },
  ];
  const rows = MONTHS.flatMap((month, index) => drivers.flatMap((d, unitIndex) => CATEGORIES.map((category, categoryIndex) => {
    const base = category === "People" ? d.fte * d.annualPay / 12 * (1 + d.benefits / 100) : category === "Technology" ? d.technology : d.vendors;
    const budget = Math.round(base * (1 + index * 0.002));
    const drift = (Math.sin((index + 1) * (unitIndex + 2) + categoryIndex) * 0.055) + (categoryIndex === 1 ? 0.018 : 0);
    return { id: `${month}-${unitIndex}-${categoryIndex}`, month, unit: d.unit, category, currency: d.currency, budget, actual: index < 9 ? Math.round(budget * (1 + drift)) : null };
  })));
  const sharedActuals = Object.fromEntries(MONTHS.map((month, index) => [month, index < 9 ? Math.round(76000 * (1 + Math.sin(index + 2) * 0.04)) : null]));
  return { version: 1, dataSource: "demo", rows, drivers, fx: { USD: 1, EUR: 1.08, GBP: 1.28 }, sharedPool: 76000, sharedActuals, allocation: "Headcount", fixedWeights: { "North America": 50, Europe: 30, "United Kingdom": 20 }, inflation: 3, scenario: "Base", audit: [], close: [] };
}

export const usd = (amount: number, currency: Currency, fx: FpaModel["fx"]) => amount * fx[currency];
export const variance = (actual: number, budget: number) => actual - budget;
export const variancePercent = (actual: number, budget: number) => budget === 0 ? null : 100 * (actual - budget) / budget;

export function monthlyTotals(model: FpaModel) {
  return MONTHS.map(month => {
    const rows = model.rows.filter(row => row.month === month);
    const budget = rows.reduce((sum, row) => sum + usd(row.budget, row.currency, model.fx), 0) + model.sharedPool;
    const actualRows = rows.filter(row => row.actual !== null);
    const sharedActual = model.sharedActuals[month];
    const complete = actualRows.length === rows.length && rows.length === UNITS.length * CATEGORIES.length && sharedActual !== null;
    const actual = actualRows.reduce((sum, row) => sum + usd(row.actual!, row.currency, model.fx), 0) + (sharedActual ?? 0);
    return { month, budget, actual: complete ? actual : null, complete, entered: actualRows.length + (sharedActual === null ? 0 : 1), expected: UNITS.length * CATEGORIES.length + 1 };
  });
}

export function allocationWeights(model: FpaModel, month: string): Record<Unit, number> {
  const raw = Object.fromEntries(UNITS.map(unit => {
    const driver = model.drivers.find(d => d.unit === unit);
    const amount = model.allocation === "Headcount" ? driver?.fte ?? 0
      : model.allocation === "Budget" ? model.rows.filter(row => row.month === month && row.unit === unit).reduce((sum, row) => sum + usd(row.budget, row.currency, model.fx), 0)
      : model.fixedWeights[unit];
    return [unit, Math.max(0, amount)];
  })) as Record<Unit, number>;
  const total = UNITS.reduce((sum, unit) => sum + raw[unit], 0);
  return Object.fromEntries(UNITS.map(unit => [unit, total > 0 ? raw[unit] / total : 0])) as Record<Unit, number>;
}

export function allocationRows(model: FpaModel, month: string) {
  const weights = allocationWeights(model, month);
  return UNITS.map(unit => ({ unit, weight: weights[unit], amount: model.sharedPool * weights[unit] }));
}

export function forecast(model: FpaModel, months = 36) {
  const multiplier = model.scenario === "Upside" ? 0.97 : model.scenario === "Downside" ? 1.08 : 1;
  const inflation = Math.max(-50, Math.min(100, model.inflation)) / 100;
  return Array.from({ length: months }, (_, index) => {
    const year = 2026 + Math.floor((9 + index) / 12);
    const monthNumber = (9 + index) % 12 + 1;
    const month = `${year}-${String(monthNumber).padStart(2, "0")}`;
    const annualFactor = Math.pow(1 + inflation, (index + 1) / 12);
    const breakdown = model.drivers.map(d => {
      const fteStart = Math.max(0, d.fte + (d.hires - d.exits) * index);
      const fteEnd = Math.max(0, fteStart + d.hires - d.exits);
      const people = ((fteStart + fteEnd) / 2) * d.annualPay / 12 * (1 + d.benefits / 100) * annualFactor;
      const nonPeople = (d.technology + d.vendors) * annualFactor;
      return { unit: d.unit, fte: fteEnd, people: usd(people, d.currency, model.fx), nonPeople: usd(nonPeople, d.currency, model.fx) };
    });
    const people = breakdown.reduce((sum, d) => sum + d.people, 0);
    const nonPeople = breakdown.reduce((sum, d) => sum + d.nonPeople, 0);
    const shared = model.sharedPool * annualFactor;
    return { month, people, nonPeople, shared, total: (people + nonPeople + shared) * multiplier, fte: breakdown.reduce((sum, d) => sum + d.fte, 0) };
  });
}

export function closeChecks(model: FpaModel, month: string) {
  const rows = model.rows.filter(row => row.month === month);
  const missing = rows.filter(row => row.actual === null).length + (model.sharedActuals[month] === null ? 1 : 0);
  const invalid = rows.filter(row => row.budget < 0 || (row.actual !== null && row.actual < 0)).length + (model.sharedActuals[month] !== null && model.sharedActuals[month] < 0 ? 1 : 0);
  const fxMissing = rows.some(row => !Number.isFinite(model.fx[row.currency]) || model.fx[row.currency] <= 0);
  const allocated = allocationRows(model, month).reduce((sum, row) => sum + row.amount, 0);
  const balanced = Math.abs(allocated - model.sharedPool) < 0.01;
  return [
    { name: "Actuals coverage", ok: missing === 0 && rows.length === 9, detail: `${10 - missing} / 10 lines entered` },
    { name: "Non-negative entries", ok: invalid === 0, detail: invalid ? `${invalid} lines need correction` : "All entered amounts are valid" },
    { name: "FX completeness", ok: !fxMissing, detail: fxMissing ? "Missing or invalid conversion rate" : "All source currencies have rates" },
    { name: "Shared-cost allocation", ok: balanced, detail: balanced ? "Allocated amount reconciles to pool" : "Allocation does not reconcile" },
  ];
}

export function validImport(value: unknown): value is FpaModel {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<FpaModel>;
  return v.version === 1 && (v.dataSource === undefined || ["demo", "imported"].includes(v.dataSource)) && Array.isArray(v.rows) && v.rows.length === 108 && new Set(v.rows.map(row => row.id)).size === 108 && v.rows.every(row =>
    typeof row.id === "string" && MONTHS.includes(row.month) && UNITS.includes(row.unit) && CATEGORIES.includes(row.category) &&
    ["USD", "EUR", "GBP"].includes(row.currency) && Number.isFinite(row.budget) && row.budget >= 0 &&
    (row.actual === null || Number.isFinite(row.actual) && row.actual >= 0)) &&
    Array.isArray(v.drivers) && v.drivers.length === 3 && new Set(v.drivers.map(d => d.unit)).size === 3 && v.drivers.every(d => UNITS.includes(d.unit) && ["USD", "EUR", "GBP"].includes(d.currency) && [d.fte, d.hires, d.exits, d.annualPay, d.benefits, d.technology, d.vendors].every(n => Number.isFinite(n) && n >= 0)) &&
    !!v.fx && [v.fx.USD, v.fx.EUR, v.fx.GBP].every(n => Number.isFinite(n) && n > 0) &&
    Number.isFinite(v.sharedPool) && v.sharedPool! >= 0 && !!v.sharedActuals && MONTHS.every(month => v.sharedActuals![month] === null || Number.isFinite(v.sharedActuals![month]) && v.sharedActuals![month]! >= 0) && ["Headcount", "Budget", "Fixed"].includes(v.allocation!) &&
    !!v.fixedWeights && UNITS.every(unit => Number.isFinite(v.fixedWeights![unit]) && v.fixedWeights![unit] >= 0) &&
    Number.isFinite(v.inflation) && v.inflation! >= 0 && v.inflation! <= 100 && ["Base", "Upside", "Downside"].includes(v.scenario!) && Array.isArray(v.audit) && v.audit.every(entry => typeof entry.at === "string" && typeof entry.action === "string" && typeof entry.detail === "string") && Array.isArray(v.close) && v.close.every(entry => typeof entry.month === "string" && typeof entry.check === "string" && typeof entry.reviewer === "string" && typeof entry.note === "string" && typeof entry.at === "string");
}
