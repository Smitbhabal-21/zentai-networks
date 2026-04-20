from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
import models_db
import math

router = APIRouter()

def clean_dict(d):
    """Recursively convert float('nan') to None so FastAPI generates valid JSON."""
    if isinstance(d, dict):
        return {k: clean_dict(v) for k, v in d.items()}
    elif isinstance(d, list):
        return [clean_dict(x) for x in d]
    elif isinstance(d, float):
        if math.isnan(d) or math.isinf(d):
            return None
        return d
    return d

@router.get("/{company}")
def supply_chain(company: str, db: Session = Depends(get_db)):
    data = db.query(models_db.SupplyChainMetrics).filter(models_db.SupplyChainMetrics.company_id == company).first()
    if not data:
        raise HTTPException(status_code=404, detail="Data not found in Data Warehouse")
        
    latest = clean_dict(data.latest)
    trend = clean_dict(data.trend)
    
    return {
        "company": company,
        "latest": latest,
        "trend": trend
    }
