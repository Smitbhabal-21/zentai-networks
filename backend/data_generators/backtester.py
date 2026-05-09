"""
backtester.py — Algorithmic Trading Strategy Backtester

This engine allows us to simulate how a quantitative trading strategy
would have performed historically. We run the strategy against real
historical price data and compare it to a passive "Buy and Hold"
approach to measure 'Alpha' (outperformance).

Supported Strategies:
    1. SMA Crossover   — A trend-following strategy that buys when
                         the 50-day moving average crosses above the
                         200-day moving average (a "Golden Cross").
    2. RSI Mean Reversion — Buys when the RSI drops below 30 (oversold)
                            and sells when it rises above 70 (overbought).
    3. MACD Momentum   — Buys when the fast EMA (12-day) crosses above
                         the slow EMA (26-day), indicating a new uptrend.

IMPORTANT — Look-Ahead Bias:
    The most common error in backtesting is "look-ahead bias" — when
    a simulation acts on information it couldn't have known at that time.
    We prevent this by using df['Signal'].shift(1), which moves the
    entire signal column down by one day. This means we always trade
    the day AFTER a signal fires, exactly as a real trader would.
"""

import yfinance as yf
import pandas as pd
import numpy as np


def run_backtest(ticker: str, strategy: str = "SMA Crossover", period: str = "5y") -> dict:
    """
    Runs a full quantitative backtest for the given ticker and strategy.

    Args:
        ticker (str):   Yahoo Finance ticker symbol (e.g., "AAPL").
        strategy (str): One of "SMA Crossover", "RSI Mean Reversion", "MACD Momentum".
        period (str):   Historical lookback period (default: "5y").

    Returns:
        dict: {
            "strategy_return_pct":    float,
            "buyhold_return_pct":     float,
            "alpha_pct":              float,
            "max_drawdown_pct":       float,
            "sharpe_ratio":           float,
            "dates":                  list,
            "strategy_curve":         list,
            "buyhold_curve":          list
        }
    """
    try:
        stock = yf.Ticker(ticker)
        df = stock.history(period=period)

        if df.empty:
            return {"error": f"No historical data found for {ticker}."}

        # Calculate the daily percentage change in closing price
        df["Daily Return"] = df["Close"].pct_change()

        # ----------------------------------------------------------------
        # Build the trading signal for the chosen strategy
        # ----------------------------------------------------------------

        if strategy == "SMA Crossover":
            # Calculate 50-day and 200-day rolling averages of the closing price
            df["SMA_50"] = df["Close"].rolling(window=50).mean()
            df["SMA_200"] = df["Close"].rolling(window=200).mean()

            # Generate a binary signal: 1 (be in the market) or 0 (hold cash)
            # When the faster 50-day average is above the slower 200-day average,
            # the trend is considered upward — we want to be long.
            df["Signal"] = np.where(df["SMA_50"] > df["SMA_200"], 1, 0)

            # Shift the signal by 1 day to prevent look-ahead bias.
            # We only know today's averages AFTER the market closes,
            # so we don't act until the next trading day opens.
            df["Position"] = df["Signal"].shift(1)

        elif strategy == "RSI Mean Reversion":
            # RSI (Relative Strength Index) measures momentum velocity.
            # It oscillates between 0 and 100. Below 30 = oversold (buy),
            # above 70 = overbought (sell).
            delta = df["Close"].diff()

            # Separate gains and losses, then calculate 14-day averages
            gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
            rs = gain / loss
            df["RSI"] = 100 - (100 / (1 + rs))

            # Buy when RSI crosses below 30 (oversold), sell when above 70
            df["Signal"] = np.where(df["RSI"] < 30, 1, np.where(df["RSI"] > 70, 0, np.nan))
            df["Signal"] = df["Signal"].ffill().fillna(0)  # Carry the last signal forward
            df["Position"] = df["Signal"].shift(1)

        elif strategy == "MACD Momentum":
            # MACD = 12-day EMA minus 26-day EMA.
            # When the MACD line crosses above zero, momentum is turning positive.
            exp12 = df["Close"].ewm(span=12, adjust=False).mean()
            exp26 = df["Close"].ewm(span=26, adjust=False).mean()
            df["MACD"] = exp12 - exp26
            df["Signal_Line"] = df["MACD"].ewm(span=9, adjust=False).mean()

            # Buy when MACD line crosses above the signal line
            df["Signal"] = np.where(df["MACD"] > df["Signal_Line"], 1, 0)
            df["Position"] = df["Signal"].shift(1)

        else:
            return {"error": f"Unknown strategy: {strategy}"}

        # ----------------------------------------------------------------
        # Calculate performance metrics
        # ----------------------------------------------------------------

        # Strategy return = daily market return × whether we were in position
        df["Strategy Return"] = df["Daily Return"] * df["Position"]

        # Drop rows with NaN values introduced by rolling windows
        df.dropna(inplace=True)

        if df.empty:
            return {"error": "Not enough data after calculating indicators."}

        # Cumulative growth curves (starting at $1.00)
        df["Strategy Curve"] = (1 + df["Strategy Return"]).cumprod()
        df["BuyHold Curve"] = (1 + df["Daily Return"]).cumprod()

        # Final returns (convert to percentages)
        strategy_return = (df["Strategy Curve"].iloc[-1] - 1) * 100
        buyhold_return = (df["BuyHold Curve"].iloc[-1] - 1) * 100
        alpha = strategy_return - buyhold_return

        # Maximum Drawdown: how far did the strategy fall from its peak?
        # Smaller (less negative) is better.
        roll_max = df["Strategy Curve"].cummax()
        drawdown = (df["Strategy Curve"] - roll_max) / roll_max
        max_drawdown = drawdown.min() * 100

        # Sharpe Ratio: risk-adjusted return (annualised)
        sharpe = (df["Strategy Return"].mean() * 252) / (df["Strategy Return"].std() * np.sqrt(252))

        # Format dates as strings for JSON serialisation in the UI
        dates = df.index.strftime("%Y-%m-%d").tolist()

        return {
            "ticker": ticker,
            "strategy": strategy,
            "strategy_return_pct": round(strategy_return, 2),
            "buyhold_return_pct": round(buyhold_return, 2),
            "alpha_pct": round(alpha, 2),
            "max_drawdown_pct": round(max_drawdown, 2),
            "sharpe_ratio": round(sharpe, 2),
            "dates": dates,
            "strategy_curve": df["Strategy Curve"].round(4).tolist(),
            "buyhold_curve": df["BuyHold Curve"].round(4).tolist(),
        }

    except Exception as e:
        return {"error": str(e)}
