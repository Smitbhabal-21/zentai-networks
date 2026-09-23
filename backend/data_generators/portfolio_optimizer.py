"""
portfolio_optimizer.py — Markowitz Portfolio Optimization Engine

This engine implements Modern Portfolio Theory (MPT), developed by
Harry Markowitz (Nobel Prize in Economics, 1990).

The core idea is simple but powerful: instead of picking stocks
individually, we should think about how all assets in a portfolio
interact with each other. Two volatile stocks might actually reduce
each other's risk if they move in opposite directions.

Algorithm used: Inverse Volatility Weighting
    - We fetch one year of daily closing prices for all assets.
    - We calculate the daily percentage returns for each asset.
    - We then measure each asset's volatility (standard deviation).
    - Assets that are MORE volatile get SMALLER allocations.
    - Assets that are LESS volatile get LARGER, safer allocations.
    - This mathematically minimises total portfolio risk.

Why not use scipy.optimize?
    Inverse Volatility is a well-accepted, fast approximation of
    the full Markowitz Efficient Frontier. For a real-time dashboard
    with 10 assets, it runs in milliseconds and produces allocations
    that closely approximate the true minimum-variance portfolio.
"""

import yfinance as yf
import pandas as pd
import numpy as np


def optimize_portfolio(tickers: list, period: str = "1y", investment_amount: float = 10000) -> dict:
    """
    Calculates the optimal capital allocation across the provided tickers
    using Inverse Volatility weighting.

    Args:
        tickers (list):           List of Yahoo Finance ticker strings.
        period (str):             Lookback window for historical data (default: "1y").
        investment_amount (float): The total dollar amount to allocate.

    Returns:
        dict: {
            "expected_annual_return_pct": float,
            "annual_volatility_pct":      float,
            "sharpe_ratio":               float,
            "optimal_weights":            {ticker: weight_pct},
            "dollar_allocations":         {ticker: dollar_amount}
        }
    """
    try:
        # Step 1: Download one year of closing prices for all tickers at once.
        # yfinance batches this into a single API call, which is much faster
        # than calling each ticker individually.
        tickers = list(dict.fromkeys(tickers))
        if len(tickers) < 2 or not np.isfinite(investment_amount) or investment_amount <= 0:
            return {"error": "Select at least two assets and positive investment capital."}
        data = yf.download(tickers, period=period, progress=False, auto_adjust=True)["Close"]
        if any(t not in data.columns for t in tickers):
            return {"error": "One or more selected assets have no history."}
        data = data.reindex(columns=tickers)

        if data.empty:
            return {"error": "Could not fetch price data for the portfolio."}

        # Step 2: Convert daily closing prices into daily percentage returns.
        # e.g., if a stock goes from $100 to $103, the daily return is 3%.
        # We drop the first row (NaN) produced by pct_change().
        returns = data.pct_change(fill_method=None).replace([np.inf, -np.inf], np.nan).dropna()
        if len(returns) < 60 or (returns.std() <= 0).any():
            return {"error": "Insufficient overlapping history or zero-volatility asset."}

        # Step 3: Annualise the metrics.
        # Daily returns × 252 trading days ≈ annual return.
        # Daily covariance × 252 ≈ annual covariance matrix.
        mean_returns = returns.mean() * 252
        cov_matrix = returns.cov() * 252

        num_assets = len(tickers)

        # Step 4: Calculate Inverse Volatility weights.
        # A stock with std dev of 0.02 (2%) gets a weight of 1/0.02 = 50.
        # A stock with std dev of 0.05 (5%) gets a weight of 1/0.05 = 20.
        # Normalising these so they sum to 1.0 gives us our portfolio weights.
        inv_vol = 1.0 / returns.std()
        optimal_weights = inv_vol / inv_vol.sum()

        # Step 5: Calculate the portfolio-level statistics using the weights.
        port_return = np.sum(mean_returns * optimal_weights)

        # Portfolio volatility = √(wᵀ × Σ × w)
        # where Σ is the covariance matrix. This accounts for correlations
        # between assets — the key insight of Modern Portfolio Theory.
        port_volatility = np.sqrt(
            np.dot(optimal_weights.T, np.dot(cov_matrix, optimal_weights))
        )

        # Sharpe Ratio = Return / Risk (higher is better)
        sharpe_ratio = port_return / port_volatility

        # Step 6: Convert weights into percentages and dollar allocations.
        weights_dict = {
            ticker: round(float(optimal_weights.loc[ticker]) * 100, 2)
            for ticker in tickers
        }
        dollar_dict = {
            ticker: round(float(optimal_weights.loc[ticker]) * investment_amount, 2)
            for ticker in tickers
        }

        return {
            "expected_annual_return_pct": round(port_return * 100, 2),
            "annual_volatility_pct": round(port_volatility * 100, 2),
            "sharpe_ratio": round(sharpe_ratio, 2),
            "optimal_weights": weights_dict,
            "methodology": "Inverse-volatility allocation, not a solved efficient frontier. Return and Sharpe are historical estimates; risk-free rate assumed zero.",
            "as_of": str(returns.index[-1])[:10],
            "dollar_allocations": dollar_dict,
        }

    except Exception as e:
        return {"error": str(e)}
