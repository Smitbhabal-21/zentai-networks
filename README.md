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
- Signal map: the 10 supported U.S. stocks are ranked from five disclosed rules using 10- and 30-observation price averages, a 20-observation move, latest move, and volume relative to the preceding 20 observations. Company drilldown shows model-state changes and the factors behind the current score. Headline links are context, not claimed causes or trade signals. Daily chart observations can be incomplete during market hours.
- Options lab: public Yahoo call-chain bid/ask snapshots for up to three expirations support a long-call and debit-call-spread comparison. Users can edit strikes, premiums, contract count, multiplier, and loss budget. The chart shows at-expiration payoff, not pre-expiration option value or a probability of profit. If the public chain fails, manual scenarios remain available and are labeled as such.
- Analyst report: merges the current market quote, Yahoo quarterly statements and valuation fields, and Google News headlines into one printable view. The sources retain separate observation and fetch times. The internal balance-sheet screen uses four quarters of EBITDA plus debt, cash, and assets; banks and missing inputs are not assessed. Its Low/Moderate/Elevated/High concern bands are **not agency ratings** or default probabilities.
- When `SEC_USER_AGENT` is configured with an authorized contact email, the analyst report adds SEC EDGAR company facts and recent filings. It shows each fact's concept, filing form, reporting period, and source link; matching-period cash and asset checks flag discrepancies rather than silently replacing provider data. SEC requests are server-side and cached by the analytics endpoint. Unavailable EDGAR data is labeled.
- The analyst report marks market quote, reported statements, primary filing facts, source reconciliation, and valuation inputs as present, missing, or needing review. A downloadable evidence JSON includes the dated inputs, linked source points, saved model assumptions, notes, and model version for offline review. Presence is not a quality certification.
- The analyst report has an evidence trail for quote, statement, SEC, credit, and DCF inputs. Each row exposes the source period, calculation, and a provider or filing link. Numeric report revisions are compared across up to 30 observations stored in the browser, including added or removed SEC facts. This is not a complete point-in-time filing archive.
- Editable bear/base/bull DCF scenarios now show whether the model's position relative to the quote survives all cases. An illustrative credit stress recomputes the internal concern band after EBITDA −20%, cash −20%, and debt +20%. These are challenges to the model, not probabilities or recommendations.
- The analyst report compares editable P/E, EV/EBITDA, and P/S sensitivities with the DCF base case and current quote. Target multiples start from rounded observed trading ratios, not an inferred peer set; four consecutive quarters, positive inputs, and shares are required. EV/EBITDA and P/S are withheld for financial firms. A selectable 3-month, 1-year, or 5-year price chart overlays today's chosen model levels as reference lines, explicitly not historical model estimates or a backtest. It summarizes range return, largest adjacent move, and peak-to-trough drawdown. Recent headlines and linked SEC filing dates are marked near chart observations; headlines show adjacent price changes and source links. Event timing is context, not evidence of causation. The current credit snapshot is dated separately. Target multiples are saved in this browser.
- The local track record locks user-entered 30- or 90-day price predictions and later scores them against the first completed Yahoo daily close within seven days of the due date. It displays mean absolute percentage error and directional hit rate only after outcomes exist, and exports raw records as JSON. Predictions and report history live in the browser and are editable by its owner; they are not a public, immutable performance audit. Credit-tier/default validation remains unavailable without point-in-time outcomes and calibration data.
- Hover or focus the info buttons to see formulas and source details. Analyst notes and review state stay in that browser; they are not an institutional audit log, push alert, or approval workflow.
- Explanation popovers show one at a time and stay within their cards. The light and dark palettes use mocha brown, champagne gold, and burnt amber; green and red remain reserved for positive and negative data, risk, and flagged headlines.
- Browser polling pauses in hidden tabs and can be paused manually. Refresh data updates active analytics as well as quotes and news.
- Next.js Data Cache shares quote/news results between requests. Successful Python GET responses use Vercel CDN caching (5 minutes). Errors are not cached. A failed update retains the last successful browser snapshot with an error banner. Quote caches older than 5 minutes are labeled.
- Portfolio and backtest jobs run on demand. Their outputs are explicitly historical, with the effective data period shown.
- Optional `FINNHUB_API_KEY` enables an alternate quote/news provider. Keep it server-side in Vercel environment settings. Subscription entitlements control coverage. No API key is needed for the default public feeds.

No exchange-wide, tick-level real-time guarantee is made. A public provider can rate-limit or omit data. The interface shows missing data instead of inventing values.

## Features

Market overview, explainable signal map, persistent local watchlist, searchable company table, chart ranges, newsroom, quarterly research, printable equity-and-credit analyst report, company comparisons, DCF scenarios, Isolation Forest anomalies, options activity and strategy lab, insider activity, inverse-volatility portfolios, three backtest strategies, historical pattern matching, static operating-footprint references, and observation-based briefings.

## Correctness decisions

