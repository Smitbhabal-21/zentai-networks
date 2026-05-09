"""
Financial data — pulls real income statement + balance sheet from Yahoo Finance.
Derives quarterly revenue, margins, EBITDA, and composite health score.
"""
import yfinance as yf
import pandas as pd
import numpy as np
from backend.data_generators.company_map import COMPANY_MAP


def get_financials(company_key: str) -> dict:
    info = COMPANY_MAP[company_key]
    ticker = info["ticker"]
    tk = yf.Ticker(ticker)

    # --- Income Statement (quarterly) ---
    try:
        inc = tk.quarterly_income_stmt
        inc = inc.loc[:, inc.columns[:8]]  # last 8 quarters
        inc.columns = [str(c)[:10] for c in inc.columns]

        revenue_row = _find_row(inc, ["Total Revenue", "Revenue"])
        gross_profit_row = _find_row(inc, ["Gross Profit"])
        ebitda_row = _find_row(inc, ["EBITDA", "Normalized EBITDA"])
        net_income_row = _find_row(inc, ["Net Income", "Net Income Common Stockholders"])
        operating_row = _find_row(inc, ["Operating Income", "Total Operating Income As Reported"])

        quarters = list(inc.columns)[::-1]  # oldest first

        def safe_series(row):
            if row is None:
                return [None] * len(quarters)
            vals = inc.loc[row, :].values[::-1]
            return [round(float(v) / 1e6, 1) if not pd.isna(v) else None for v in vals]

        revenue = safe_series(revenue_row)
        gross_profit = safe_series(gross_profit_row)
        ebitda = safe_series(ebitda_row)
        net_income = safe_series(net_income_row)
        operating_income = safe_series(operating_row)

        quarterly_data = []
        for i, q in enumerate(quarters):
            rev = revenue[i]
            gp = gross_profit[i]
            gross_margin = round((gp / rev * 100), 1) if rev and gp else None
            net_margin = round((net_income[i] / rev * 100), 1) if rev and net_income[i] else None
            quarterly_data.append({
                "period": q,
                "revenue_m": rev,
                "gross_profit_m": gp,
                "ebitda_m": ebitda[i],
                "net_income_m": net_income[i],
                "operating_income_m": operating_income[i],
                "gross_margin_pct": gross_margin,
                "net_margin_pct": net_margin,
            })

        # Latest KPIs
        latest = quarterly_data[-1] if quarterly_data else {}
        prev = quarterly_data[-2] if len(quarterly_data) > 1 else {}

        rev_growth = None
        if latest.get("revenue_m") and prev.get("revenue_m"):
            rev_growth = round((latest["revenue_m"] - prev["revenue_m"]) / abs(prev["revenue_m"]) * 100, 1)

    except Exception as e:
        quarterly_data = []
        latest = {}
        rev_growth = None

    # --- Balance Sheet for quick ratios ---
    try:
        bs = tk.quarterly_balance_sheet
        bs.columns = [str(c)[:10] for c in bs.columns]
        cash_row = _find_row(bs, ["Cash And Cash Equivalents", "Cash Cash Equivalents And Short Term Investments"])
        debt_row = _find_row(bs, ["Total Debt", "Long Term Debt"])
        assets_row = _find_row(bs, ["Total Assets"])

        latest_col = bs.columns[0]
        cash = float(bs.loc[cash_row, latest_col]) / 1e6 if cash_row else None
        total_debt = float(bs.loc[debt_row, latest_col]) / 1e6 if debt_row else None
        total_assets = float(bs.loc[assets_row, latest_col]) / 1e6 if assets_row else None
        debt_to_assets = round(total_debt / total_assets, 3) if total_debt and total_assets else None
    except Exception:
        cash = total_debt = total_assets = debt_to_assets = None

    # --- Health Score (composite 0-100) ---
    health_score = _compute_health_score(latest, rev_growth, debt_to_assets)

    return {
        "company": info["name"],
        "ticker": info["tag"],
        "industry": info["industry"],
        "quarterly": quarterly_data,
        "latest_kpis": {
            "revenue_m": latest.get("revenue_m"),
            "ebitda_m": latest.get("ebitda_m"),
            "gross_margin_pct": latest.get("gross_margin_pct"),
            "net_margin_pct": latest.get("net_margin_pct"),
            "revenue_growth_pct": rev_growth,
            "cash_m": round(cash, 1) if cash else None,
            "total_debt_m": round(total_debt, 1) if total_debt else None,
            "debt_to_assets": debt_to_assets,
        },
        "health_score": health_score,
    }


def _find_row(df: pd.DataFrame, candidates: list):
    for c in candidates:
        for idx in df.index:
            if c.lower() in str(idx).lower():
                return idx
    return None


def _compute_health_score(latest: dict, rev_growth, debt_to_assets) -> dict:
    scores = {}

    gm = latest.get("gross_margin_pct") or 0
    scores["gross_margin"] = min(100, max(0, gm * 2))   # 50% GM → 100pts

    nm = latest.get("net_margin_pct") or 0
    scores["net_margin"] = min(100, max(0, nm * 5))      # 20% NM → 100pts

    rg = rev_growth or 0
    scores["revenue_growth"] = min(100, max(0, 50 + rg * 5))  # centered at 0%

    da = debt_to_assets or 0.5
    scores["debt_ratio"] = min(100, max(0, (1 - da) * 100))   # lower debt → higher

    weights = {"gross_margin": 0.30, "net_margin": 0.30, "revenue_growth": 0.25, "debt_ratio": 0.15}
    composite = sum(scores[k] * weights[k] for k in scores)

    return {
        "composite": round(composite, 1),
        "breakdown": {k: round(v, 1) for k, v in scores.items()},
        "rating": "Excellent" if composite >= 75 else "Good" if composite >= 55 else "Fair" if composite >= 35 else "At Risk",
    }
