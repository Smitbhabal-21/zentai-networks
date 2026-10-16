import { unstable_cache } from "next/cache";
import fallback from "./ivv-fallback.json";

export const IVV_SOURCE = "https://www.ishares.com/us/products/239726/ishares-core-s-p-500-etf/latest-holdings.csv";
export const IVV_PAGE = "https://www.ishares.com/us/products/239726/ishares-core-s-p-500-etf";
export type UniverseHolding = { ticker: string; name: string; sector: string; weight: number; price: number };
export type UniverseSnapshot = { asOf: string; holdings: UniverseHolding[]; source: string; fallback: boolean };

function csvFields(line: string): string[] {
  const fields: string[] = [];
  let field = "", quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) { fields.push(field); field = ""; }
    else field += char;
  }
  fields.push(field);
  return fields;
}

export function parseIvvCsv(csv: string): { asOf: string; holdings: UniverseHolding[] } {
  const rows = csv.replace(/^\uFEFF/, "").split(/\r?\n/).map(csvFields);
  const header = rows.findIndex(row => row[0] === "Ticker" && row[1] === "Name");
  const dated = rows.find(row => row[0] === "Fund Holdings as of")?.[1];
  const date = dated ? new Date(`${dated} 12:00:00 GMT`) : new Date(NaN);
  if (header < 0 || !Number.isFinite(date.getTime())) throw new Error("Invalid IVV holdings file.");
  const holdings = rows.slice(header + 1).flatMap(row => {
    if (row.length < 11 || row[3] !== "Equity" || /WARRANT/i.test(row[1]) || /NO MARKET/i.test(row[10])) return [];
    const ticker = row[0].replace(/\s+/g, "-").replace(/\./g, "-");
    const weight = Number(row[5].replaceAll(",", ""));
    const price = Number(row[8].replaceAll(",", ""));
    if (!/^[A-Z0-9-]{1,12}$/.test(ticker) || !Number.isFinite(weight) || !Number.isFinite(price)) return [];
    return [{ ticker, name: row[1], sector: row[2], weight, price }];
  });
  if (holdings.length < 450 || holdings.length > 520) throw new Error("IVV holdings file is incomplete.");
  return { asOf: date.toISOString().slice(0, 10), holdings };
}

export const getIvvUniverse = unstable_cache(async (): Promise<UniverseSnapshot> => {
  try {
    const response = await fetch(IVV_SOURCE, { signal: AbortSignal.timeout(8000), cache: "no-store" });
    if (!response.ok) throw new Error("Holdings feed unavailable.");
    const parsed = parseIvvCsv(await response.text());
    return { ...parsed, source: IVV_PAGE, fallback: false };
  } catch {
    return { ...fallback, source: IVV_PAGE, fallback: true };
  }
}, ["ivv-universe-v1"], { revalidate: 3600 });