- Chart-range baselines are never treated as prior-day closes. Daily moves use a separate one-day quote response.
- Portfolio weights are aligned by ticker, not data-frame position. Missing assets and zero-volatility histories fail explicitly.
- DCF requires positive real inputs. No artificial 5% upside fallback. Assumptions and the simplified FCF-per-share methodology are exposed.
- Internal concern bands are a transparent, deterministic screen based on net debt/TTM EBITDA (45%), debt/assets (30%), and cash/debt (25%). Interest coverage is context only. This is not an S&P, Moody's, or Fitch rating, and financial issuers are excluded because they require a different model.
- Current ratio and the SEC-tagged current portion of long-term debt are context only. Covenant terms and a complete debt maturity schedule require review of the original filing; the report does not infer them from incomplete structured data. The score has not been calibrated to defaults and must not be used as a lending decision.
- Unavailable sentiment stays unavailable. FinBERT is optional and disabled by default; the cloud function does not install or download PyTorch. SHAP is optional; unavailable explanations are never randomized.
- Options volume does not identify buyers, institutions, geography, or order direction. The options lab additionally displays available public call-chain quotes, which can be stale or incomplete; it does not execute trades.
- Static operational geography is a scenario reference, not a current incident feed.
- Backtests use adjusted close-to-close returns, one-session lagged positions, and user-specified per-side costs (default 10 bps). This is not an opening-fill simulation.
- Inverse-volatility allocations are not claimed to be an optimized efficient frontier. Historical Sharpe assumes a zero risk-free rate.

## Checks

```sh
npm test
npm run build
.venv/bin/python -m unittest discover -s tests -p 'test_*.py' -v
```

## FP&A ledger import and optional cloud snapshots

The FP&A workspace starts with sample 2026 expenses. Download its CSV template, fill the `month,unit,account,currency,kind,amount` columns, and map each account to a category. Import requires 120 monthly budget groups and reconciles source values before replacing the current ledger. Actuals may be partial. Preview totals are shown separately by currency; editable FX and forecast drivers are planning assumptions, not imported accounting facts. The 36-month forecast still begins in October 2026. Export JSON before replacing a ledger if you need the earlier local model.

Cloud saving is optional and remains unavailable until the project owner configures Supabase:

1. Create a Supabase project and apply [`supabase/migrations/20261020000000_fpa_snapshots.sql`](supabase/migrations/20261020000000_fpa_snapshots.sql) in its SQL editor. The table has row-level security and per-user read/insert policies; saved snapshots are append-only.
2. Enable email one-time-password sign-in in Supabase Auth. Set the production Site URL to the Vercel URL and include the local development URL in allowed redirects if needed.
3. Copy only the project URL and publishable key into `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the Vercel project settings and local `.env.local`. Redeploy after setting production variables. Never put a service-role key in these variables.
4. Sign in from the FP&A cloud panel and manually save a snapshot. A snapshot can be loaded across devices with the same authenticated account. The local JSON export remains the independent backup.

## Procurement and vendor-spend workspace

Open **FP&A workspace → Procurement & spend** for a construction procurement workspace. It starts with clearly labeled illustrative projects, materials, site supplies, and subcontractor data. Use **Data refresh** to download canonical CSV headers and import five complete exports: `vendors`, `requisitions`, `orders` (POs), `invoices`, and `payments`. The first real CSV clears every sample dataset; subsequent imports replace only their matching dataset. The interface shows missing-source coverage and each file's last import time. CSVs are parsed in the browser, with no ERP connection or background polling. Re-export and re-import current files to refresh.

Vendor IDs connect master records to PRs, POs, and invoices; `req_id`, `po_id`, and `invoice_id` connect the transaction chain. `project_code` and `cost_code` are optional columns on requisitions, POs, and invoices, included in the new templates; older canonical CSVs still import. The workspace shows quarterly and ad-hoc spend by project, cost code, supplier, department, category, fiscal year, and currency, with invoice-level payment traces, open PO commitment, and downloadable draft reports. Currencies stay separate; there is no implicit FX conversion. Exception checks flag duplicate identifiers/invoice numbers, missing links, project/cost-code and vendor/currency mismatches, PO overbilling, overpayments, inactive vendors, overdue invoices, and classification-evidence gaps. Local vendor corrections are logged but do not update the source system.

For a team using SAP BusinessObjects, SAP Analytics Cloud, or Power BI, export the underlying report rows to CSV and map their column names to the Zentai template before import. Those analytics/reporting products are not assumed to be the transactional source of record. Zentai has no direct connector to them, does not know the organization's actual SAP field mapping, and does not publish back into its BI dashboards. A shared production workflow would need approved data access, scheduled ingestion, source reconciliation, and governance controls.

Supplier diversity and Indigenous spend count only invoice amounts where the imported vendor status is `yes` **and** an evidence reference with valid-from/until dates covers the invoice issue date. Zentai does not authenticate a certificate or certify compliance. Reports are drafts until source completeness and exceptions have been reviewed. Procurement data stays in browser storage and can be backed up/restored as JSON; it is not included in FP&A Supabase snapshots or automatically reconciled to the aggregate forecast ledger. Confirm company data-handling policy before importing confidential employer exports.

## Vercel deployment

```sh
npx vercel deploy
npx vercel deploy --prod
```

`vercel.json` configures Next.js and `/api/analytics.py`; `.python-version` selects Python 3.12. The Python function has a 60-second maximum duration. Vercel's Git connection deploys changes pushed to the configured production branch and creates previews for other branches. Browser data refresh does not require cron jobs or a redeployment.

## Legacy material

`streamlit_app.py` and `requirements-streamlit.txt` retain the earlier Python UI for local reference. `Article_Draft.md`, the capstone slides, and generated Word/PowerPoint files are historical project materials and can describe earlier or proposed architectures. They are not production deployment instructions. The new application does not expose simulated incident feeds, legacy strategic directives, or capstone claims as live observations.
