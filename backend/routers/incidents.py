from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
import models_db
from data_generators.company_map import COMPANY_MAP

router = APIRouter()

@router.get("/{company}")
def incidents(company: str, db: Session = Depends(get_db)):
    if company not in COMPANY_MAP:
        raise HTTPException(status_code=404, detail=f"Company '{company}' not found.")
    
    records = db.query(models_db.Incident).filter(models_db.Incident.company_id == company).all()
    
    incidents_list = []
    for r in records:
        incidents_list.append({
            "category": r.category,
            "title": r.title,
            "description": r.description,
            "region": r.region,
            "severity": r.severity,
            "risk_score": r.risk_score,
            "timestamp": r.timestamp,
            "status": r.status,
            "business_impact": r.business_impact,
            "recommended_action": r.recommended_action,
            "impact_areas": r.impact_areas
        })
        
    high = sum(1 for i in incidents_list if i["severity"] == "high")
    med = sum(1 for i in incidents_list if i["severity"] == "medium")
    low = sum(1 for i in incidents_list if i["severity"] == "low")
        
    return {
        "company": company,
        "total_incidents": len(incidents_list),
        "high_severity": high,
        "medium_severity": med,
        "low_severity": low,
        "incidents": incidents_list,
        # Truncating market signals here as they are part of the original logic
        # but the UI relies mostly on the incidents array itself
    }
