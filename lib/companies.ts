export const companies = [
  {
    key: "citi_bank",
    ticker: "C",
    name: "Citigroup",
    sector: "Financials",
    color: "#6b9dff",
  },
  {
    key: "jpmorgan",
    ticker: "JPM",
    name: "JPMorgan Chase",
    sector: "Financials",
    color: "#aab8e5",
  },
  {
    key: "apple",
    ticker: "AAPL",
    name: "Apple",
    sector: "Technology",
    color: "#d4d9e1",
  },
  {
    key: "microsoft",
    ticker: "MSFT",
    name: "Microsoft",
    sector: "Technology",
    color: "#72bcff",
  },
  {
    key: "meta",
    ticker: "META",
    name: "Meta Platforms",
    sector: "Technology",
    color: "#658aff",
  },
  {
    key: "nvidia",
    ticker: "NVDA",
    name: "NVIDIA",
    sector: "Semiconductors",
    color: "#b7f36b",
  },
  {
    key: "amazon",
    ticker: "AMZN",
    name: "Amazon",
    sector: "Consumer",
    color: "#ffbd6b",
  },
  {
    key: "tesla",
    ticker: "TSLA",
    name: "Tesla",
    sector: "Automotive",
    color: "#ff7878",
  },
  {
    key: "exxon",
    ticker: "XOM",
    name: "ExxonMobil",
    sector: "Energy",
    color: "#f39dab",
  },
  {
    key: "pfizer",
    ticker: "PFE",
    name: "Pfizer",
    sector: "Healthcare",
    color: "#74d7db",
  },
] as const;
export type Company = (typeof companies)[number];
export const macroSymbols = ["SPY", "^IXIC", "^VIX", "GC=F"] as const;
export const allowedSymbols = new Set<string>([
  ...companies.map((c) => c.ticker),
  ...macroSymbols,
]);
export const ranges = ["1mo", "3mo", "6mo", "1y", "5y"] as const;
export type Range = (typeof ranges)[number];
