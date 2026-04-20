from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models_db

router = APIRouter()

@router.get("")
def global_markets(db: Session = Depends(get_db)):
    records = db.query(models_db.GlobalMarket).all()
    
    markets = []
    by_category = {}
    
    for r in records:
        market_dict = {
            "name": r.name,
            "symbol": r.symbol,
            "price": r.price,
            "change": r.change,
            "change_pct": r.change_pct,
            "direction": r.direction
        }
        markets.append(market_dict)
        if r.category not in by_category:
            by_category[r.category] = []
        by_category[r.category].append(market_dict)
        
    return {
        "markets": markets,
        "by_category": by_category
    }
