"""
Insider Trading Data Generator.
Scrapes SEC-filed insider transactions (Buys/Sells) from Yahoo Finance.
"""
import yfinance as yf
from backend.data_generators.company_map import COMPANY_MAP

def get_insider_trading(company_key: str) -> dict:
    info = COMPANY_MAP.get(company_key)
    if not info:
        return {}

    ticker = info["ticker"]
    try:
        stock = yf.Ticker(ticker)
        
        # Pull insider transactions
        # yfinance returns a pandas DataFrame for insider_transactions
        insider_df = stock.insider_transactions
        
        if insider_df is None or insider_df.empty:
            return {"company": info["name"], "transactions": []}
            
        # Clean and format the data
        # Common columns: 'Shares', 'Value', 'URL', 'Text', 'Insider', 'Position', 'Transaction', 'Start Date', 'Ownership'
        transactions = []
        
        # Take the top 10 most recent transactions
        for idx, row in insider_df.head(10).iterrows():
            # yfinance column names can be volatile, so we use safe `.get()` if treating as dict, or standard dot notation
            # We'll convert the row to a dict for safety
            r = row.to_dict()
            
            # The exact keys depend on the YF version, but typically:
            name = r.get("Insider", "Unknown Executive")
            position = r.get("Position", "Executive")
            action_text = str(r.get("Text", "")).lower()
            shares = r.get("Shares", 0)
            value = r.get("Value", 0)
            date = r.get("Start Date", "Recent")
            
            if pd.isna(name): name = "Unknown Executive"
            if pd.isna(position): position = "Executive"
            if pd.isna(shares): shares = 0
            if pd.isna(value): value = 0
            
            # Determine Buy vs Sell
            action_type = "SELL" if "sale" in action_text or "sell" in action_text else "BUY" if "buy" in action_text or "purchase" in action_text else "GRANT"
            
            # Skip automatic grants to focus on active buying/selling
            if action_type == "GRANT" and value == 0:
                continue
                
            transactions.append({
                "name": name,
                "position": position,
                "action": action_type,
                "shares": int(shares) if shares else 0,
                "value_usd": float(value) if value else 0.0,
                "date": str(date)[:10] if str(date) != "nan" else "Recent"
            })
            
        return {
            "company": info["name"],
            "transactions": transactions
        }

    except Exception as e:
        print(f"Error fetching insider data for {ticker}: {e}")
        return {"company": info["name"], "transactions": []}

if __name__ == "__main__":
    import pandas as pd
    print(get_insider_trading("aapl"))
