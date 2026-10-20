"use client";

import { useMemo, useState } from "react";
import { Download, FileUp } from "lucide-react";
import { applyFpaCsv, fpaCsvTemplate, parseFpaCsv, suggestedAccountMap, type AccountMap, type FpaCsvEntry } from "@/lib/fpa-import";
import { CATEGORIES, type Expense, type FpaModel } from "@/lib/fpa";

const amount = (value: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
const totalsByCurrency = (entries: FpaCsvEntry[], kind: FpaCsvEntry["kind"]) => (["USD", "EUR", "GBP"] as const).map(currency => {
  const total = entries.filter(entry => entry.kind === kind && entry.currency === currency).reduce((sum, entry) => sum + entry.amount, 0);
  return total ? `${amount(total)} ${currency}` : null;
}).filter(Boolean).join(" · ") || "none";
const download = (name: string, value: string) => {
  const url = URL.createObjectURL(new Blob([value], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click(); URL.revokeObjectURL(url);
};

export function FpaCsvImport({ model, onImport }: { model: FpaModel; onImport: (next: FpaModel) => void }) {
  const [entries, setEntries] = useState<FpaCsvEntry[]>([]);
  const [fileName, setFileName] = useState("");
  const [mapping, setMapping] = useState<AccountMap>({});
  const [error, setError] = useState("");
  const preview = useMemo(() => {
    if (!entries.length) return null;
    try { return { next: applyFpaCsv(model, entries, mapping, fileName), error: "" }; }
    catch (cause) { return { next: null, error: cause instanceof Error ? cause.message : "Import validation failed." }; }
  }, [model, entries, mapping, fileName]);
  const read = async (file?: File) => {
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error("CSV must be under 2 MB.");
      const parsed = parseFpaCsv(await file.text());
      setEntries(parsed); setMapping(suggestedAccountMap(parsed)); setFileName(file.name); setError("");
    } catch (cause) { setEntries([]); setError(cause instanceof Error ? cause.message : "Could not read CSV."); }
  };
  const apply = () => {
    if (!preview?.next) return;
    onImport(preview.next);
    setEntries([]); setFileName(""); setMapping({});
    setError("Imported ledger reconciled. Prior review records were cleared; check FX rates and forecast drivers.");
  };
  return <details className="panel fpa-csv-import"><summary><FileUp size={16} /> Import a real expense ledger <span>CSV · local preview before replacement</span></summary><div className="fpa-csv-body"><p className="note">Map account codes to People, Technology, Vendors, or Shared services. The CSV must cover all 120 monthly 2026 budget groups; actuals may be partial. Source amounts stay in their unit currency. No file is uploaded to Zentai during this preview.</p>
    <div className="fpa-csv-actions"><button className="button" onClick={() => download("zentai-fpa-template.csv", fpaCsvTemplate(model))}><Download size={15} /> Download CSV template</button><label className="button">Choose CSV <input aria-label="Choose FP&A expense CSV" type="file" accept=".csv,text/csv" onChange={event => void read(event.target.files?.[0])} /></label></div>
    {error && <p className="notice" role="status">{error}</p>}
    {entries.length > 0 && <><div className="fpa-csv-preview"><strong>{fileName}</strong><span>{entries.length} source rows</span><span>Budget by currency: {totalsByCurrency(entries, "budget")}</span><span>Actual by currency: {totalsByCurrency(entries, "actual")}</span></div>
      <div className="fpa-csv-mapping"><h4>Account mapping</h4>{Object.keys(mapping).sort().map(account => <label key={account}>{account}<select aria-label={`Map account ${account}`} value={mapping[account]} onChange={event => setMapping(current => ({ ...current, [account]: event.target.value as Expense | "Shared services" | "" }))}><option value="">Map account…</option>{[...CATEGORIES, "Shared services"].map(category => <option key={category}>{category}</option>)}</select></label>)}</div>
      {preview?.error ? <p className="notice error" role="alert">{preview.error}</p> : <p className="fpa-csv-ready">Ready to import · source totals reconcile to the model · all budget groups covered</p>}
      <button className="button primary" disabled={!preview?.next} onClick={apply}>Replace current ledger with reconciled CSV</button>
      <p className="source">This replaces ledger rows and clears prior close reviews. Export your existing model first if you need to keep it. Forecast drivers and FX rates remain editable assumptions.</p>
    </>}
  </div></details>;
}
