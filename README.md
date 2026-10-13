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
- Specific event headlines (reported results, guidance changes, major deals, distress, regulatory actions, and recalls) receive a red "potentially important" cue. This is a transparent keyword screen of the headline, not a verified significance or sentiment score; open the source before acting.
- Financial statements, risk, options, insiders, and history: yfinance. Analytical screens check every 5 minutes. Fundamentals represent reported fiscal periods.
- Analyst report: merges the current market quote, Yahoo quarterly statements and valuation fields, and Google News headlines into one printable view. The sources retain separate observation and fetch times. The internal credit screen uses four quarters of EBITDA plus debt, cash, and assets; banks and missing inputs are not assessed. Its AAA–CCC labels are **not agency ratings** or default probabilities.
- When `SEC_USER_AGENT` is configured with an authorized contact email, the analyst report adds SEC EDGAR company facts and recent filings. It shows each fact's concept, filing form, reporting period, and source link; a matching-period cash check flags a discrepancy rather than silently replacing provider data. SEC requests are server-side and cached by the analytics endpoint. Unavailable EDGAR data is labeled.
- The analyst report has an evidence trail for quote, statement, SEC, credit, and DCF inputs. Each row exposes the source period, calculation, and a provider or filing link. Numeric report revisions are compared across up to 30 observations stored in the browser, including added or removed SEC facts. This is not a complete point-in-time filing archive.
- Editable bear/base/bull DCF scenarios now show whether the model's position relative to the quote survives all cases. An illustrative credit stress recomputes the internal tier after EBITDA −20%, cash −20%, and debt +20%. These are challenges to the model, not probabilities or recommendations.
- The analyst report compares editable P/E, EV/EBITDA, and P/S sensitivities with the DCF base case and current quote. Target multiples start from rounded observed trading ratios, not an inferred peer set; four consecutive quarters, positive inputs, and shares are required. EV/EBITDA and P/S are withheld for financial firms. A selectable 3-month, 1-year, or 5-year price chart overlays today's chosen model levels as reference lines, explicitly not historical model estimates or a backtest. Target multiples are saved in this browser.
- The local track record locks user-entered 30- or 90-day price predictions and later scores them against the first completed Yahoo daily close within seven days of the due date. It displays mean absolute percentage error and directional hit rate only after outcomes exist, and exports raw records as JSON. Predictions and report history live in the browser and are editable by its owner; they are not a public, immutable performance audit. Credit-tier/default validation remains unavailable without point-in-time outcomes and calibration data.
- Hover or focus the info buttons to see formulas and source details. Analyst notes and review state stay in that browser; they are not an institutional audit log, push alert, or approval workflow.
- Explanation popovers show one at a time and stay within their cards. The visual palette uses warm ivory and amber in light mode, with a matching warm dark mode; green remains for positive market values and red for risk and flagged headlines.
- Browser polling pauses in hidden tabs and can be paused manually. Refresh data updates active analytics as well as quotes and news.
- Next.js Data Cache shares quote/news results between requests. Successful Python GET responses use Vercel CDN caching (5 minutes). Errors are not cached. A failed update retains the last successful browser snapshot with an error banner. Quote caches older than 5 minutes are labeled.
- Portfolio and backtest jobs run on demand. Their outputs are explicitly historical, with the effective data period shown.
- Optional `FINNHUB_API_KEY` enables an alternate quote/news provider. Keep it server-side in Vercel environment settings. Subscription entitlements control coverage. No API key is needed for the default public feeds.

No exchange-wide, tick-level real-time guarantee is made. A public provider can rate-limit or omit data. The interface shows missing data instead of inventing values.

## Features

Market overview, persistent local watchlist, searchable company table, chart ranges, newsroom, quarterly research, printable equity-and-credit analyst report, company comparisons, DCF scenarios, Isolation Forest anomalies, options volume, insider activity, inverse-volatility portfolios, three backtest strategies, historical pattern matching, static operating-footprint references, and observation-based briefings.

## Correctness decisions

- Chart-range baselines are never treated as prior-day closes. Daily moves use a separate one-day quote response.
- Portfolio weights are aligned by ticker, not data-frame position. Missing assets and zero-volatility histories fail explicitly.
- DCF requires positive real inputs. No artificial 5% upside fallback. Assumptions and the simplified FCF-per-share methodology are exposed.
- Internal credit tiers are a transparent, deterministic screen based on net debt/TTM EBITDA (45%), debt/assets (30%), and cash/debt (25%). Interest coverage is context only. This is not an S&P, Moody's, or Fitch rating, and financial issuers are excluded because they require a different model.
- Current ratio and the SEC-tagged current portion of long-term debt are context only. Covenant terms and a complete debt maturity schedule require review of the original filing; the report does not infer them from incomplete structured data. The score has not been calibrated to defaults and must not be used as a lending decision.
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
