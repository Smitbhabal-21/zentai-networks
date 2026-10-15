import type { SignalObservation } from "./signal-map";

export type TradeSide = "call" | "put";

/** The watched level excludes the latest observation so the rule cannot look ahead. */
export function watchedLevel(observations: SignalObservation[]): { side: TradeSide; level: number; crossed: boolean; date: string } | null {
  const current = observations.at(-1);
  if (!current || current.state === "Mixed" || observations.length < 11) return null;
  const previous = observations.slice(-11, -1).map(item => item.close);
  const side = current.state === "Bullish" ? "call" : "put";
  const level = side === "call" ? Math.max(...previous) : Math.min(...previous);
  return { side, level, crossed: side === "call" ? current.close > level : current.close < level, date: current.date };
}

export function closedOptionPnl(entry: number, exit: number, contracts: number, multiplier: number): number | null {
  if (![entry, exit, contracts, multiplier].every(Number.isFinite) || entry < 0 || exit < 0 || !Number.isInteger(contracts) || contracts < 1 || multiplier <= 0) return null;
  return (exit - entry) * contracts * multiplier;
}
