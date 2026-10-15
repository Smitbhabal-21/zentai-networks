import type { Quote } from "./types";

type PricePoint = Quote["history"][number];
export type SignalFactor = { name: string; reading: string; rule: string; contribution: -1 | 0 | 1 };
export type SignalObservation = {
  date: string;
  close: number;
  average10: number;
  average30: number;
  return20: number;
  dayReturn: number;
  relativeVolume: number | null;
  score: number;
  state: "Bullish" | "Bearish" | "Mixed";
  factors: SignalFactor[];
};

const avg = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
const percent = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
const side = (value: number, threshold = 0): -1 | 0 | 1 => value > threshold ? 1 : value < -threshold ? -1 : 0;

export function signalHistory(history: PricePoint[]): SignalObservation[] {
  const points = history.filter(point => Number.isFinite(point.close) && point.close > 0 && Number.isFinite(Date.parse(point.date)))
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  return points.flatMap((point, index) => {
    if (index < 29) return [];
    const average10 = avg(points.slice(index - 9, index + 1).map(item => item.close));
    const average30 = avg(points.slice(index - 29, index + 1).map(item => item.close));
    const return20 = (point.close / points[index - 20].close - 1) * 100;
    const dayReturn = (point.close / points[index - 1].close - 1) * 100;
    const previousVolumes = points.slice(index - 20, index).map(item => item.volume).filter((value): value is number => value !== null && Number.isFinite(value) && value > 0);
    const relativeVolume = point.volume !== null && point.volume > 0 && previousVolumes.length >= 15
      ? point.volume / avg(previousVolumes) : null;
    const factors: SignalFactor[] = [
      { name: "Short trend", reading: `${point.close.toFixed(2)} vs ${average10.toFixed(2)}`, rule: "Latest close above/below its 10-observation average", contribution: side(point.close - average10) },
      { name: "Trend alignment", reading: `${average10.toFixed(2)} vs ${average30.toFixed(2)}`, rule: "10-observation average above/below the 30-observation average", contribution: side(average10 - average30) },
      { name: "20-observation move", reading: percent(return20), rule: "+1 above +2%; −1 below −2%; otherwise 0", contribution: side(return20, 2) },
      { name: "Latest move", reading: percent(dayReturn), rule: "+1 above +0.5%; −1 below −0.5%; otherwise 0", contribution: side(dayReturn, .5) },
      { name: "Volume participation", reading: relativeVolume === null ? "Unavailable" : `${relativeVolume.toFixed(2)}×`, rule: "Adds the latest move's direction when volume is at least 1.5× the prior 20-observation average", contribution: relativeVolume !== null && relativeVolume >= 1.5 ? side(dayReturn, .5) : 0 },
    ];
    const score = factors.reduce((sum, factor) => sum + factor.contribution, 0);
    return [{ date: point.date, close: point.close, average10, average30, return20, dayReturn, relativeVolume, score,
      state: score >= 2 ? "Bullish" as const : score <= -2 ? "Bearish" as const : "Mixed" as const, factors }];
  });
}

export function signalTransitions(observations: SignalObservation[]) {
  return observations.filter((item, index) => index > 0 && item.state !== observations[index - 1].state).slice(-8);
}
