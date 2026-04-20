from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
import models_db

router = APIRouter()

@router.get("/{company}")
def stock(company: str, period: str = "1y", db: Session = Depends(get_db)):
    data = db.query(models_db.StockData).filter(models_db.StockData.company_id == company).first()
    if not data:
        raise HTTPException(status_code=404, detail="Data not found in Data Warehouse")
    
    return {
        "company": data.company_name,
        "ticker": data.ticker,
        "real_ticker": data.real_ticker,
        "current_price": data.current_price,
        "price_change": data.price_change,
        "price_change_pct": data.price_change_pct,
        "week52_high": data.week52_high,
        "week52_low": data.week52_low,
        "avg_volume": data.avg_volume,
        "volatility_annualized_pct": data.volatility_annualized_pct,
        "candles": data.candles,
        "ma_data": data.ma_data
    }
