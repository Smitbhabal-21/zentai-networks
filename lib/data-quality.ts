import type { AnalystSnapshot, Quote } from "./types";

export type EvidenceCheck = { label: string; state: "available" | "review" | "missing"; detail: string };
const valid = (value: number | null | undefined) => typeof value === "number" && Number.isFinite(value);

export function analystEvidenceChecks(report: AnalystSnapshot, quote?: Quote, now = Date.now()): EvidenceCheck[] {
  const observed = quote?.asOf ? Date.parse(quote.asOf) : NaN;
  const quoteAge = Number.isFinite(observed) ? Math.max(0, now - observed) : Infinity;
  const statements = report.financials.latest_kpis;
  const reconciliation = report.quality_checks;
  return [
    { label: "Market observation", state: !quote || !valid(quote.price) || !Number.isFinite(observed) ? "missing" : quoteAge > 5 * 86400000 ? "review" : "available",
      detail: !quote ? "No usable timestamped quote." : `${quote.source} · observed ${quote.asOf}. ${quoteAge > 5 * 86400000 ? "Older than five days; check for market closures or provider delay." : "Public feed may still be delayed."}` },
    { label: "Reported statements", state: report.as_of && (valid(statements.revenue_m) || valid(statements.ebitda_m)) ? "available" : "missing",
      detail: report.as_of ? `${report.financials.source} · fiscal period ${report.as_of}` : "No dated fiscal period." },
    { label: "Primary filing facts", state: report.filings.status === "available" && Object.keys(report.filings.facts).length ? "available" : "missing",
      detail: report.filings.status === "available" ? `${Object.keys(report.filings.facts).length} SEC XBRL facts; verify the linked filing and context.` : report.filings.reason || "SEC facts unavailable." },
    { label: "Source reconciliation", state: reconciliation.some(check => check.status === "mismatch") ? "review" : reconciliation.some(check => check.status === "aligned") ? "available" : "missing",
      detail: reconciliation.length ? reconciliation.map(check => `${check.metric}: ${check.status.replaceAll("_", " ")}`).join(" · ") : "No matching-period provider and SEC fact to compare." },
    { label: "Valuation inputs", state: valid(report.valuation.intrinsic_value) && valid(report.valuation.free_cash_flow_m) && valid(report.valuation.shares_outstanding_m) ? "available" : "missing",
      detail: report.valuation.error || "Five-year FCF-per-share model; assumptions must be reviewed separately." },
  ];
}
