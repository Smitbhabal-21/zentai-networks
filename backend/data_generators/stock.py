"""
Stock data generator — fetches real OHLCV data from Yahoo Finance.
"""
import yfinance as yf
import pandas as pd
import numpy as np
from backend.data_generators.company_map import COMPANY_MAP


def get_stock_history(company_key: str, period: str = "1y") -> dict:
    info = COMPANY_MAP[company_key]
    ticker = info["ticker"]

    tk = yf.Ticker(ticker)
    hist = tk.history(period=period)

    if hist.empty:
        return {"error": f"No data for {ticker}"}

    hist = hist.reset_index()
    hist["Date"] = hist["Date"].astype(str).str[:10]

    # Price stats
    current_price = float(hist["Close"].iloc[-1])
    prev_price = float(hist["Close"].iloc[-2]) if len(hist) > 1 else current_price
    price_change = round(current_price - prev_price, 2)
    price_change_pct = round((price_change / prev_price) * 100, 2)

    week52_high = float(hist["High"].max())
    week52_low = float(hist["Low"].min())
    avg_volume = int(hist["Volume"].mean())

    # Daily returns & volatility
    hist["return"] = hist["Close"].pct_change()
    volatility = float(hist["return"].std() * np.sqrt(252) * 100)  # annualized %

    # Build OHLCV list for candlestick chart
    candles = hist[["Date", "Open", "High", "Low", "Close", "Volume"]].copy()
    candles = candles.rename(columns={
        "Open": "open", "High": "high", "Low": "low",
        "Close": "close", "Volume": "volume", "Date": "date"
    })
    candles = candles.round(2)
    candles_list = candles.to_dict(orient="records")

    # Moving averages
    hist["MA20"] = hist["Close"].rolling(20).mean()
    hist["MA50"] = hist["Close"].rolling(50).mean()
    ma_data = hist[["Date", "Close", "MA20", "MA50"]].dropna().round(2)
    ma_list = ma_data.rename(columns={"Close": "close", "MA20": "ma20", "MA50": "ma50", "Date": "date"}).to_dict(orient="records")

    return {
        "company": info["name"],
        "ticker": info["tag"],           # show Zentai tag in UI
        "real_ticker": ticker,           # for reference
        "current_price": round(current_price, 2),
        "price_change": price_change,
        "price_change_pct": price_change_pct,
        "week52_high": round(week52_high, 2),
        "week52_low": round(week52_low, 2),
        "avg_volume": avg_volume,
        "volatility_annualized_pct": round(volatility, 2),
        "candles": candles_list,
        "ma_data": ma_list,
    }
