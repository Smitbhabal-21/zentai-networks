"""
historical_parallel.py — Quantitative Pattern Recognition Engine

The central insight behind this engine is that financial markets are
driven by human behaviour, and human psychology tends to repeat itself.
By finding the historical 30-day period that most closely mirrors the
current 30-day trend, we can project a statistical baseline for what
might happen next.

How it works:
    1. Fetch 5 years of daily OHLC data from Yahoo Finance.
    2. Normalise the current 30-day close prices using Z-score:
           normalised = (price - mean) / standard_deviation
       This allows fair comparison across different time periods
       regardless of absolute price levels.
    3. Slide a 30-day window across all 5 years of history and
       calculate the Pearson Correlation coefficient between that
       window and the current normalised array.
    4. The window with the highest correlation is the 'Historical Match'.
    5. Extract the 30 days AFTER that match — the 'Predictive Shadow' —
       to project a statistical baseline for the next 30 days.

Note on correlation vs. price:
    We NEVER compare raw prices. Apple in 2020 traded at $120; in 2025
    it trades at $210. Comparing raw prices would be meaningless. The
    Z-score normalisation solves this by standardising both arrays to
    the same scale before comparing them.
"""
import yfinance as yf
import pandas as pd
import numpy as np
from scipy.stats import pearsonr
from backend.data_generators.company_map import COMPANY_MAP

def get_historical_parallel(company_key: str, window: int = 30) -> dict:
    info = COMPANY_MAP.get(company_key)
    if not info:
        return {"error": "Company not found"}
        
    ticker = info["ticker"]
    
    try:
        tk = yf.Ticker(ticker)
        hist = tk.history(period="5y")
        
        if len(hist) < window * 3:
            return {"error": "Not enough historical data"}
            
        hist = hist[['Open', 'High', 'Low', 'Close']].reset_index()
        hist['Date'] = hist['Date'].dt.strftime('%Y-%m-%d')
        
        current_slice = hist.tail(window).copy()
        current_prices = current_slice['Close'].values
        
        if len(current_prices) < window:
            return {"error": "Not enough recent data"}
            
        current_mean = np.mean(current_prices)
        current_std = np.std(current_prices)
        if current_std == 0: current_std = 1
        current_norm = (current_prices - current_mean) / current_std
        
        best_corr = -1.0
        best_idx = -1
        
        end_search_idx = len(hist) - (window * 2) - 30
        prices_array = hist['Close'].values
        
        for i in range(end_search_idx):
            hist_slice = prices_array[i:i+window]
            h_mean = np.mean(hist_slice)
            h_std = np.std(hist_slice)
            if h_std == 0: h_std = 1
            h_norm = (hist_slice - h_mean) / h_std
            
            corr, _ = pearsonr(current_norm, h_norm)
            if corr > best_corr:
                best_corr = corr
                best_idx = i
                
        if best_idx == -1:
            return {"error": "Could not find a valid correlation"}
            
        match_period = hist.iloc[best_idx : best_idx+window]
        shadow_period = hist.iloc[best_idx+window : best_idx+(window*2)]
        
        current_ohlc = {
            "Date": current_slice['Date'].tolist(),
            "Open": current_slice['Open'].tolist(),
            "High": current_slice['High'].tolist(),
            "Low": current_slice['Low'].tolist(),
            "Close": current_slice['Close'].tolist()
        }
        
        historical_ohlc = {
            "Date": match_period['Date'].tolist(),
            "Open": match_period['Open'].tolist(),
            "High": match_period['High'].tolist(),
            "Low": match_period['Low'].tolist(),
            "Close": match_period['Close'].tolist()
        }
        
        return {
            "ticker": ticker,
            "correlation_score": round(best_corr * 100, 1),
            "match_start": match_period['Date'].iloc[0],
            "match_end": match_period['Date'].iloc[-1],
            "shadow_projected_return_pct": round((shadow_period['Close'].iloc[-1] - match_period['Close'].iloc[-1]) / match_period['Close'].iloc[-1] * 100, 2),
            "current_ohlc": current_ohlc,
            "historical_ohlc": historical_ohlc
        }
        
    except Exception as e:
        return {"error": str(e)}
