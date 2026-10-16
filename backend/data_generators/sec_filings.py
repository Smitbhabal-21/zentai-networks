"""Small, source-linked EDGAR XBRL adapter. Never invents missing filing facts."""

import os
from datetime import date
import requests
from functools import lru_cache
from backend.data_generators.company_map import COMPANY_MAP

CIKS = {
    "citi_bank": 831001, "jpmorgan": 19617, "apple": 320193,
    "microsoft": 789019, "meta": 1326801, "nvidia": 1045810,
    "amazon": 1018724, "tesla": 1318605, "exxon": 34088,
    "pfizer": 78003,
}

CONCEPTS = {
    "annual_revenue_m": ("RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "SalesRevenueNet"),
    "annual_net_income_m": ("NetIncomeLoss",),
    "annual_operating_cash_flow_m": ("NetCashProvidedByUsedInOperatingActivities",),
    "annual_capex_m": ("PaymentsToAcquirePropertyPlantAndEquipment",),
    "cash_m": ("CashAndCashEquivalentsAtCarryingValue",),
    "assets_m": ("Assets",),
    "current_debt_m": ("LongTermDebtCurrent", "LongTermDebtAndFinanceLeaseObligationsCurrent"),
    "long_term_debt_m": ("LongTermDebtNoncurrent", "LongTermDebtAndFinanceLeaseObligationsNoncurrent"),
    "bank_deposits_m": ("Deposits",),
    "bank_loans_net_m": ("LoansAndLeasesReceivableNetReportedAmount",),
    "bank_loan_allowance_m": ("LoansAndLeasesReceivableAllowance",),
    "equity_m": ("StockholdersEquity",),
}


def _json(url: str, user_agent: str) -> dict:
    response = requests.get(url, headers={
        "User-Agent": user_agent,
        "Accept": "application/json",
    }, timeout=8)
    response.raise_for_status()
    return response.json()


@lru_cache(maxsize=1)
def _sec_ticker_ciks(user_agent: str) -> dict[str, int]:
    directory = _json("https://www.sec.gov/files/company_tickers.json", user_agent)
    return {entry["ticker"].upper().replace(".", "-"): int(entry["cik_str"])
            for entry in directory.values() if entry.get("ticker") and entry.get("cik_str")}


def _fact(facts: dict, aliases: tuple[str, ...], annual: bool) -> dict | None:
    found = []
    for concept in aliases:
        entries = facts.get("us-gaap", {}).get(concept, {}).get("units", {}).get("USD", [])
        for entry in entries:
            forms = ("10-K",) if annual else ("10-K", "10-Q")
            if entry.get("form") not in forms:
                continue
            if not isinstance(entry.get("val"), (float, int)) or not entry.get("end"):
                continue
            if annual:
                if not entry.get("start"):
                    continue
                try:
                    days = (date.fromisoformat(entry["end"]) - date.fromisoformat(entry["start"])).days
                except ValueError:
                    continue
                if not 330 <= days <= 380:
                    continue
            elif entry.get("start"):
                continue
            found.append((entry["end"], entry.get("filed", ""), concept, entry))
    if not found:
        return None
    _, _, concept, entry = max(found)
    return {
        "value_m": round(entry["val"] / 1e6, 1),
        "period_end": entry["end"], "filed": entry.get("filed"),
        "form": entry.get("form"), "accession": entry.get("accn"),
        "concept": f"us-gaap:{concept}",
    }


def get_sec_filing_snapshot(company_key: str) -> dict:
    cik = CIKS.get(company_key)
    contact = os.environ.get("SEC_USER_AGENT", "").strip()
    if "@" not in contact:
        return {
            "status": "not_configured", "cik": cik,
            "reason": "SEC filing data needs a declared SEC_USER_AGENT with a contact email.",
            "facts": {}, "filings": [],
        }
    if cik is None:
        try:
            ticker = COMPANY_MAP[company_key]["ticker"]
            cik = _sec_ticker_ciks(contact).get(ticker)
        except Exception:
            cik = None
        if cik is None:
            return {"status": "unavailable", "cik": None,
                    "reason": "No matching SEC issuer record was available for this ticker.",
                    "facts": {}, "filings": []}
    try:
        company_facts = _json(f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik:010d}.json", contact)
        submissions = _json(f"https://data.sec.gov/submissions/CIK{cik:010d}.json", contact)
    except Exception:
        return {"status": "unavailable", "cik": cik,
                "reason": "SEC EDGAR did not return filing data. Retry later.",
                "facts": {}, "filings": []}

    facts = {}
    for name, concepts in CONCEPTS.items():
        item = _fact(company_facts.get("facts", {}), concepts, name.startswith("annual_"))
        if item and 0 <= (date.today() - date.fromisoformat(item["period_end"])).days <= 730:
            facts[name] = item

    recent = submissions.get("filings", {}).get("recent", {})
    filings = []
    rows = zip(recent.get("form", []), recent.get("accessionNumber", []),
               recent.get("primaryDocument", []), recent.get("filingDate", []))
    for form, accession, primary, filed in rows:
        if form not in ("10-K", "10-Q", "8-K"):
            continue
        filings.append({"form": form, "filed": filed, "accession": accession,
                        "url": f"https://www.sec.gov/Archives/edgar/data/{cik}/{accession.replace('-', '')}/{primary}"})
        if len(filings) == 5:
            break
    return {
        "status": "available", "cik": cik, "entity": company_facts.get("entityName"),
        "facts": facts, "filings": filings,
        "source": "SEC EDGAR XBRL company facts and submissions",
        "methodology": "Annual flow facts use a 330–380 day 10-K period; balance-sheet facts use the latest reported 10-Q or 10-K instant. Facts older than two years are omitted. Values are USD millions. The original filing controls if a tag or mapping is ambiguous.",
    }
