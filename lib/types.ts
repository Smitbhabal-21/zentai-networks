export type Quote = {
  symbol: string;
  price: number;
  change: number | null;
  changePercent: number | null;
  currency: string;
  asOf: string;
  fetchedAt: string;
  source: string;
  feedLabel: string;
  exchange: string;
  marketState: string;
  history: { date: string; close: number; volume: number | null }[];
};
export type Article = {
  id: string;
  title: string;
  url: string;
  publisher: string;
  publishedAt: string;
  source: string;
};
export type MarketResponse = {
  quotes: Quote[];
  errors: { symbol: string; message: string }[];
  fetchedAt: string;
};
export type NewsResponse = {
  articles: Article[];
  fetchedAt: string;
  source: string;
  warning?: string;
};
