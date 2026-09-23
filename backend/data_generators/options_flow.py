"""Reported options-chain activity. Does not infer buyer identity or geography."""
import yfinance as yf

def get_options_flow(ticker):
    try:
        stock = yf.Ticker(ticker)
        dates = stock.options
        if not dates:
            return {"error": "No listed options expirations available."}
        chain = stock.option_chain(dates[0])
        calls, puts = chain.calls, chain.puts
        call_vol = int(calls['volume'].fillna(0).sum()) if not calls.empty else 0
        put_vol = int(puts['volume'].fillna(0).sum()) if not puts.empty else 0
        if call_vol + put_vol == 0:
            return {"error": "No reported volume for the nearest expiration."}
        stamps = [str(df['lastTradeDate'].max()) for df in (calls, puts) if not df.empty and 'lastTradeDate' in df]
        return {"expiration_date": dates[0], "call_volume": call_vol, "put_volume": put_vol,
                "put_call_ratio": round(put_vol/call_vol, 3) if call_vol else None,
                "total_volume_millions": round((call_vol+put_vol)/1e6, 3),
                "as_of": max(stamps) if stamps else None,
                "methodology": "Reported volume for the nearest expiration only. Put/call volume does not identify trade direction, institutions, or geography."}
    except Exception:
        return {"error": "Options provider is unavailable."}
