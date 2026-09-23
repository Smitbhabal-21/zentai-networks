import { unstable_cache } from "next/cache";
import { XMLParser } from "fast-xml-parser";
import { normalizeArticles, normalizeChart, finite } from "./normalize";
import type { Range } from "./companies";
import type { NewsResponse, Quote } from "./types";
async function fetchJson(url: string) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
    headers: { "User-Agent": "ZentaiNetworks/2.0", Accept: "application/json" },
  });
  if (!response.ok)
    throw new Error(`Data provider returned HTTP ${response.status}.`);
  return response.json();
}
async function yahoo(symbol: string, range: string, interval: string) {
  let error: unknown;
  for (const host of ["query1.finance.yahoo.com", "query2.finance.yahoo.com"]) {
    try {
      return await fetchJson(
        `https://${host}/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`,
      );
    } catch (e) {
      error = e;
    }
  }
  throw error;
}
export const getQuote = unstable_cache(
  async (symbol: string, range: Range): Promise<Quote> => {
    const [chart, daily] = await Promise.all([
      yahoo(symbol, range, range === "5y" ? "1wk" : "1d"),
      yahoo(symbol, "1d", "5m"),
    ]);
    const dailyMeta = daily?.chart?.result?.[0]?.meta;
    chart._dailyPrevious =
      dailyMeta?.previousClose ?? dailyMeta?.chartPreviousClose;
    const quote = normalizeChart(chart, symbol);
    if (process.env.FINNHUB_API_KEY && /^[A-Z]+$/.test(symbol)) {
      try {
        const live = await fetchJson(
          `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${encodeURIComponent(process.env.FINNHUB_API_KEY)}`,
        );
        if (
          finite(live.c) &&
          live.c > 0 &&
          finite(live.t) &&
          live.t * 1000 <= Date.now() + 300000
        ) {
          quote.price = live.c;
          quote.change = finite(live.d);
          quote.changePercent = finite(live.dp);
          quote.asOf = new Date(live.t * 1000).toISOString();
          quote.source = "Finnhub";
          quote.feedLabel = "Finnhub · coverage per subscription";
          quote.marketState =
            Date.now() - live.t * 1000 > 20 * 60000
              ? "Last reported quote"
              : "Recent quote";
        }
      } catch {
        /* The timestamped public quote remains explicitly labeled. */
      }
    }
    return quote;
  },
  ["quotes-v2"],
  { revalidate: 60 },
);
export const getNews = unstable_cache(
  async (ticker: string, name: string): Promise<NewsResponse> => {
    if (process.env.FINNHUB_API_KEY) {
      try {
        const to = new Date().toISOString().slice(0, 10),
          from = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
        const raw = await fetchJson(
          `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${from}&to=${to}&token=${encodeURIComponent(process.env.FINNHUB_API_KEY)}`,
        );
        const articles = normalizeArticles(
          Array.isArray(raw) ? raw : [],
          "Finnhub",
        );
        if (articles.length)
          return {
            articles,
            source: "Finnhub",
            fetchedAt: new Date().toISOString(),
          };
      } catch {
        /* Fall back to a named public feed. */
      }
    }
    const q = encodeURIComponent(`"${name}" stock when:7d`);
    const response = await fetch(
      `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`,
      { cache: "no-store", signal: AbortSignal.timeout(10000) },
    );
    if (!response.ok) throw new Error("News feed is temporarily unavailable.");
    const raw = new XMLParser({
      ignoreAttributes: false,
      processEntities: false,
    }).parse(await response.text());
    const items = raw?.rss?.channel?.item;
    const articles = normalizeArticles(
      Array.isArray(items) ? items : items ? [items] : [],
      "Google News RSS",
    );
    return {
      articles,
      source: "Google News RSS",
      fetchedAt: new Date().toISOString(),
      warning:
        "Headlines are matched by company name; publication times are supplied by publishers.",
    };
  },
  ["news-v2"],
  { revalidate: 180 },
);
