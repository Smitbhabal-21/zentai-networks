import type { AnalystSnapshot } from "./types";

export type MultipleKey = "pe" | "evEbitda" | "ps";
export type MultipleInputs = Record<MultipleKey, number>;
export type MultipleBasis = {
  sharesM: number | null;
  ttm: Record<"revenue" | "ebitda" | "netIncome", number | null>;
  netDebtM: number | null;
  periods: string[];
  complete: boolean;
};

const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

export function buildMultipleBasis(report: AnalystSnapshot): MultipleBasis {
  const quarters = report.financials.quarterly.slice(-4);
  const dates = quarters.map(row => Date.parse(String(row.period)));
  const complete = dates.length === 4 && dates.every(Number.isFinite) && dates.slice(1).every((date, index) => {
    const days = (date - dates[index]) / 86400000;
    return days >= 70 && days <= 110;
  });
  const total = (field: string) => complete && quarters.every(row => finite(row[field]))
    ? quarters.reduce((sum, row) => sum + (row[field] as number), 0) : null;
  const cash = report.financials.latest_kpis.cash_m;
  const debt = report.financials.latest_kpis.total_debt_m;
  return {
    sharesM: finite(report.valuation.shares_outstanding_m) && report.valuation.shares_outstanding_m > 0 ? report.valuation.shares_outstanding_m : null,
    ttm: { revenue: total("revenue_m"), ebitda: total("ebitda_m"), netIncome: total("net_income_m") },
    netDebtM: finite(debt) && finite(cash) ? debt - cash : null,
    periods: quarters.map(row => String(row.period)),
    complete,
  };
}

export function marketMultiples(basis: MultipleBasis, price: number | null, financials: boolean): Record<MultipleKey, number | null> {
  const { sharesM, ttm, netDebtM } = basis;
  const marketCapM = finite(price) && price > 0 && sharesM ? price * sharesM : null;
  return {
    pe: marketCapM && ttm.netIncome && ttm.netIncome > 0 ? marketCapM / ttm.netIncome : null,
    evEbitda: !financials && marketCapM && netDebtM !== null && ttm.ebitda && ttm.ebitda > 0 && marketCapM + netDebtM > 0 ? (marketCapM + netDebtM) / ttm.ebitda : null,
    ps: !financials && marketCapM && ttm.revenue && ttm.revenue > 0 ? marketCapM / ttm.revenue : null,
  };
}

export function multipleValues(basis: MultipleBasis, target: MultipleInputs, financials: boolean): Record<MultipleKey, number | null> {
  const { sharesM, ttm, netDebtM } = basis;
  const valid = (multiple: number) => finite(multiple) && multiple > 0 && multiple <= 200;
  if (!sharesM) return { pe: null, evEbitda: null, ps: null };
  const pe = valid(target.pe) && ttm.netIncome !== null && ttm.netIncome > 0 ? target.pe * ttm.netIncome / sharesM : null;
  const ev = !financials && valid(target.evEbitda) && ttm.ebitda !== null && ttm.ebitda > 0 && netDebtM !== null
    ? (target.evEbitda * ttm.ebitda - netDebtM) / sharesM : null;
  const ps = !financials && valid(target.ps) && ttm.revenue !== null && ttm.revenue > 0 ? target.ps * ttm.revenue / sharesM : null;
  return { pe, evEbitda: ev !== null && ev > 0 ? ev : null, ps };
}
