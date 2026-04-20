from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
import models_db

router = APIRouter()

@router.get("/{company}")
def financial(company: str, db: Session = Depends(get_db)):
    data = db.query(models_db.FinancialMetrics).filter(models_db.FinancialMetrics.company_id == company).first()
    if not data:
        raise HTTPException(status_code=404, detail="Data not found in Data Warehouse")
    return {
        "company": company,
        "latest_kpis": data.latest_kpis,
        "quarterly": data.quarterly_data,
        "health_score": data.health_score
    }
