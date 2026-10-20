import { CATEGORIES, MONTHS, UNITS, type Currency, type Expense, type FpaModel, type Unit } from "./fpa";

export type FpaCsvEntry = { line: number; month: string; unit: Unit | "Shared services"; account: string; currency: Currency; kind: "budget" | "actual"; amount: number };
export type AccountMap = Record<string, Expense | "Shared services" | "">;
const required = ["month", "unit", "account", "currency", "kind", "amount"] as const;

function csvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) { row.push(field); field = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some(value => value.trim())) rows.push(row);
      row = [];
    } else field += char;
  }
  if (quoted) throw new Error("CSV has an unclosed quoted field.");
  row.push(field);
  if (row.some(value => value.trim())) rows.push(row);
  return rows;
}

export function parseFpaCsv(text: string): FpaCsvEntry[] {
  if (text.length > 2_000_000) throw new Error("CSV must be under 2 MB.");
  const rows = csvRows(text.replace(/^\uFEFF/, ""));
  if (rows.length < 2) throw new Error("CSV needs a header and at least one data row.");
  const header = rows[0].map(value => value.trim().toLowerCase());
  if (new Set(header).size !== header.length || required.some(name => !header.includes(name))) throw new Error(`CSV columns must include ${required.join(", ")} without duplicate headers.`);
  if (rows.length > 20_001) throw new Error("CSV exceeds 20,000 source rows.");
  return rows.slice(1).map((cells, index) => {
    const line = index + 2;
    const value = (name: typeof required[number]) => (cells[header.indexOf(name)] || "").trim();
    const month = value("month"), unit = value("unit"), account = value("account"), currency = value("currency"), kind = value("kind").toLowerCase(), raw = value("amount");
    if (cells.length !== header.length) throw new Error(`Line ${line}: column count does not match the header.`);
    if (!MONTHS.includes(month)) throw new Error(`Line ${line}: month must be in 2026 (YYYY-MM).`);
    if (![...UNITS, "Shared services"].includes(unit as Unit)) throw new Error(`Line ${line}: unknown unit ${unit || "(blank)"}.`);
    if (!account || account.length > 80) throw new Error(`Line ${line}: account code is required (maximum 80 characters).`);
    if (!["USD", "EUR", "GBP"].includes(currency)) throw new Error(`Line ${line}: currency must be USD, EUR, or GBP.`);
    if (kind !== "budget" && kind !== "actual") throw new Error(`Line ${line}: kind must be budget or actual.`);
    if (!/^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/.test(raw)) throw new Error(`Line ${line}: amount must be a nonnegative number with up to two decimals.`);
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount > 1_000_000_000_000) throw new Error(`Line ${line}: amount is outside the supported range.`);
    return { line, month, unit: unit as FpaCsvEntry["unit"], account, currency: currency as Currency, kind: kind as FpaCsvEntry["kind"], amount };
  });
}

export function suggestedAccountMap(entries: FpaCsvEntry[]): AccountMap {
  return Object.fromEntries([...new Set(entries.map(entry => entry.account))].map(account => {
    const shared = entries.some(entry => entry.account === account && entry.unit === "Shared services");
    const category = CATEGORIES.find(name => name.toLowerCase() === account.toLowerCase());
    return [account, shared ? "Shared services" : category || ""];
  }));
}

export function applyFpaCsv(base: FpaModel, entries: FpaCsvEntry[], accountMap: AccountMap, fileName: string, at = new Date().toISOString()): FpaModel {
  if (!entries.length) throw new Error("No records to import.");
  const budgets = new Map<string, number>(), actuals = new Map<string, number>();
  const sourceBudget: Record<Currency, number> = { USD: 0, EUR: 0, GBP: 0 };
  const sourceActual: Record<Currency, number> = { USD: 0, EUR: 0, GBP: 0 };
  for (const entry of entries) {
    const category = accountMap[entry.account];
    if (!category) throw new Error(`Account ${entry.account} has no category mapping.`);
    if ((entry.unit === "Shared services") !== (category === "Shared services")) throw new Error(`Line ${entry.line}: Shared services must map only to Shared services.`);
    const expectedCurrency = entry.unit === "Shared services" ? "USD" : base.drivers.find(driver => driver.unit === entry.unit)?.currency;
    if (entry.currency !== expectedCurrency) throw new Error(`Line ${entry.line}: ${entry.unit} expects ${expectedCurrency}, received ${entry.currency}.`);
    const key = `${entry.month}|${entry.unit}|${category}`;
    const target = entry.kind === "budget" ? budgets : actuals;
    target.set(key, (target.get(key) || 0) + entry.amount);
    if (entry.kind === "budget") sourceBudget[entry.currency] += entry.amount;
    else sourceActual[entry.currency] += entry.amount;
  }
  const expectedBudgets = MONTHS.flatMap(month => [
    ...UNITS.flatMap(unit => CATEGORIES.map(category => `${month}|${unit}|${category}`)),
    `${month}|Shared services|Shared services`,
  ]);
  const missing = expectedBudgets.filter(key => !budgets.has(key));
  if (missing.length) throw new Error(`Budget coverage is incomplete: ${missing.length} of 120 month/unit/category lines are missing. First: ${missing[0]}. Use the CSV template.`);
  const sharedBudgets = MONTHS.map(month => budgets.get(`${month}|Shared services|Shared services`)!);
  if (sharedBudgets.some(amount => Math.abs(amount - sharedBudgets[0]) > .01)) throw new Error("The current model requires the same shared-services budget each month. Reconcile the source file before import.");
  const rows = base.rows.map(row => ({ ...row, budget: budgets.get(`${row.month}|${row.unit}|${row.category}`)!,
    actual: actuals.get(`${row.month}|${row.unit}|${row.category}`) ?? null }));
  const sharedActuals = Object.fromEntries(MONTHS.map(month => [month, actuals.get(`${month}|Shared services|Shared services`) ?? null]));
  const importedBudget: Record<Currency, number> = { USD: sharedBudgets.reduce((sum, amount) => sum + amount, 0), EUR: 0, GBP: 0 };
  const importedActual: Record<Currency, number> = { USD: Object.values(sharedActuals).reduce<number>((sum, amount) => sum + (amount ?? 0), 0), EUR: 0, GBP: 0 };
  for (const row of rows) { importedBudget[row.currency] += row.budget; importedActual[row.currency] += row.actual ?? 0; }
  if ((["USD", "EUR", "GBP"] as Currency[]).some(currency => Math.abs(importedBudget[currency] - sourceBudget[currency]) > .01 || Math.abs(importedActual[currency] - sourceActual[currency]) > .01)) throw new Error("Source amounts did not reconcile to the imported model by currency.");
  return { ...base, dataSource: "imported", rows, sharedPool: sharedBudgets[0], sharedActuals, close: [],
    importMeta: { importedAt: at, fileName, sourceRows: entries.length, budgetTotalsByCurrency: importedBudget, actualTotalsByCurrency: importedActual, accountMap },
    audit: [{ at, action: "CSV ledger import", detail: `${fileName}: ${entries.length} source rows; budgets and actuals reconciled. Prior close reviews cleared.` }] };
}

export function fpaCsvTemplate(model: FpaModel): string {
  const lines = ["month,unit,account,currency,kind,amount"];
  for (const month of MONTHS) {
    for (const unit of UNITS) for (const category of CATEGORIES) lines.push(`${month},${unit},${category},${model.drivers.find(driver => driver.unit === unit)!.currency},budget,`);
    lines.push(`${month},Shared services,SHARED,USD,budget,`);
  }
  return lines.join("\n") + "\n";
}
