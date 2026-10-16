export type VolumeMetric = "relative" | "shares";

export type VolumeRankRow = {
  company: { ticker: string; name: string };
  summary?: {
    observedAt: string | null;
    volume: number | null;
    relativeVolume: number | null;
    dayReturn: number | null;
    source: string | null;
  };
};

export function rankVolume<T extends VolumeRankRow>(rows: T[], metric: VolumeMetric) {
  const value = (row: T) => metric === "relative" ? row.summary?.relativeVolume : row.summary?.volume;
  const valid = rows.filter(row => row.summary?.observedAt && Number.isFinite(value(row)) && (value(row) || 0) > 0);
  const session = valid.reduce((latest, row) => {
    const date = row.summary!.observedAt!.slice(0, 10);
    return date > latest ? date : latest;
  }, "");
  const sameSession = valid.filter(row => row.summary!.observedAt!.slice(0, 10) === session);
  const sorted = [...sameSession].sort((a, b) => (value(b) || 0) - (value(a) || 0) || a.company.ticker.localeCompare(b.company.ticker));
  const highCount = Math.min(10, Math.ceil(sorted.length / 2));
  const lowCount = Math.min(10, Math.floor(sorted.length / 2));
  return { session, eligible: sorted.length, high: sorted.slice(0, highCount), low: lowCount ? sorted.slice(-lowCount).reverse() : [] };
}
