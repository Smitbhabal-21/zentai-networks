# Zentai Networks

A Next.js market research dashboard with Python analytics, deployed together on Vercel. Public feeds are used by default. Prices and news refresh automatically while the tab is visible; provider timestamps and delays remain visible.

## Run locally

Requires Node.js 22 and Python 3.12 or newer.

```sh
npm ci
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
PYTHON_BIN=.venv/bin/python bash start.sh
```

Open http://127.0.0.1:3000. Next.js proxies `/api/analytics` to the Python server on port 5328 in development.

## Data and refresh

- Quotes and history: Yahoo Finance chart API. Default price polling: 60 seconds; optional 2 or 5 minutes. Public quotes may be delayed. The last regular-session quote remains visible outside market hours.
- News: Google News RSS, queried by company name over the past 7 days. Publication times and source links are required; duplicate titles and URLs are removed. Checks every 3 minutes.
- Financial statements, risk, options, insiders, and history: yfinance. Analytical screens check every 5 minutes. Fundamentals represent reported fiscal periods.
- Browser polling pauses in hidden tabs and can be paused manually. Refresh data updates active analytics as well as quotes and news.
- Next.js Data Cache shares quote/news results between requests. Successful Python GET responses use Vercel CDN caching (5 minutes). Errors are not cached. A failed update retains the last successful browser snapshot with an error banner. Quote caches older than 5 minutes are labeled.
- Portfolio and backtest jobs run on demand. Their outputs are explicitly historical, with the effective data period shown.
- Optional `FINNHUB_API_KEY` enables an alternate quote/news provider. Keep it server-side in Vercel environment settings. Subscription entitlements control coverage. No API key is needed for the default public feeds.

No exchange-wide, tick-level real-time guarantee is made. A public provider can rate-limit or omit data. The interface shows missing data instead of inventing values.

## Features

Market overview, persistent local watchlist, searchable company table, chart ranges, newsroom, quarterly research, company comparisons, DCF scenarios, Isolation Forest anomalies, options volume, insider activity, inverse-volatility portfolios, three backtest strategies, historical pattern matching, static operating-footprint references, and observation-based briefings.

## Correctness decisions

- Chart-range baselines are never treated as prior-day closes. Daily moves use a separate one-day quote response.
- Portfolio weights are aligned by ticker, not data-frame position. Missing assets and zero-volatility histories fail explicitly.
- DCF requires positive real inputs. No artificial 5% upside fallback. Assumptions and the simplified FCF-per-share methodology are exposed.
- Unavailable sentiment stays unavailable. FinBERT is optional and disabled by default; the cloud function does not install or download PyTorch. SHAP is optional; unavailable explanations are never randomized.
- Options volume does not identify buyers, institutions, geography, or order direction. The production UI displays only reported aggregates.
- Static operational geography is a scenario reference, not a current incident feed.
- Backtests use adjusted close-to-close returns, one-session lagged positions, and user-specified per-side costs (default 10 bps). This is not an opening-fill simulation.
- Inverse-volatility allocations are not claimed to be an optimized efficient frontier. Historical Sharpe assumes a zero risk-free rate.

## Checks

```sh
npm test
npm run build
.venv/bin/python -m unittest discover -s tests -p 'test_*.py' -v
```

## Vercel deployment

```sh
npx vercel deploy
npx vercel deploy --prod
```

`vercel.json` configures Next.js and `/api/analytics.py`; `.python-version` selects Python 3.12. The Python function has a 60-second maximum duration. Vercel's Git connection deploys changes pushed to the configured production branch and creates previews for other branches. Browser data refresh does not require cron jobs or a redeployment.

## Legacy material

`streamlit_app.py` and `requirements-streamlit.txt` retain the earlier Python UI for local reference. `Article_Draft.md`, the capstone slides, and generated Word/PowerPoint files are historical project materials and can describe earlier or proposed architectures. They are not production deployment instructions. The new application does not expose simulated incident feeds, legacy strategic directives, or capstone claims as live observations.
