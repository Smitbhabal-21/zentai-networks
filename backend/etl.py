"""
Master ETL Pipeline for Zentai Networks BI Terminal
Extracts data from Yahoo Finance via data_generators,
Transforms via Pandas/IsolationForest,
Loads into Relational Database (SQLAlchemy).
"""
import sys
import os

# Ensure backend directory is in path when run standalone
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, Base, SessionLocal
import models_db

from data_generators.company_map import COMPANY_MAP
from data_generators.financial import get_financials
from data_generators.stock import get_stock_history
from data_generators.supply_chain import get_supply_chain
from data_generators.risk import get_risk_analytics
from data_generators.global_markets import get_global_markets
from data_generators.incidents import get_incidents

def run_etl():
    print("🚀 Connecting to Data Warehouse...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Clear old data (Full Refresh Strategy)
        print("🧹 Clearing legacy data lakes...")
        db.query(models_db.Company).delete()
        db.query(models_db.FinancialMetrics).delete()
        db.query(models_db.StockData).delete()
        db.query(models_db.SupplyChainMetrics).delete()
        db.query(models_db.RiskAnalytics).delete()
        db.query(models_db.GlobalMarket).delete()
        db.query(models_db.Incident).delete()

        # 2. Extract & Load Global Markets
        print("🌐 Extracting Global Macro Market Feeds...")
        g_data = get_global_markets()
        if g_data and "markets" in g_data:
            for m in g_data.get("markets", []):
                # find category
                cat = "General"
                for cat_name, items in g_data.get("by_category", {}).items():
                    if any(x["symbol"] == m["symbol"] for x in items):
                        cat = cat_name
                        break

                g_record = models_db.GlobalMarket(
                    symbol=m["symbol"],
                    name=m["name"],
                    price=m["price"],
                    change=m["change"],
                    change_pct=m["change_pct"],
                    direction=m["direction"],
                    category=cat
                )
                db.add(g_record)

        # 3. Extract & Load Company Specific Data
        for comp_key, info in COMPANY_MAP.items():
            print(f"🏢 Running Data Engineering Pipeline for {info['name']} ({comp_key})...")
            
            # Company Record
            c_record = models_db.Company(
                id=comp_key, name=info["name"], ticker=info["ticker"], 
                industry=info["industry"], color=info["color"]
            )
            db.add(c_record)

            # Financial Data
            print(f"   ├─ Fetching Financial Statements (Income/Balance Sheet)...")
            f_data = get_financials(comp_key)
            db.add(models_db.FinancialMetrics(
                company_id=comp_key,
                latest_kpis=f_data.get("latest_kpis", {}),
                quarterly_data=f_data.get("quarterly", []),
                health_score=f_data.get("health_score", {})
            ))

            # Stock Data
            print(f"   ├─ Fetching Stock & Volume Data (Yahoo Finance)...")
            s_data = get_stock_history(comp_key, "1y")
            db.add(models_db.StockData(
                company_id=comp_key,
                company_name=s_data.get("company"),
                ticker=info["tag"],
                real_ticker=s_data.get("real_ticker"),
                current_price=s_data.get("current_price", 0),
                price_change=s_data.get("price_change", 0),
                price_change_pct=s_data.get("price_change_pct", 0),
                week52_high=s_data.get("week52_high", 0),
                week52_low=s_data.get("week52_low", 0),
                avg_volume=s_data.get("avg_volume", 0),
                volatility_annualized_pct=s_data.get("volatility_annualized_pct", 0),
                candles=s_data.get("candles", []),
                ma_data=s_data.get("ma_data", [])
            ))

            # Supply Chain
            print(f"   ├─ Calculating Supply Chain Operations KPIs...")
            sc_data = get_supply_chain(comp_key)
            db.add(models_db.SupplyChainMetrics(
                company_id=comp_key,
                latest=sc_data.get("latest", {}),
                trend=sc_data.get("trend", [])
            ))

            # Risk (ML)
            print(f"   ├─ Executing ML Pipeline (Isolation Forest & SHAP) for Risk Score...")
            r_data = get_risk_analytics(comp_key)
            db.add(models_db.RiskAnalytics(
                company_id=comp_key,
                current_risk_score=r_data.get("current_risk_score", 0),
                risk_label=r_data.get("risk_label", "Moderate"),
                volatility_pct=r_data.get("volatility_pct", 0),
                drawdown_pct=r_data.get("drawdown_pct", 0),
                var_95_pct=r_data.get("var_95_pct", 0),
                anomaly_count_30d=r_data.get("anomaly_count_30d", 0),
                anomaly_events=r_data.get("anomaly_events", []),
                timeline=r_data.get("timeline", []),
                shap=r_data.get("shap", [])
            ))

            # Incidents
            print(f"   ├─ Generating Incident Intelligence Logs...")
            inc_data = get_incidents(comp_key)
            for inc in inc_data.get("incidents", []):
                db.add(models_db.Incident(
                    company_id=comp_key,
                    category=inc.get("category"),
                    title=inc.get("title"),
                    description=inc.get("description"),
                    region=inc.get("region"),
                    severity=inc.get("severity"),
                    risk_score=inc.get("risk_score"),
                    timestamp=inc.get("timestamp"),
                    status=inc.get("status"),
                    business_impact=inc.get("business_impact"),
                    recommended_action=inc.get("recommended_action"),
                    impact_areas=inc.get("impact_areas", [])
                ))

        print("💽 Committing transaction to Relational Database (SQL)...")
        db.commit()
        print("✅ End-to-End ETL Pipeline Complete.")

    except Exception as e:
        db.rollback()
        print(f"❌ ETL Pipeline Failed: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    run_etl()
