import yfinance as yf
import pandas as pd

def get_intrinsic_value(ticker):
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        
        current_price = info.get("currentPrice", info.get("previousClose", 1))
        fcf = info.get("freeCashflow", None)
        shares = info.get("sharesOutstanding", None)
        
        if fcf and shares:
            fcf_per_share = fcf / shares
            growth_rate = info.get("revenueGrowth", 0.05)
            if growth_rate is None: growth_rate = 0.05
            discount_rate = 0.09
            terminal_growth = 0.02
            
            value = 0
            for i in range(1, 6):
                value += (fcf_per_share * (1 + growth_rate)**i) / ((1 + discount_rate)**i)
                
            tv = (fcf_per_share * (1 + growth_rate)**5 * (1 + terminal_growth)) / (discount_rate - terminal_growth)
            tv_discounted = tv / ((1 + discount_rate)**5)
            
            intrinsic_value = value + tv_discounted
        else:
            eps = info.get("trailingEps", 0)
            bps = info.get("bookValue", 0)
            if eps > 0 and bps > 0:
                intrinsic_value = (22.5 * eps * bps) ** 0.5
            else:
                intrinsic_value = current_price * 1.05
                
        if intrinsic_value <= 0: intrinsic_value = current_price * 1.05
                
        margin_of_safety = ((intrinsic_value - current_price) / current_price) * 100
        
        return {
            "current_price": round(current_price, 2),
            "intrinsic_value": round(intrinsic_value, 2),
            "margin_of_safety_pct": round(margin_of_safety, 2),
            "status": "Undervalued" if margin_of_safety > 0 else "Overvalued"
        }
    except Exception as e:
        return {"error": str(e)}
