"""Source-labeled analyst snapshot and an explicitly internal credit tier."""

from concurrent.futures import ThreadPoolExecutor
from math import isfinite

from backend.data_generators.company_map import COMPANY_MAP
from backend.data_generators.dcf_engine import get_intrinsic_value
from backend.data_generators.financial import get_financials


GRADE_BANDS = ((85, "AAA"), (75, "AA"), (65, "A"), (55, "BBB"),
               (45, "BB"), (35, "B"), (0, "CCC"))


def _finite(value):
    return isinstance(value, (int, float)) and isfinite(value)


def _points(value, thresholds):
    for upper, points in thresholds:
        if value <= upper:
            return points
    return thresholds[-1][1]


def credit_tier(financials: dict, industry: str) -> dict:
    caveat = (
        "Zentai internal screening tier, not an issuer credit rating from "
        "S&P, Moody's, Fitch, or another rating agency. It does not estimate "
        "default probability or replace credit underwriting."
    )
    if industry == "Financials":
        return {"status": "not_applicable", "grade": None, "score": None,
                "reason": "Bank capital and asset quality require a different credit model.",
                "caveat": caveat}

    kpis = financials.get("latest_kpis") or {}
    quarters = (financials.get("quarterly") or [])[-4:]
    ebitda = [q.get("ebitda_m") for q in quarters]
    interest = [q.get("interest_expense_m") for q in quarters]
    debt = kpis.get("total_debt_m")
    cash = kpis.get("cash_m")
    debt_assets = kpis.get("debt_to_assets")
    if (len(quarters) != 4 or not all(_finite(x) for x in ebitda)
            or not all(_finite(x) for x in (debt, cash, debt_assets))
            or sum(ebitda) <= 0 or debt < 0 or cash < 0
            or not 0 <= debt_assets <= 1):
        return {"status": "insufficient", "grade": None, "score": None,
                "reason": "Four quarters of EBITDA, cash, debt, and assets are required.",
                "caveat": caveat}

    ttm_ebitda = sum(ebitda)
    net_debt_ebitda = max(0, debt - cash) / ttm_ebitda
    cash_debt = cash / debt if debt > 0 else None
    coverage = None
    if len(interest) == 4 and all(_finite(x) and x >= 0 for x in interest):
        annual_interest = sum(interest)
        coverage = ttm_ebitda / annual_interest if annual_interest > 0 else None

    factors = [
        ("Net debt / TTM EBITDA", round(net_debt_ebitda, 2),
         _points(net_debt_ebitda, ((0, 100), (1, 90), (2, 75),
                                    (3, 60), (4, 45), (6, 25), (float("inf"), 5))), .45),
        ("Debt / assets", round(debt_assets, 3),
         _points(debt_assets, ((.1, 95), (.25, 80), (.4, 65),
                              (.55, 50), (.7, 30), (1, 10))), .3),
        ("Cash / debt", round(cash_debt, 2) if cash_debt is not None else None,
         100 if debt == 0 else _points(cash_debt, ((.1, 15), (.25, 35),
                                                  (.5, 55), (1, 75), (float("inf"), 95))), .25),
    ]
    score = round(sum(points * weight for _, _, points, weight in factors), 1)
    grade = next(label for minimum, label in GRADE_BANDS if score >= minimum)
    return {
        "status": "available", "grade": grade, "score": score,
        "metrics": {
            "net_debt_to_ebitda": round(net_debt_ebitda, 2),
            "debt_to_assets": round(debt_assets, 3),
            "cash_to_debt": round(cash_debt, 2) if cash_debt is not None else None,
            "ebitda_interest_coverage": round(coverage, 2) if coverage is not None else None,
            "ttm_ebitda_m": round(ttm_ebitda, 1),
        },
        "factors": [{"name": name, "value": value, "points": points,
                     "weight": weight} for name, value, points, weight in factors],
        "methodology": "0–100 weighted screen: net debt/TTM EBITDA 45%, debt/assets 30%, cash/debt 25%. Fixed bands: AAA ≥85, AA ≥75, A ≥65, BBB ≥55, BB ≥45, B ≥35, CCC below 35. Interest coverage is shown as context when available, not scored.",
        "caveat": caveat,
    }


def get_analyst_snapshot(company_key: str) -> dict:
    company = COMPANY_MAP[company_key]
    with ThreadPoolExecutor(max_workers=2) as pool:
        financial_future = pool.submit(get_financials, company_key)
        valuation_future = pool.submit(get_intrinsic_value, company["ticker"])
        financials = financial_future.result()
        valuation = valuation_future.result()
    return {
        "company": financials.get("company", company["name"]),
        "ticker": company["ticker"],
        "industry": company["industry"],
        "as_of": financials.get("as_of"),
        "financials": financials,
        "valuation": valuation,
        "credit": credit_tier(financials, company["industry"]),
        "sources": ["Yahoo Finance quarterly statements", "Yahoo Finance company valuation fields"],
    }
