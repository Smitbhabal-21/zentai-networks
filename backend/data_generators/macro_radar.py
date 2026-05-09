import yfinance as yf

def get_macro_data():
    try:
        tickers = ["^VIX", "^TNX", "SPY"]
        data = {}
        for t in tickers:
            stock = yf.Ticker(t)
            hist = stock.history(period="5d")
            if not hist.empty:
                current = hist['Close'].iloc[-1]
                prev = hist['Close'].iloc[-2]
                pct_change = ((current - prev) / prev) * 100
                data[t] = {
                    "value": round(current, 2),
                    "change_pct": round(pct_change, 2)
                }
                
        vix = data.get("^VIX", {}).get("value", 15)
        if vix < 15:
            market_state = "Greed (Low Volatility)"
        elif vix > 25:
            market_state = "Fear (High Volatility)"
        else:
            market_state = "Neutral"
            
        return {
            "market_state": market_state,
            "vix": data.get("^VIX"),
            "treasury_10y": data.get("^TNX"),
            "spy": data.get("SPY")
        }
    except Exception as e:
        return {"error": str(e)}
