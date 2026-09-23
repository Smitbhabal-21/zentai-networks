"use client";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  ArrowUpRight as External,
  ArrowRight,
  BarChart3,
  BookOpen,
  ChevronDown,
  CircleHelp,
  Clock3,
  Globe2,
  LayoutDashboard,
  Menu,
  Newspaper,
  Pause,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import {
  companies,
  macroSymbols,
  ranges,
  type Company,
  type Range,
} from "@/lib/companies";
import type { MarketResponse, NewsResponse, Quote } from "@/lib/types";
import { useFeed } from "./use-feed";
import { FinancialChart, Lines, PriceChart } from "./charts";
const navigation = [
  { id: "overview", label: "Market overview", icon: LayoutDashboard },
  { id: "news", label: "Newsroom", icon: Newspaper },
  { id: "financials", label: "Company research", icon: BarChart3 },
  { id: "risk", label: "Risk intelligence", icon: ShieldCheck },
  { id: "portfolio", label: "Portfolio lab", icon: Wallet },
  { id: "backtest", label: "Strategy backtester", icon: Activity },
  { id: "operations", label: "Global operations", icon: Globe2 },
];
const money = (v: unknown, currency = "USD") =>
  typeof v === "number" && Number.isFinite(v)
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }).format(v)
    : "—";
const number = (v: unknown, d = 2) =>
  typeof v === "number" && Number.isFinite(v)
    ? new Intl.NumberFormat("en-US", { maximumFractionDigits: d }).format(v)
    : "—";
const pct = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v)
    ? `${v > 0 ? "+" : ""}${v.toFixed(2)}%`
    : "—";
const date = (v?: string) =>
  v
    ? /^\d{4}-\d{2}-\d{2}$/.test(v)
      ? v
      : new Date(v).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
    : "Not available";
