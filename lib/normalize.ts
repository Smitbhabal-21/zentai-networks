import type { Article, Quote } from "./types";
export function finite(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
export function safeUrl(value: unknown): string | null {
  try {
    const url = new URL(String(value));
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}
export function normalizeChart(
  raw: any,
  symbol: string,
  now = new Date(),
): Quote {
  const result = raw?.chart?.result?.[0];
  const meta = result?.meta;
  const price = finite(meta?.regularMarketPrice);
  const time = finite(meta?.regularMarketTime);
  if (
    price === null ||
    price <= 0 ||
    !time ||
    time * 1000 > now.getTime() + 300000
  )
    throw new Error("Provider did not return a valid timestamped quote.");
  // previousClose in a multi-month chart can mean the close BEFORE the chart window.
  // Only chartPreviousClose on a 1-day chart is safe for a daily move.
  const dailyPrevious =
    raw?._dailyPrevious === undefined ? null : finite(raw._dailyPrevious);
  const baseline = dailyPrevious;
  const series = result.indicators?.quote?.[0];
  const history = (result.timestamp || []).flatMap(
    (stamp: number, i: number) => {
      const close = finite(series?.close?.[i]);
      return close !== null && close > 0
        ? [
            {
              date: new Date(stamp * 1000).toISOString(),
              close,
              volume: finite(series?.volume?.[i]),
            },
          ]
        : [];
    },
  );
  const asOf = new Date(time * 1000).toISOString();
  return {
    symbol,
    price,
    change: baseline && baseline > 0 ? price - baseline : null,
    changePercent:
      baseline && baseline > 0 ? (price / baseline - 1) * 100 : null,
    currency: meta.currency || "USD",
    asOf,
    fetchedAt: now.toISOString(),
    source: "Yahoo Finance",
    feedLabel: "Public feed · may be delayed",
    exchange: meta.exchangeName || "Exchange unavailable",
    marketState:
      now.getTime() - time * 1000 > 20 * 60000
        ? "Last reported quote"
        : "Recent quote",
    history,
  };
}
export function normalizeArticles(
  items: any[],
  source: string,
  now = new Date(),
): Article[] {
  const seen = new Set<string>();
  return items
    .flatMap((item) => {
      const publisher = String(
        item.publisher ||
          item.source?.["#text"] ||
          item.source ||
          "Publisher unavailable",
      );
      const rawTitle = String(item.title || item.headline || "").trim();
      const suffix = ` - ${publisher}`;
      const title = rawTitle.endsWith(suffix)
        ? rawTitle.slice(0, -suffix.length)
        : rawTitle;
      const url = safeUrl(item.url || item.link);
      const date =
        typeof item.datetime === "number"
          ? new Date(item.datetime * 1000)
          : new Date(item.pubDate || item.publishedAt);
      const normalized = title.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (
        !title ||
        !url ||
        !Number.isFinite(date.getTime()) ||
        date.getTime() > now.getTime() + 300000 ||
        now.getTime() - date.getTime() > 7 * 86400000 ||
        seen.has(normalized) ||
        seen.has(url)
      )
        return [];
      seen.add(normalized);
      seen.add(url);
      return [
        {
          id: url,
          title,
          url,
          publisher,
          publishedAt: date.toISOString(),
          source,
        },
      ];
    })
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, 24);
}
