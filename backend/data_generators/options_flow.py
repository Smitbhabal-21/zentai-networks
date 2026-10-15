"""Reported options-chain activity. Does not infer buyer identity or geography."""
import yfinance as yf
from datetime import datetime, timezone
import math

def _finite(value):
    try:
        result = float(value)
        return round(result, 4) if math.isfinite(result) and result >= 0 else None
    except (TypeError, ValueError):
        return None

def get_options_chain(ticker):
    """Public call and put quotes for the strategy lab. Quotes can be delayed or absent."""
    try:
        stock = yf.Ticker(ticker)
        expirations = list(stock.options)[:3]
        if not expirations:
            return {"error": "No listed options expirations available from the provider."}
        chains = []
        for expiration in expirations:
            chain = stock.option_chain(expiration)
            def contracts(frame):
                result = []
                for _, row in frame.iterrows():
                    strike = _finite(row.get('strike'))
                    if strike is None or strike == 0:
                        continue
                    trade = row.get('lastTradeDate')
                    result.append({
                        "symbol": str(row.get('contractSymbol', '')),
                        "strike": strike,
                        "bid": _finite(row.get('bid')),
                        "ask": _finite(row.get('ask')),
                        "last_price": _finite(row.get('lastPrice')),
                        "volume": _finite(row.get('volume')),
                        "open_interest": _finite(row.get('openInterest')),
                        "last_trade_at": trade.isoformat() if hasattr(trade, 'isoformat') else None,
                    })
                return result
            chains.append({"expiration": expiration, "calls": contracts(chain.calls), "puts": contracts(chain.puts)})
        return {"source": "Yahoo Finance via yfinance", "as_of": datetime.now(timezone.utc).isoformat(),
                "multiplier_assumption": 100, "expirations": chains,
                "methodology": "Available public bid/ask snapshots; may be delayed, stale, or incomplete. Verify contract size, quotes, liquidity, and exercise terms with a broker."}
    except Exception:
        return {"error": "Options chain is unavailable from the public provider."}

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
