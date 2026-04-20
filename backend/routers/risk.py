from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
import models_db

router = APIRouter()

@router.get("/{company}")
def risk(company: str, db: Session = Depends(get_db)):
    data = db.query(models_db.RiskAnalytics).filter(models_db.RiskAnalytics.company_id == company).first()
    if not data:
        raise HTTPException(status_code=404, detail="Data not found in Data Warehouse")
    return {
        "company": company,
        "current_risk_score": data.current_risk_score,
        "risk_label": data.risk_label,
        "volatility_pct": data.volatility_pct,
        "drawdown_pct": data.drawdown_pct,
        "var_95_pct": data.var_95_pct,
        "anomaly_count_30d": data.anomaly_count_30d,
        "anomaly_events": data.anomaly_events,
        "timeline": data.timeline,
        "shap": data.shap
    }
