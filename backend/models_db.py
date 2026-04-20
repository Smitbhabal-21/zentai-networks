from sqlalchemy import Column, String, Integer, Float, JSON, Boolean
from database import Base

class Company(Base):
    __tablename__ = "companies"
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    ticker = Column(String)
    industry = Column(String)
    color = Column(String)

class FinancialMetrics(Base):
    __tablename__ = "financial_metrics"
    company_id = Column(String, primary_key=True, index=True)
    latest_kpis = Column(JSON)  # {revenue_m, ebitda_m, etc}
    quarterly_data = Column(JSON) # Array of quarterly stats
    health_score = Column(JSON) # {composite, rating, breakdown}

class StockData(Base):
    __tablename__ = "stock_data"
    company_id = Column(String, primary_key=True, index=True)
    company_name = Column(String)
    ticker = Column(String)
    real_ticker = Column(String)
    current_price = Column(Float)
    price_change = Column(Float)
    price_change_pct = Column(Float)
    week52_high = Column(Float)
    week52_low = Column(Float)
    avg_volume = Column(Integer)
    volatility_annualized_pct = Column(Float)
    candles = Column(JSON) # OHLCV list
    ma_data = Column(JSON) # Moving averages list

class SupplyChainMetrics(Base):
    __tablename__ = "supply_chain_metrics"
    company_id = Column(String, primary_key=True, index=True)
    latest = Column(JSON)
    trend = Column(JSON)

class RiskAnalytics(Base):
    __tablename__ = "risk_analytics"
    company_id = Column(String, primary_key=True, index=True)
    current_risk_score = Column(Float)
    risk_label = Column(String)
    volatility_pct = Column(Float)
    drawdown_pct = Column(Float)
    var_95_pct = Column(Float)
    anomaly_count_30d = Column(Integer)
    anomaly_events = Column(JSON)
    timeline = Column(JSON)
    shap = Column(JSON)

class GlobalMarket(Base):
    __tablename__ = "global_markets"
    symbol = Column(String, primary_key=True, index=True)
    name = Column(String)
    price = Column(Float)
    change = Column(Float)
    change_pct = Column(Float)
    direction = Column(String)
    category = Column(String)

class Incident(Base):
    __tablename__ = "incidents"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    company_id = Column(String, index=True)
    category = Column(String)
    title = Column(String)
    description = Column(String)
    region = Column(String)
    severity = Column(String)
    risk_score = Column(Integer)
    timestamp = Column(String)
    status = Column(String)
    business_impact = Column(String)
    recommended_action = Column(String)
    impact_areas = Column(JSON)
