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
export type AnalystSnapshot = {
  company: string;
  ticker: string;
  industry: string;
  as_of: string | null;
  fetched_at: string;
  financials: {
    quarterly: Array<Record<string, number | string | null>>;
    latest_kpis: Record<string, number | null>;
    source: string;
  };
  valuation: {
    error?: string;
    current_price?: number;
    intrinsic_value?: number;
    upside_pct?: number;
    free_cash_flow_m?: number;
    shares_outstanding_m?: number;
    assumptions?: { growth_rate: number; discount_rate: number; terminal_growth: number };
    methodology?: string;
  };
  credit: {
    status: "available" | "insufficient" | "not_applicable";
    grade: string | null;
    score: number | null;
    reason?: string;
    caveat: string;
    methodology?: string;
    metrics?: Record<string, number | null>;
    factors?: Array<{ name: string; value: number | null; points: number; weight: number }>;
  };
  filings: {
    status: "available" | "not_configured" | "unavailable";
    reason?: string;
    source?: string;
    methodology?: string;
    cik: number | null;
    facts: Record<string, { value_m: number; period_end: string; filed?: string; form?: string; accession?: string; concept: string }>;
    filings: Array<{ form: string; filed: string; accession: string; url: string }>;
  };
  quality_checks: Array<{ metric: string; status: string; detail: string }>;
};