function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </div>
  );
}
function Empty({ text = "No observations available." }: { text?: string }) {
  return (
    <div className="empty">
      <Activity size={23} />
      <p>{text}</p>
    </div>
  );
}
function FeedStatus({
  loading,
  error,
  hasData = false,
  retry,
}: {
  loading: boolean;
  error: string | null;
  hasData?: boolean;
  retry: () => void;
}) {
  return error ? (
    <div className="notice error" role="alert">
      <span>
        {hasData ? "Update failed. Showing the last successful snapshot. " : ""}
        {error}
      </span>
      <button onClick={retry}>Retry</button>
    </div>
  ) : loading && !hasData ? (
    <div className="loading" role="status">
      <RefreshCw size={15} className="spin" /> Requesting source data…
    </div>
  ) : null;
}
function Change({ value }: { value: number | null | undefined }) {
  return (
    <span
      className={`change ${value == null ? "muted" : value >= 0 ? "positive" : "negative"}`}
    >
      {value == null ? null : value >= 0 ? (
        <ArrowUpRight size={13} />
      ) : (
        <ArrowDownRight size={13} />
      )}{" "}
      {pct(value)}
    </span>
  );
}
function Stamp({ quote }: { quote?: Quote }) {
  return quote ? (
    <p className="source">
      <Clock3 size={12} />
      {quote.source} · {quote.feedLabel} · Quote {date(quote.asOf)}
      {Date.now() - Date.parse(quote.fetchedAt) > 300000
        ? " · Cached snapshot older than 5 minutes"
        : ""}
    </p>
  ) : null;
}
function CompanyBadge({ company }: { company: Company }) {
  return (
    <span
      className="company-badge"
      style={{ color: company.color, background: `${company.color}13` }}
    >
      {company.ticker.slice(0, 2)}
    </span>
  );
}
function PanelTitle({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="panel-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
      </div>
      {children}
    </div>
  );
}
function Analytics({
  section,
  company,
  auto,
  children,
}: {
  section: string;
  company: Company;
  auto: boolean;
  children: (data: any) => React.ReactNode;
}) {
  const feed = useFeed<any>(
    `/api/analytics?section=${section}&company=${company.key}`,
    300000,
    auto,
  );
  return (
    <>
      <FeedStatus {...feed} hasData={!!feed.data} retry={feed.refresh} />
      {feed.data && (
        <>
          {children(feed.data)}
          <p className="source">
            <Clock3 size={12} />
            Fetched {date(feed.data.fetched_at)}
            {feed.data.as_of ? ` · Observation ${date(feed.data.as_of)}` : ""} ·
            Yahoo Finance
            {feed.data.methodology ? ` · ${feed.data.methodology}` : ""}
          </p>
        </>
      )}
    </>
  );
}
export default function Dashboard() {
  const [page, setPage] = useState("overview"),
    [company, setCompany] = useState<Company>(companies[2]);
  const [range, setRange] = useState<Range>("3mo"),
    [auto, setAuto] = useState(true),
    [interval, setIntervalMs] = useState(60000),
    [search, setSearch] = useState(""),
    [mobile, setMobile] = useState(false),
    [brief, setBrief] = useState(false);
  useEffect(() => {
    if (!brief) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBrief(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [brief]);
  const [favorites, setFavorites] = useState<string[]>([
    "AAPL",
    "NVDA",
    "MSFT",
    "TSLA",
  ]);
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("zentai-watchlist") || "null",
      );
      if (Array.isArray(saved))
        setFavorites(
          saved.filter((s) => companies.some((c) => c.ticker === s)),
        );
    } catch {}
  }, []);
  const toggleFavorite = (ticker: string) =>
    setFavorites((old) => {
      const next = old.includes(ticker)
        ? old.filter((t) => t !== ticker)
        : [...old, ticker];
      try {
        localStorage.setItem("zentai-watchlist", JSON.stringify(next));
      } catch {}
      return next;
    });
  const market = useFeed<MarketResponse>(
    `/api/market?symbols=${[...companies.map((c) => c.ticker), ...macroSymbols].join(",")}&range=3mo`,
    interval,
    auto,
  );
  const selected = useFeed<MarketResponse>(
    range === "3mo"
      ? null
      : `/api/market?symbols=${company.ticker}&range=${range}`,
    interval,
    auto,
  );
  const news = useFeed<NewsResponse>(
    `/api/news?symbol=${company.ticker}`,
    180000,
    auto,
  );
  const quotes = market.data?.quotes || [];
  const quote =
    range === "3mo"
      ? quotes.find((q) => q.symbol === company.ticker)
      : selected.data?.quotes[0];
  const quoteBySymbol = (s: string) => quotes.find((q) => q.symbol === s);
  const active = navigation.find((n) => n.id === page);
  const navigate = (id: string) => {
    setPage(id);
    setMobile(false);
  };
  const refresh = () => {
    market.refresh();
    selected.refresh();
    news.refresh();
    window.dispatchEvent(new Event("zentai-refresh"));
  };
  return (
    <div className="app-shell">
      {mobile && (
        <button
          aria-label="Close navigation overlay"
          className="overlay"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`sidebar ${mobile ? "is-open" : ""}`}>
        <a className="brand" href="/" aria-label="Zentai home">
          <span className="brand-symbol">Z</span>
          <span>
            ZENTAI<small>NETWORKS</small>
          </span>
        </a>
        <div className="workspace-label">
          <span className="workspace-avatar">S</span>
          <div>
            Intelligence workspace<small>Market research terminal</small>
          </div>
          <ChevronDown size={14} />
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav aria-label="Main navigation">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={page === id ? "active" : ""}
              onClick={() => navigate(id)}
            >
              <Icon size={17} />
              {label}
              {id === "news" && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="watchlist-title">
          <span>YOUR WATCHLIST</span>
          <Star size={12} />
        </div>
        <div className="sidebar-watchlist">
          {companies
            .filter((c) => favorites.includes(c.ticker))
            .map((c) => (
              <button
                key={c.key}
                onClick={() => {
                  setCompany(c);
                  navigate("overview");
                }}
              >
                <span className="tiny-dot" style={{ background: c.color }} />
                <span>{c.ticker}</span>
                <Change value={quoteBySymbol(c.ticker)?.changePercent} />
              </button>
            ))}
          {!favorites.length && (
            <small>Star companies in the market table.</small>
          )}
        </div>
        <div className="sidebar-bottom">
          <div className="data-card">
            <span className="status-dot" />
            <strong>Source-aware intelligence</strong>
            <p>
              Public market feeds.
              <br />
              Every observation has a timestamp.
            </p>
          </div>
          <button
            className="method-link"
            onClick={() => navigate("methodology")}
          >
            <CircleHelp size={16} />
            Data & methodology
            <ArrowRight size={14} />
          </button>
          <div className="profile">
            <span className="profile-avatar">ZN</span>
            <div>
              Zentai Research<small>Personal workspace</small>
            </div>
            <span className="version">v2.0</span>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu icon-button"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={20} />
            </button>
            <span>Workspace</span>
            <span>/</span>
            <strong>{active?.label || "Data & methodology"}</strong>
          </div>
          <div className="topbar-right">
            <span className="public-badge">
              <span className="status-dot" /> PUBLIC FEEDS
            </span>
            <span className="avatar">ZN</span>
          </div>
        </header>
        <main>
          <div className="page-header">
            <div>
              <p className="eyebrow">THE BIG PICTURE, IN FOCUS</p>
              <h1>
                {active?.label || "Data & methodology"}
                <span className="title-dot">.</span>
              </h1>
              <p className="subtitle">
                {page === "overview"
                  ? "Follow the market. Understand the signals. Make informed decisions."
                  : `Explore ${company.name} with transparent sources and reproducible analytics.`}
              </p>
            </div>
            <div className="header-actions">
              <button
                className="button"
                onClick={refresh}
                disabled={market.loading}
              >
                <RefreshCw size={15} className={market.loading ? "spin" : ""} />
                Refresh data
              </button>
              <button className="button primary" onClick={() => setBrief(true)}>
                <Sparkles size={15} />
                Quick briefing
              </button>
            </div>
          </div>
          <div className="control-strip">
            <div className="entity-control">
              <Search size={15} />
              <label htmlFor="company" className="sr-only">
                Select company
              </label>
              <select
                id="company"
                value={company.key}
                onChange={(e) =>
                  setCompany(companies.find((c) => c.key === e.target.value)!)
                }
              >
                {companies.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.name} · {c.ticker}
                  </option>
                ))}
              </select>
            </div>
            <div className="refresh-control">
              <span className={`status-dot ${auto ? "" : "paused"}`} />
              <span>{auto ? "Auto refresh" : "Refresh paused"}</span>
              <label htmlFor="refresh-interval" className="sr-only">
                Price refresh interval
              </label>
              <select
                id="refresh-interval"
                value={interval}
                onChange={(e) => setIntervalMs(Number(e.target.value))}
              >
                <option value={60000}>60 sec</option>
                <option value={120000}>2 min</option>
                <option value={300000}>5 min</option>
              </select>
              <button
                className="icon-button"
                aria-label={
                  auto ? "Pause automatic refresh" : "Resume automatic refresh"
                }
                onClick={() => setAuto(!auto)}
              >
                {auto ? <Pause size={14} /> : <Play size={14} />}
              </button>
            </div>
          </div>
          {page === "overview" && (
            <>
              <FeedStatus
                {...market}
                hasData={!!market.data}
                retry={market.refresh}
              />
              <div className="macro-grid">
                {[
                  { symbol: "SPY", name: "S&P 500 ETF", tag: "US EQUITIES" },
                  {
                    symbol: "^IXIC",
                    name: "NASDAQ Composite",
                    tag: "US EQUITIES",
                  },
                  {
                    symbol: "^VIX",
                    name: "Volatility index",
                    tag: "MARKET RISK",
                  },
                  { symbol: "GC=F", name: "Gold futures", tag: "COMMODITIES" },
                ].map((m) => {
                  const q = quoteBySymbol(m.symbol);
                  return (
                    <article className="macro-card" key={m.symbol}>
                      <div>
                        <span className="eyebrow">{m.tag}</span>
                        <Activity size={15} />
                      </div>
                      <h3>{m.name}</h3>
                      <div className="macro-value">
                        <strong>
                          {m.symbol === "SPY" || m.symbol === "GC=F"
                            ? money(q?.price)
                            : number(q?.price)}
                        </strong>
                        <Change value={q?.changePercent} />
                      </div>
                      <small>
                        {q
                          ? `As of ${date(q.asOf)}`
                          : market.loading
                            ? "Loading source…"
                            : "Feed unavailable"}
                      </small>
                    </article>
                  );
                })}
              </div>
              <div className="overview-grid">
                <section className="panel price-panel">
                  <div className="stock-heading">
                    <div className="stock-name">
                      <CompanyBadge company={company} />
                      <div>
                        <h2>
                          {company.name}
                          <span className="ticker-tag">{company.ticker}</span>
                        </h2>
                        <p>
                          {company.sector} <span>·</span>{" "}
                          {quote?.exchange || "Public market data"}
                        </p>
                      </div>
                    </div>
                    <button
                      className={`icon-button star ${favorites.includes(company.ticker) ? "selected" : ""}`}
                      aria-label={`Toggle ${company.ticker} watchlist`}
                      onClick={() => toggleFavorite(company.ticker)}
                    >
                      <Star
                        size={19}
                        fill={
                          favorites.includes(company.ticker)
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>
                  </div>
                  <div className="price-row">
                    <div>
                      <strong>{money(quote?.price, quote?.currency)}</strong>
                      <Change value={quote?.changePercent} />
                    </div>
                    <span className="quiet-badge">
                      {quote?.marketState || "Awaiting quote"}
                    </span>
                  </div>
                  <div className="chart-controls">
                    <span>PRICE PERFORMANCE</span>
                    <div className="segmented">
                      {ranges.map((r) => (
                        <button
                          key={r}
                          className={range === r ? "active" : ""}
                          onClick={() => setRange(r)}
                        >
                          {r.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  {range !== "3mo" && (
                    <FeedStatus
                      {...selected}
                      hasData={!!selected.data}
                      retry={selected.refresh}
                    />
                  )}{" "}
                  {quote?.history.length ? (
                    <PriceChart data={quote.history} />
                  ) : (
                    <Empty
                      text={
                        market.loading || selected.loading
                          ? "Loading historical prices…"
                          : "Historical prices are unavailable. Retry the feed."
                      }
                    />
                  )}
                  <Stamp quote={quote} />
                </section>
                <section className="panel news-preview">
                  <PanelTitle eyebrow="IN THE LOOP" title="Latest headlines">
                    <button
                      className="text-button"
                      onClick={() => navigate("news")}
                    >
                      View all <External size={13} />
                    </button>
                  </PanelTitle>
                  <NewsList feed={news} compact />
                  <div className="panel-bottom">
                    <span className="status-dot" />
                    {auto
                      ? "News checks every 3 minutes"
                      : "News refresh paused"}
                  </div>
                </section>
              </div>
              <section className="panel market-table">
                <PanelTitle
                  eyebrow="YOUR INVESTMENT UNIVERSE"
                  title="Company watch"
                >
                  <div className="table-search">
                    <Search size={14} />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Find a company…"
                      aria-label="Search company table"
                    />
                  </div>
                </PanelTitle>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Company</th>
                        <th>Sector</th>
                        <th>Last price</th>
                        <th>Day change</th>
                        <th>Quote time</th>
                        <th>
                          <Star size={12} />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {companies
                        .filter((c) =>
                          `${c.name} ${c.ticker}`
                            .toLowerCase()
                            .includes(search.toLowerCase()),
                        )
                        .map((c) => {
                          const q = quoteBySymbol(c.ticker);
                          return (
                            <tr
                              key={c.key}
                              className={
                                company.key === c.key ? "selected-row" : ""
                              }
                            >
                              <td>
                                <button
                                  className="company-cell"
                                  onClick={() => setCompany(c)}
                                >
                                  <CompanyBadge company={c} />
                                  <span>
                                    {c.name}
                                    <small>{c.ticker}</small>
                                  </span>
                                </button>
                              </td>
                              <td>
                                <span className="sector-tag">{c.sector}</span>
                              </td>
                              <td className="numeric">
                                {money(q?.price, q?.currency)}
                              </td>
                              <td>
                                <Change value={q?.changePercent} />
                              </td>
                              <td className="muted">
                                {q ? date(q.asOf) : "Unavailable"}
                              </td>
                              <td>
                                <button
                                  className={`icon-button star ${favorites.includes(c.ticker) ? "selected" : ""}`}
                                  aria-label={`Toggle ${c.ticker} watchlist`}
                                  onClick={() => toggleFavorite(c.ticker)}
                                >
                                  <Star
                                    size={15}
                                    fill={
                                      favorites.includes(c.ticker)
                                        ? "currentColor"
                                        : "none"
                                    }
                                  />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
                {market.data?.errors.length ? (
                  <p className="source">
                    Some quotes are unavailable:{" "}
                    {market.data.errors.map((e) => e.symbol).join(", ")}. Other
                    observations remain visible.
                  </p>
                ) : null}
              </section>
            </>
          )}
          {page === "news" && (
            <section className="panel full-news">
              <PanelTitle
                eyebrow="COMPANY NEWS · LAST 7 DAYS"
                title={`${company.name} in the news`}
              >
                <span className="quiet-badge">
                  {news.data?.source || "Public RSS"}
                </span>
              </PanelTitle>
              <NewsList feed={news} />
            </section>
          )}
          {page === "financials" && (
            <div className="stack">
              <section className="panel">
                <PanelTitle
                  eyebrow="REPORTED FUNDAMENTALS"
                  title={`${company.name} financials`}
                />
                <Analytics section="financials" company={company} auto={auto}>
                  {(d) => (
                    <>
                      <div className="metric-grid">
                        <Metric
                          label="Quarterly revenue"
                          value={
                            d.latest_kpis?.revenue_m == null
                              ? "—"
                              : `${money(d.latest_kpis.revenue_m)}M`
                          }
                        />
                        <Metric
                          label="Net margin"
                          value={pct(d.latest_kpis?.net_margin_pct)}
                        />
                        <Metric
                          label="Revenue growth · QoQ"
                          value={pct(d.latest_kpis?.revenue_growth_pct)}
                        />
                        <Metric
                          label="Cash & equivalents"
                          value={
                            d.latest_kpis?.cash_m == null
                              ? "—"
                              : `${money(d.latest_kpis.cash_m)}M`
                          }
                        />
                      </div>
                      <FinancialChart data={d.quarterly || []} />
                      <p className="note">
                        Reported fiscal quarters, not streaming financials.
                        Missing values remain unavailable. Sector accounting
                        differences can limit direct comparisons.
                      </p>
                    </>
                  )}
                </Analytics>
              </section>
              <section className="panel">
                <PanelTitle
                  eyebrow="VALUATION SCENARIO"
                  title="Discounted cash flow"
                />
                <Analytics section="valuation" company={company} auto={auto}>
                  {(d) => (
                    <>
                      <div className="metric-grid">
                        <Metric
                          label="Market price"
                          value={money(d.current_price)}
                        />
                        <Metric
                          label="Model estimate / share"
                          value={money(d.intrinsic_value)}
                        />
                        <Metric
                          label="Implied upside"
                          value={pct(d.upside_pct)}
                        />
                        <Metric
                          label="Margin of safety"
                          value={pct(d.margin_of_safety_pct)}
                        />
                      </div>
                      <p className="note">
                        Assumptions: growth{" "}
                        {pct(d.assumptions?.growth_rate * 100)}, discount rate{" "}
                        {pct(d.assumptions?.discount_rate * 100)}, terminal
                        growth {pct(d.assumptions?.terminal_growth * 100)}. This
                        is a simplified valuation scenario.
                      </p>
                    </>
                  )}
                </Analytics>
              </section>
              <Comparison company={company} auto={auto} />
            </div>
          )}
          {page === "risk" && (
            <div className="stack">
              <section className="panel">
                <PanelTitle
                  eyebrow="MODEL-DERIVED · DAILY HISTORY"
                  title="Risk intelligence"
                />
                <Analytics section="risk" company={company} auto={auto}>
                  {(d) => (
                    <>
                      <div className="metric-grid">
                        <Metric
                          label="Relative anomaly score"
                          value={`${number(d.current_risk_score, 1)} / 100`}
                          detail={d.risk_label}
                        />
                        <Metric
                          label="Annualized volatility"
                          value={pct(d.volatility_pct)}
                        />
                        <Metric
                          label="Current drawdown"
                          value={pct(d.drawdown_pct)}
                        />
                        <Metric
                          label="Historical 5th percentile"
                          value={pct(d.var_95_pct)}
                          detail="One-day return distribution"
                        />
                      </div>
                      <Lines
                        data={(d.timeline || []).map((r: any) => ({
                          date: r.Date,
                          "Anomaly score": r.risk,
                        }))}
                        keys={["Anomaly score"]}
                      />
                      <p className="note">
                        Anomaly scores measure unusual market behavior within
                        the training history. They are not probabilities of
                        loss. News sentiment:{" "}
                        {d.nlp_sentiment?.label || "unavailable"}.
                      </p>
                    </>
                  )}
                </Analytics>
              </section>
              <Options company={company} auto={auto} />
            </div>
          )}
          {page === "portfolio" && <Portfolio auto={auto} />}
          {page === "backtest" && <Backtest company={company} />}
          {page === "operations" && (
            <Operations company={company} auto={auto} />
          )}
          {page === "methodology" && <Methodology />}
          <footer>
            <span>
              <span className="mini-brand">Z</span> ZENTAI NETWORKS
            </span>
            <p>
              Public feeds may be delayed. Estimates and scenarios are labeled.
            </p>
            <button onClick={() => navigate("methodology")}>
              Sources & methodology <External size={12} />
            </button>
          </footer>
        </main>
      </div>
      {brief && (
        <div className="modal-backdrop" onClick={() => setBrief(false)}>
          <section
            className="briefing-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="brief-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="icon-button close"
              aria-label="Close briefing"
              onClick={() => setBrief(false)}
            >
              <X size={20} />
            </button>
            <div className="brief-icon">
              <Sparkles size={25} />
            </div>
            <p className="eyebrow">OBSERVATION-BASED SUMMARY</p>
            <h2 id="brief-title">Your {company.name} briefing</h2>
            {quote ? (
              <p>
                The latest reported price is{" "}
                <strong>{money(quote.price, quote.currency)}</strong>, with a
                day change of <strong>{pct(quote.changePercent)}</strong>. This
                observation was reported at {date(quote.asOf)} by {quote.source}
                .
              </p>
            ) : (
              <p>
                The current quote is unavailable. No price conclusion can be
                drawn.
              </p>
            )}
            <p>
              {news.data?.articles.length
                ? `${news.data.articles.length} recent headlines are available. The latest: “${news.data.articles[0].title}”`
                : "No verified timestamped headlines are available in this snapshot."}
            </p>
            <p className="note">
              This summary uses the displayed snapshot. It is not an AI forecast
              or a trading recommendation.
            </p>
            <button
              className="button primary"
              onClick={() => {
                setBrief(false);
                navigate("financials");
              }}
            >
              Explore company research <ArrowRight size={15} />
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
function NewsList({
  feed,
  compact = false,
}: {
  feed: ReturnType<typeof useFeed<NewsResponse>>;
  compact?: boolean;
}) {
  return (
    <>
      <FeedStatus {...feed} hasData={!!feed.data} retry={feed.refresh} />
      <div className={compact ? "news-list" : "news-grid"}>
        {feed.data?.articles.slice(0, compact ? 4 : 24).map((a, i) => (
          <a
            className="news-item"
            key={a.id}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="news-meta">
              <span>{a.publisher}</span>
              <span>{date(a.publishedAt)}</span>
            </div>
            <h3>{a.title}</h3>
            <div className="news-bottom">
              <span>COMPANY NEWS</span>
              <External size={14} />
            </div>
          </a>
        ))}
      </div>
      {feed.data && !feed.data.articles.length && (
        <Empty text="No timestamped headlines found in the past seven days." />
      )}
      {!compact && feed.data && (
        <p className="source">
          {feed.data.warning} · Fetched {date(feed.data.fetchedAt)}
        </p>
      )}
    </>
  );
}
function Options({ company, auto }: { company: Company; auto: boolean }) {
  return (
    <>
      <section className="panel">
        <PanelTitle
          eyebrow="REPORTED CONTRACT ACTIVITY"
          title="Options activity"
        />
        <Analytics section="options" company={company} auto={auto}>
          {(d) => (
            <div className="metric-grid">
              <Metric label="Call volume" value={number(d.call_volume, 0)} />
              <Metric label="Put volume" value={number(d.put_volume, 0)} />
              <Metric
                label="Put / call ratio"
                value={number(d.put_call_ratio)}
              />
              <Metric label="Expiration" value={d.expiration_date} />
            </div>
          )}
        </Analytics>
      </section>
      <section className="panel">
        <PanelTitle eyebrow="REPORTED TRANSACTIONS" title="Insider activity" />
        <Analytics section="insiders" company={company} auto={auto}>
          {(d) =>
            d.transactions?.length ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Insider</th>
                      <th>Action</th>
                      <th>Shares</th>
                      <th>Reported value</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.transactions.map((t: any, i: number) => (
                      <tr key={i}>
                        <td>
                          {t.name}
                          <small className="block muted">{t.position}</small>
                        </td>
                        <td>{t.action}</td>
                        <td>{number(t.shares, 0)}</td>
                        <td>{money(t.value_usd)}</td>
                        <td>{t.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty text="No insider transactions are currently available from this provider. This does not establish that no transactions occurred." />
            )
          }
        </Analytics>
      </section>
    </>
  );
}
function Comparison({ company, auto }: { company: Company; auto: boolean }) {
  const [other, setOther] = useState("microsoft");
  const key =
    other === company.key
      ? "apple" === company.key
        ? "nvidia"
        : "apple"
      : other;
  const left = useFeed<any>(
      `/api/analytics?section=financials&company=${company.key}`,
      300000,
      auto,
    ),
    right = useFeed<any>(
      `/api/analytics?section=financials&company=${key}`,
      300000,
      auto,
    );
  return (
    <section className="panel">
      <PanelTitle
        eyebrow="REPORTED METRICS · NO SIMULATED SCORES"
        title="Company comparison"
      >
        <select
          aria-label="Comparison company"
          value={key}
          onChange={(e) => setOther(e.target.value)}
        >
          {companies
            .filter((c) => c.key !== company.key)
            .map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
        </select>
      </PanelTitle>
      <FeedStatus {...left} hasData={!!left.data} retry={left.refresh} />
      <FeedStatus {...right} hasData={!!right.data} retry={right.refresh} />
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>{company.name}</th>
              <th>{companies.find((c) => c.key === key)?.name}</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Revenue ($M)", "revenue_m"],
              ["Net margin (%)", "net_margin_pct"],
              ["Revenue growth QoQ (%)", "revenue_growth_pct"],
              ["Debt / assets", "debt_to_assets"],
            ].map(([label, field]) => (
              <tr key={field}>
                <td>{label}</td>
                <td>{number(left.data?.latest_kpis?.[field])}</td>
                <td>{number(right.data?.latest_kpis?.[field])}</td>
              </tr>
            ))}
            <tr>
              <td>Fiscal period</td>
              <td>{left.data?.as_of || "—"}</td>
              <td>{right.data?.as_of || "—"}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
function Portfolio({ auto }: { auto: boolean }) {
  const [capital, setCapital] = useState(10000),
    [symbols, setSymbols] = useState<string[]>(companies.map((c) => c.ticker)),
    [request, setRequest] = useState<string | null>(null);
  const feed = useFeed<any>(request, 0, false);
  return (
    <section className="panel">
      <PanelTitle
        eyebrow="HISTORICAL RISK ALLOCATION"
        title="Build a balanced allocation"
      />
      <p className="note">
        Inverse-volatility weighting assigns less weight to more volatile
        assets. It does not solve an efficient frontier or guarantee future
        returns.
      </p>
      <div className="form-row">
        <label>
          Investment capital (USD)
          <input
            type="number"
            min={100}
            max={1e9}
            value={capital}
            onChange={(e) => {
              setCapital(Number(e.target.value));
              setRequest(null);
            }}
          />
        </label>
        <button
          className="button primary"
          disabled={
            feed.loading ||
            symbols.length < 2 ||
            capital < 100 ||
            !Number.isFinite(capital)
          }
          onClick={() => {
            const url = `/api/analytics?section=portfolio&capital=${capital}&symbols=${symbols.join(",")}`;
            if (url === request) feed.refresh();
            else setRequest(url);
          }}
        >
          <SlidersHorizontal size={15} />
          Calculate allocation
        </button>
      </div>
      <div className="asset-picker">
        {companies.map((c) => (
          <label key={c.key}>
            <input
              type="checkbox"
              checked={symbols.includes(c.ticker)}
              onChange={() => {
                setSymbols((s) =>
                  s.includes(c.ticker)
                    ? s.filter((v) => v !== c.ticker)
                    : [...s, c.ticker],
                );
                setRequest(null);
              }}
            />
            {c.ticker}
          </label>
        ))}
      </div>
      <FeedStatus {...feed} hasData={!!feed.data} retry={feed.refresh} />
      {feed.data && (
        <>
          <div className="metric-grid">
            <Metric
              label="Historical annualized return"
              value={pct(feed.data.expected_annual_return_pct)}
            />
            <Metric
              label="Annualized volatility"
              value={pct(feed.data.annual_volatility_pct)}
            />
            <Metric
              label="Historical Sharpe ratio"
              value={number(feed.data.sharpe_ratio)}
              detail="Risk-free rate assumed 0%"
            />
          </div>
          <div className="allocations">
            {Object.entries(feed.data.optimal_weights).map(([ticker, w]) => (
              <div className="allocation-row" key={ticker}>
                <strong>{ticker}</strong>
                <div className="allocation-track">
                  <span style={{ width: `${w}%` }} />
                </div>
                <span>{number(w)}%</span>
                <strong>{money(feed.data.dollar_allocations[ticker])}</strong>
              </div>
            ))}
          </div>
          <p className="source">
            History through {feed.data.as_of}. Allocation reflects inputs at the
            time Calculate was pressed.
          </p>
        </>
      )}
    </section>
  );
}
function Backtest({ company }: { company: Company }) {
  const [strategy, setStrategy] = useState("SMA Crossover"),
    [period, setPeriod] = useState("5y"),
    [cost, setCost] = useState(10),
    [request, setRequest] = useState<string | null>(null);
  useEffect(() => setRequest(null), [company.key]);
  const feed = useFeed<any>(request, 0, false);
  return (
    <section className="panel">
      <PanelTitle
        eyebrow="REPRODUCIBLE HISTORICAL SIMULATION"
        title={`${company.name} strategy backtester`}
      />
      <p className="note">
        Signals are lagged by one session. Results use adjusted close-to-close
        returns with per-side trading costs, not simulated opening-price fills.
      </p>
      <div className="form-row">
        <label>
          Strategy
          <select
            value={strategy}
            onChange={(e) => {
              setStrategy(e.target.value);
              setRequest(null);
            }}
          >
            {["SMA Crossover", "RSI Mean Reversion", "MACD Momentum"].map(
              (s) => (
                <option key={s}>{s}</option>
              ),
            )}
          </select>
        </label>
        <label>
          History
          <select
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value);
              setRequest(null);
            }}
          >
            {["1y", "2y", "5y", "10y"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Cost per side (bps)
          <input
            type="number"
            min={0}
            max={100}
            value={cost}
            onChange={(e) => {
              setCost(Number(e.target.value));
              setRequest(null);
            }}
          />
        </label>
        <button
          className="button primary"
          disabled={
            feed.loading || !Number.isFinite(cost) || cost < 0 || cost > 100
          }
          onClick={() => {
            const url = `/api/analytics?section=backtest&company=${company.key}&strategy=${encodeURIComponent(strategy)}&period=${period}&cost=${cost}`;
            if (request === url) feed.refresh();
            else setRequest(url);
          }}
        >
          <Play size={14} />
          Run simulation
        </button>
      </div>
      <FeedStatus {...feed} hasData={!!feed.data} retry={feed.refresh} />
      {feed.data && (
        <>
          <div className="metric-grid">
            <Metric
              label="Strategy return"
              value={pct(feed.data.strategy_return_pct)}
            />
            <Metric
              label="Buy & hold return"
              value={pct(feed.data.buyhold_return_pct)}
            />
            <Metric
              label="Max drawdown"
              value={pct(feed.data.max_drawdown_pct)}
            />
            <Metric
              label="Position changes"
              value={number(feed.data.trades_executed, 0)}
            />
          </div>
          <Lines
            data={feed.data.dates.map((d: string, i: number) => ({
              date: d,
              Strategy: feed.data.strategy_curve[i],
              "Buy & hold": feed.data.buyhold_curve[i],
            }))}
            keys={["Strategy", "Buy & hold"]}
          />
          <p className="source">
            Growth of $1. Effective period: {feed.data.dates[0]} –{" "}
            {feed.data.as_of}. Indicator warm-up is excluded.
          </p>
        </>
      )}
    </section>
  );
}
function Operations({ company, auto }: { company: Company; auto: boolean }) {
  return (
    <div className="stack">
      <section className="panel">
        <PanelTitle
          eyebrow="STATIC REFERENCE · SCENARIO EXPOSURE"
          title="Operating footprint"
        />
        <p className="note">
          These facility locations and geopolitical zones are curated reference
          data. Proximity indicates a scenario exposure, not a verified
          disruption or current operating status.
        </p>
        <Analytics section="geography" company={company} auto={false}>
          {(d) => (
            <div className="nodes-grid">
              {d.nodes?.map((n: any) => (
                <div className="node-card" key={n.name}>
                  <Globe2 size={22} />
                  <h3>{n.name}</h3>
                  <p>{n.type}</p>
                  <small>
                    {n.lat.toFixed(2)}°, {n.lon.toFixed(2)}°
                  </small>
                  <span className="quiet-badge">
                    {n.risk_factor === "None"
                      ? "Outside reference zones"
                      : n.risk_factor}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Analytics>
      </section>
      <section className="panel">
        <PanelTitle
          eyebrow="EXPLORATORY ANALYSIS"
          title="Historical pattern match"
        />
        <Analytics section="history" company={company} auto={auto}>
          {(d) => (
            <>
              <div className="metric-grid">
                <Metric
                  label="Historical window"
                  value={d.match_start}
                  detail={`Through ${d.match_end}`}
                />
                <Metric
                  label="Pearson correlation"
                  value={`${number(d.correlation_score)}%`}
                />
                <Metric
                  label="Subsequent historical return"
                  value={pct(d.shadow_projected_return_pct)}
                  detail="30 trading sessions after the match"
                />
              </div>
              <PriceChart
                data={d.current_ohlc.Date.map((date: string, i: number) => ({
                  date,
                  close: d.current_ohlc.Close[i],
                }))}
              />
              <p className="note">
                The closest match is selected from many historical windows.
                Correlation is not a forecast probability. The subsequent
                historical return is not a predicted future return.
              </p>
            </>
          )}
        </Analytics>
      </section>
    </div>
  );
}
function Methodology() {
  return (
    <div className="stack">
      <section className="panel prose">
        <PanelTitle
          eyebrow="TRANSPARENCY BY DESIGN"
          title="Know what you are looking at"
        />
        <h3>Prices & automatic refresh</h3>
        <p>
          Yahoo Finance supplies timestamped quotes and price history. The
          public feed may be delayed and can fail or be rate-limited. Automatic
          checks run every 60 seconds by default while the browser tab is
          visible. News checks every 3 minutes; analytical screens every 5
          minutes. Refreshing does not make a delayed source real-time. The
          displayed quote timestamp always refers to the provider observation.
        </p>
        <h3>News</h3>
        <p>
          Google News RSS matches headlines by company name. We retain source
          links and publication times, deduplicate stories, exclude future-dated
          stories and limit the feed to seven days. Headlines are publisher
          claims, not independently verified facts.
        </p>
        <h3>Calculations, not certainty</h3>
        <p>
          The risk model measures relative anomalies, the portfolio lab uses
          inverse volatility, and the DCF is an assumption-based approximation.
          Backtests include per-side costs and lagged positions. Historical
          similarity is exploratory. None of these outputs is a calibrated
          prediction or a guarantee.
        </p>
        <h3>No manufactured observations</h3>
        <p>
          Missing values stay missing. Options activity does not reveal who
          traded or where they were located. Geography is a static reference.
          Sentiment remains unavailable unless a sentiment model is explicitly
          configured. A feed failure is never silently converted into a neutral
          or positive assessment.
        </p>
        <h3>Source references</h3>
        <div className="reference-links">
          <a href="https://finance.yahoo.com/" target="_blank" rel="noreferrer">
            Yahoo Finance <External size={14} />
          </a>
          <a href="https://news.google.com/" target="_blank" rel="noreferrer">
            Google News <External size={14} />
          </a>
          <a
            href="https://www.sec.gov/edgar/search/"
            target="_blank"
            rel="noreferrer"
          >
            SEC filings search <External size={14} />
          </a>
        </div>
      </section>
    </div>
  );
}
