"""
Global markets data — fetches indices, currencies, and now competitor cohorts 
from Yahoo Finance for Zentai Networks.
"""
import yfinance as yf

GLOBAL_SYMBOLS = {
    # US Indices
    "S&P 500":  "^GSPC",
    "NASDAQ":   "^IXIC",
    "Dow Jones":"^DJI",
    "VIX":      "^VIX",
    # Commodities
    "Gold":     "GC=F",
    "Crude Oil":"CL=F",
    
    # Banking & Finance Peers (Citi Competitors)
    "Citigroup Inc": "C",
    "JPMorgan Chase": "JPM",
    "Bank of America": "BAC",
    "Wells Fargo": "WFC",
    "Morgan Stanley": "MS",
    "Goldman Sachs": "GS",
    "US Bancorp": "USB",
    "PNC Financial": "PNC",
    "Charles Schwab": "SCHW",
    "BNY Mellon": "BK",
    "State Street": "STT",

    # Logistics & Freight Peers (DHL Competitors)
    "UPS": "UPS",
    "FedEx": "FDX",
    "Expeditors Int'l": "EXPD",
    "CH Robinson": "CHRW",
    "XPO Logistics": "XPO",
    "Old Dominion": "ODFL",
    "JB Hunt": "JBHT",
    "Saia": "SAIA",
    "ArcBest": "ARCB",
    "GXO Logistics": "GXO",

    # QSR & Retail Food Peers (McDonald's Competitors)
    "Starbucks": "SBUX",
    "Chipotle": "CMG",
    "Yum! Brands": "YUM",
    "Domino's Pizza": "DPZ",
    "Wendy's": "WEN",
    "Rest. Brands Int'l": "QSR",
    "Texas Roadhouse": "TXRH",
    "Yum China": "YUMC",
    "Darden Restaurants": "DRI",
    "Shake Shack": "SHAK",
}

def get_global_markets() -> dict:
    results = []
    tickers = list(GLOBAL_SYMBOLS.values())
    labels  = list(GLOBAL_SYMBOLS.keys())

    try:
        # Pull 5 days of data for all requested tickers simultaneously
        data = yf.download(tickers, period="5d", progress=False, auto_adjust=True)
        close = data["Close"] if "Close" in data else data

        for label, sym in zip(labels, tickers):
            try:
                col = sym
                if col not in close.columns:
                    continue
                series = close[col].dropna()
                if len(series) < 2:
                    continue
                price      = float(series.iloc[-1])
                prev_price = float(series.iloc[-2])
                change     = round(price - prev_price, 4)
                change_pct = round((change / prev_price) * 100, 2)
                results.append({
                    "name":       label,
                    "symbol":     sym,
                    "price":      round(price, 2),
                    "change":     change,
                    "change_pct": change_pct,
                    "direction":  "up" if change_pct >= 0 else "down",
                })
            except Exception:
                continue
    except Exception as e:
        return {"error": str(e), "markets": []}

    # Group by category dynamically
    categories = {
        "Macro Indices & Commodities": ["S&P 500", "NASDAQ", "Dow Jones", "VIX", "Gold", "Crude Oil"],
        "Banking & Finance Peers":     ["Citigroup Inc", "JPMorgan Chase", "Bank of America", "Wells Fargo", "Morgan Stanley", "Goldman Sachs", "US Bancorp", "PNC Financial", "Charles Schwab", "BNY Mellon", "State Street"],
        "Logistics & Freight Peers":   ["UPS", "FedEx", "Expeditors Int'l", "CH Robinson", "XPO Logistics", "Old Dominion", "JB Hunt", "Saia", "ArcBest", "GXO Logistics"],
        "QSR & Retail Food Peers":     ["Starbucks", "Chipotle", "Yum! Brands", "Domino's Pizza", "Wendy's", "Rest. Brands Int'l", "Texas Roadhouse", "Yum China", "Darden Restaurants", "Shake Shack"],
    }

    by_category = {}
    result_map = {r["name"]: r for r in results}
    for cat, names in categories.items():
        by_category[cat] = [result_map[n] for n in names if n in result_map]

    return {"markets": results, "by_category": by_category}
