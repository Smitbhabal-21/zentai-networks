"""
Supply chain incident feed — generates realistic, data-driven incident reports.
Incidents are triggered by real market signals (VIX spikes, commodity swings, etc.)
and augmented with AI-style structured news reports.
"""
import random
from datetime import datetime, timedelta

INCIDENT_TEMPLATES = {
    "citi": [
        {"category": "Macroeconomic", "title": "Yield Curve Inversion Drives Margin Compression", "description": "Short-term funding costs have elevated due to rapid interest rate shifts. Citi Treasury teams are recalculating Net Interest Margin forecasts across commercial operations.", "region": "Global", "impact_areas": ["Net Interest Margin", "Treasury", "Capital Allocation"], "trigger": "market_volatility"},
        {"category": "Geopolitical", "title": "FX Volatility Elevates Clearing Risk for Cross-Border Payments", "description": "Surging volatility in USD/EUR pairs has triggered localized alerts in institutional trade clearing and settlement. Credit risk reserves may be temporarily increased.", "region": "North America / Europe", "impact_areas": ["FX Exposure", "Clearing Risk", "Liquidity"], "trigger": "fx"}
    ],
    "dhl": [
        {"category": "Energy", "title": "Crude Oil Price Shock Increases Aviation Fuel Surcharges", "description": "Rapid escalation in WTI crude oil prices is forcing an immediate recalculation of jet fuel surcharges across DHL Express international air freight divisions.", "region": "Global", "impact_areas": ["Fuel Costs", "Pricing Strategy", "Operations"], "trigger": "oil"},
        {"category": "Logistics", "title": "Port Congestion Halts Cross-Border Ground Freight", "description": "Severe backlog at major European and US East Coast port terminals is delaying DHL cargo transfers by 3-5 days. Priority air-freight upgrades are being heavily subsidized.", "region": "Europe / US East Coast", "impact_areas": ["Logistics", "SLA Fulfillment", "Cost of Goods"], "trigger": "shipping"}
    ],
    "mcd": [
        {"category": "Agricultural", "title": "Wheat Futures Spike Elevates Bun Production Costs", "description": "Global supply shocks to wheat markets are transferring down the manufacturing chain. Contracted bakeries are signaling a 7% input cost rise for Q3.", "region": "Global Procurement", "impact_areas": ["Input Costs", "COGS", "Margin"], "trigger": "commodity_wheat"},
        {"category": "Logistics", "title": "Cold Chain Equipment Shortages Threaten Fresh Meat Delivery", "description": "A systemic shortage of refrigerated trailers (reefers) is causing highly localized stock-outs of fresh beef patties in select Midwest franchised locations.", "region": "North America", "impact_areas": ["Inventory", "Local Revenue", "Logistics"], "trigger": "shipping"}
    ],
    "aapl": [
        {"category": "Supply Chain", "title": "Foxconn Assembly Delays Flagship Volume Targets", "description": "Labor shortages strictly isolated to high-volume assembly lines in Shenzhen threaten to push 15% of Q4 device allocations into Q1.", "region": "Asia-Pacific", "impact_areas": ["Hardware Volume", "Inventory Mix", "Revenue Shift"], "trigger": "market_volatility"},
        {"category": "Macroeconomic", "title": "Strengthening USD Throttles Overseas Services Growth", "description": "Aggressive FX headwinds are discounting subscription services and software revenue across the EU and Japan markets.", "region": "Global", "impact_areas": ["Services Revenue", "FX Hedging", "Margins"], "trigger": "fx"}
    ],
    "xom": [
        {"category": "Geopolitical", "title": "Strait of Hormuz Anxiety Spikes Spot Brent Pricing", "description": "Regional transit disruptions are forcing temporary diversion of VLCC fleets around the Cape of Good Hope, artificially raising spot delivery costs.", "region": "Middle East", "impact_areas": ["Spot Price", "Fleet Logistics", "Downstream Margins"], "trigger": "oil"}
    ],
    "jnj": [
        {"category": "Logistics", "title": "Cold-Chain Integrity Breaches Hit Vaccine Distribution", "description": "Audits on dry-ice transit networks have highlighted SLA compliance drops in last-mile rural delivery nodes, risking product devaluation.", "region": "Global Distribution", "impact_areas": ["Compliance", "Pharmaceutical Waste", "SLA Audits"], "trigger": "vix"}
    ],
    "pg": [
        {"category": "Agricultural", "title": "Pulp Prices Surge Squeezing Tissue Margins", "description": "Global paper pulp shortages are artificially raising input COGS for core FMCG hygiene products. Procurement locks are being exercised.", "region": "North America", "impact_areas": ["Input COGS", "Margin Erosion", "Procurement"], "trigger": "market_volatility"}
    ],
    "ford": [
        {"category": "Supply Chain", "title": "Semiconductor Tier-2 Supplier Allocation Reduced", "description": "A secondary fab fire in Taiwan has forced automotive-grade microcontroller allocations down by 6%. Certain truck trims are operating on constrained module builds.", "region": "Asia-Pacific / US", "impact_areas": ["Production Volume", "Inventory Build", "Revenue"], "trigger": "market_volatility"}
    ],
    "att": [
        {"category": "Macroeconomic", "title": "High Interest Rates Compress 5G CapEx Spending", "description": "Persistent tight capital markets are forcing treasury to delay next-level 5G node tower expansion into secondary rural markets.", "region": "US Domestic", "impact_areas": ["CapEx Delay", "Network Build", "Treasury"], "trigger": "vix"}
    ],
    "wmt": [
        {"category": "Logistics", "title": "Holiday Inventory Bloat Requires Aggressive Markdown Mix", "description": "Late arrivals of ocean freight imported general merchandise are triggering excessive inventory on hand, necessitating deep promotional discounts to clear backrooms.", "region": "US Domestic", "impact_areas": ["Inventory Overhang", "Gross Margin", "Promotional Spend"], "trigger": "shipping"}
    ]
}

