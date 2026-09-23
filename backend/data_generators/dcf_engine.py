"""Assumption-based valuation. Missing inputs never produce invented prices."""
import math
import yfinance as yf

def get_intrinsic_value(ticker, growth_rate=None, discount_rate=0.09, terminal_growth=0.02):
    try:
        if discount_rate <= terminal_growth or not 0 < discount_rate <= 0.5:
            return {"error": "Discount rate must exceed terminal growth and be at most 50%."}
        info = yf.Ticker(ticker).info
        price = info.get("currentPrice") or info.get("previousClose")
        fcf, shares = info.get("freeCashflow"), info.get("sharesOutstanding")
        if not all(isinstance(x, (float, int)) and math.isfinite(x) and x > 0 for x in (price, fcf, shares)):
            return {"error": "Positive reported free cash flow, shares, and market price are required for this DCF model."}
        growth = growth_rate if growth_rate is not None else info.get("revenueGrowth")
        if growth is None or not math.isfinite(growth) or not -0.5 <= growth <= 0.5:
            return {"error": "A growth assumption between -50% and 50% is required."}
        per_share = fcf / shares
        value = sum(per_share * (1 + growth)**year / (1 + discount_rate)**year for year in range(1, 6))
        value += per_share * (1 + growth)**5 * (1 + terminal_growth) / (discount_rate - terminal_growth) / (1 + discount_rate)**5
        return {"current_price": round(price, 2), "intrinsic_value": round(value, 2),
                "margin_of_safety_pct": round((value-price)/value*100, 2),
                "upside_pct": round((value-price)/price*100, 2),
                "status": "Below model estimate" if price < value else "Above model estimate",
                "assumptions": {"growth_rate": growth, "discount_rate": discount_rate, "terminal_growth": terminal_growth},
                "methodology": "Five-year FCF-per-share approximation. Revenue growth proxies FCF growth unless overridden; not a complete enterprise-to-equity valuation."}
    except Exception:
        return {"error": "Valuation source is currently unavailable."}
