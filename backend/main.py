"""
Zentai Networks BI Terminal — FastAPI Backend (v2)
Real-world financial data via Yahoo Finance + ML risk engine
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import financial, stock, supply_chain, risk, global_markets, incidents
from data_generators.company_map import COMPANY_MAP

app = FastAPI(
    title="Zentai Networks BI Terminal",
    description="Bloomberg-style enterprise analytics across 10 global portfolios",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(financial.router,      prefix="/api/financial",  tags=["Financial"])
app.include_router(stock.router,          prefix="/api/stock",      tags=["Stock"])
app.include_router(supply_chain.router,   prefix="/api/supply",     tags=["Supply Chain"])
app.include_router(risk.router,           prefix="/api/risk",       tags=["Risk"])
app.include_router(global_markets.router, prefix="/api/markets",    tags=["Global Markets"])
app.include_router(incidents.router,      prefix="/api/incidents",  tags=["Incidents"])


@app.get("/")
def root():
    return {"status": "online", "version": "2.0.0", "companies": list(COMPANY_MAP.keys())}


@app.get("/api/companies")
def companies():
    return {k: {"name": v["name"], "ticker": v["tag"], "industry": v["industry"], "color": v["color"]}
            for k, v in COMPANY_MAP.items()}
