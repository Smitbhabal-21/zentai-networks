import type { Article, Quote } from "./types";

type Point = Quote["history"][number];

export type PriceMove = { from: Point; to: Point; percent: number };
export type HistorySummary = {
  periodPercent: number;
  largestMove: PriceMove;
  maxDrawdownPercent: number;
  drawdownPeak: Point;
  drawdownTrough: Point;
};

export function summarizeHistory(points: Point[]): HistorySummary | null {
  const valid = points.filter(point => Number.isFinite(point.close) && point.close > 0);
  if (valid.length < 2) return null;
  let peak = valid[0];
  let drawdownPeak = peak;
  let drawdownTrough = peak;
  let maxDrawdownPercent = 0;
  let largestMove: PriceMove = { from: valid[0], to: valid[1], percent: (valid[1].close / valid[0].close - 1) * 100 };
  for (let index = 1; index < valid.length; index++) {
    const current = valid[index];
    const move = (current.close / valid[index - 1].close - 1) * 100;
    if (Math.abs(move) > Math.abs(largestMove.percent)) largestMove = { from: valid[index - 1], to: current, percent: move };
    if (current.close > peak.close) peak = current;
    const drawdown = (1 - current.close / peak.close) * 100;
    if (drawdown > maxDrawdownPercent) {
      maxDrawdownPercent = drawdown;
      drawdownPeak = peak;
      drawdownTrough = current;
    }
  }
  return { periodPercent: (valid.at(-1)!.close / valid[0].close - 1) * 100, largestMove, maxDrawdownPercent, drawdownPeak, drawdownTrough };
}

export function marketDate(value: string): string | null {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const get = (type: string) => parts.find(part => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function matchFilingsToHistory<T extends { filed: string }>(points: Point[], filings: T[]): Array<{ filing: T; observation: Point }> {
  const firstDay = points[0] ? marketDate(points[0].date) : null;
  if (!firstDay) return [];
  return filings.flatMap(filing => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(filing.filed) || filing.filed < firstDay) return [];
    const observation = points.find(point => (marketDate(point.date) || "") >= filing.filed);
    return observation ? [{ filing, observation }] : [];
  });
}

function afterClose(value: string): boolean {
  const hour = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "2-digit", hourCycle: "h23" }).format(new Date(value));
  return Number(hour) >= 16;
}

export type NewsContext = {
  article: Article;
  observation: Point | null;
  previous: Point | null;
  movePercent: number | null;
};

/** Match publication time to the next chart observation. Timing is not causation. */
export function matchNewsToHistory(points: Point[], articles: Article[], limit = 4): NewsContext[] {
  if (!points.length) return [];
  const dated = points.map(point => ({ point, day: marketDate(point.date) })).filter(item => item.day !== null);
  const firstDay = dated[0]?.day;
  if (!firstDay) return [];
  return articles.filter(article => {
    const day = marketDate(article.publishedAt);
    return day !== null && day >= firstDay;
  }).slice(0, limit).map(article => {
    const day = marketDate(article.publishedAt)!;
    const after = afterClose(article.publishedAt);
    const index = dated.findIndex(item => item.day! > day || (!after && item.day === day));
    const observation = index >= 0 ? dated[index].point : null;
    const previous = index > 0 ? dated[index - 1].point : null;
    return { article, observation, previous, movePercent: observation && previous && previous.close > 0 ? (observation.close / previous.close - 1) * 100 : null };
  });
}