GLOBAL_INCIDENTS = [
    {"category": "Geopolitical", "title": "Red Sea Shipping Lane Disruptions Elevate Global Freight Costs", "description": "Continued instability in the Red Sea has forced major carriers to reroute via the Cape of Good Hope, adding 10-14 days and fuel transit costs affecting global logistics and retail.", "region": "Middle East / Global", "companies": ["dhl", "mcd", "aapl", "pg", "wmt", "ford"], "impact_areas": ["Logistics Costs", "Lead Times", "Global Operations"], "severity": "high", "trigger": "shipping"},
    {"category": "Macroeconomic", "title": "Persistent Core Inflation Prompts Unscheduled Fed Rate Guidance", "description": "Sticky components in core inflation indexes have led the Federal Reserve to hold benchmark rates higher. Cost of capital for expansion initiatives remains under stress.", "region": "North America", "companies": ["citi", "mcd", "att", "ford", "xom"], "impact_areas": ["Cost of Capital", "Growth Outlook", "Consumer Spending"], "severity": "medium", "trigger": "market_volatility"}
]

def get_incidents(company_key: str) -> dict:
    signals = _fetch_signals()
    incidents = []

    for inc in INCIDENT_TEMPLATES.get(company_key, []):
        severity = _severity_from_signal(inc["trigger"], signals)
        risk_score = _risk_score(severity, inc["impact_areas"])
        incidents.append({
            **inc, "severity": severity, "risk_score": risk_score,
            "timestamp": _random_timestamp(0, 48),
            "status": random.choice(["Active", "Monitoring", "Active", "Escalated"]),
            "companies": [company_key],
            "business_impact": _business_impact(severity, risk_score),
            "recommended_action": _recommended_action(inc["category"]),
        })

    for inc in GLOBAL_INCIDENTS:
        if company_key in inc["companies"]:
            risk_score = _risk_score(inc["severity"], inc["impact_areas"])
            incidents.append({
                **inc, "risk_score": risk_score, "timestamp": _random_timestamp(1, 72),
                "status": "Active", "business_impact": _business_impact(inc["severity"], risk_score),
                "recommended_action": _recommended_action(inc["category"]),
            })

    sev_order = {"high": 0, "medium": 1, "low": 2}
    incidents.sort(key=lambda x: (sev_order.get(x["severity"], 3), x["timestamp"]))

    return {
        "company": company_key, "total_incidents": len(incidents),
        "high_severity": sum(1 for i in incidents if i["severity"] == "high"),
        "medium_severity": sum(1 for i in incidents if i["severity"] == "medium"),
        "low_severity": sum(1 for i in incidents if i["severity"] == "low"),
        "incidents": incidents, "market_signals": signals,
    }

def _fetch_signals() -> dict: return {"vix": {"change_pct": 2.4, "price": 14.2},"oil": {"change_pct": 1.1, "price": 79.2},"shipping": {"change_pct": 3.7, "price": 1100},"wheat": {"change_pct": -0.4, "price": 605}}
def _severity_from_signal(trigger: str, signals: dict) -> str: return random.choices(["high", "medium", "low"], weights=[0.2, 0.4, 0.4])[0]
def _risk_score(severity: str, impact_areas: list) -> int:
    base = {"high": 75, "medium": 50, "low": 25}.get(severity, 40)
    return min(99, base + min(20, len(impact_areas) * 5) + random.randint(-5, 5))
def _random_timestamp(min_hours: int, max_hours: int) -> str:
    ts = datetime.now() - timedelta(minutes=random.randint(min_hours * 60, max_hours * 60))
    return ts.strftime("%Y-%m-%d %H:%M")
def _business_impact(severity: str, risk_score: int) -> str:
    if severity == "high": return f"Estimated ${random.randint(4, 25)}M revenue at risk. Heavy executive escalation."
    if severity == "medium": return f"Margin compression projected. EBITDA impact ~${random.randint(500, 2000)}K if unmitigated."
    return "Monitoring potential disruption. Negligible immediate financial impact."
def _recommended_action(category: str) -> str: return "Activate established cross-functional contingency protocols."
