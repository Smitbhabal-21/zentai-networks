# Zentai Networks Terminal: Building an End-to-End Analytics Platform for the E-Commerce & Manufacturing Supply Chain

## 1. Introduction
Modern supply chains require more than just tracking; they demand real-time visibility and predictive risk assessment. The **Zentai Networks Terminal** is an end-to-end operational intelligence system designed to bridge the gap between financial performance, global macro-markets, and supply chain resilience. 

Built as a capstone project for the MITA program, the terminal demonstrates a full-stack, enterprise-grade architecture. By integrating highly volatile financial data with custom anomaly-detection models, the platform proactively identifies hidden supply chain distributions before they impact executive KPIs. It delivers this intelligence through a high-performance React dashboard tailored for rapid decision-making across three dummy business units (Citi Bank, Bakery, and Steelworks).

## 2. Dataset Overview
To emulate highly volatile, realistic corporate operations without relying on stagnant CSV files, the data pipeline dynamically ingests comprehensive financial datasets from real-world proxies via **Yahoo Finance (`yfinance`) API** (such as Citi Bank (C), DHL (DHLGY), and McDonald's (MCD)).

**The Data Model includes:**
- **Financial Statements:** Quarterly Revenue, EBITDA, and Margin ledgers.
- **Supply Chain Proxies:** Working capital data (Days Payable/Receivable, Inventory Turnover).
- **Macro Markets & Stock:** Historical OHLCV (Open, High, Low, Close, Volume) records, along with market volatility indices (VIX), and commodities (Gold, Crude, Wheat).

**Key Challenges:** Normalizing extremely high-dimensionality data coming from different operational sectors, handling unstructured real-time anomalies, and synthesizing disparate tables into clean representations for machine learning.

## 3. Technical Architecture
The system employs a strict Data Engineering lifecycle, separating the data acquisition pipeline from the UI presentation layer.

**Architecture Flow:**
1. **Data Sources (API):** Daily extraction from Yahoo Finance APIs.
2. **ETL Pipeline (Python/Pandas):** An automated scheduled script (`etl.py`) ingests the raw data, handles missing values, and synthesizes composite health scores and supply chain KPIs using `NumPy` and `Pandas`.
3. **Data Warehouse (PostgreSQL/SQLAlchemy):** The transformed data is committed into structured relational tables (Companies, Financials, ML Risk, Incidents). *Note: Configured via SQLAlchemy ORM for seamless switching between local SQLite development and robust PostgreSQL deployments.*
4. **REST APIs (FastAPI):** A high-concurrency Python backend asynchronously serves pre-computed data from the warehouse to the frontend.
5. **Dashboard Layer (React / Vite):** The user interface is built with React 18, generating SVG data visualizations via `Recharts` and rendering real-time ticker tapes utilizing `framer-motion`.

## 4. ML Models & Explainable AI (XAI)
To elevate the platform beyond historical reporting, I integrated a robust Machine Learning pipeline specifically tuned for anomaly detection within supply chain price data.

- **Feature Engineering:** Log-returns, exponential moving averages, and 20-day volatility metrics were engineered over 2 years of daily data points to establish a baseline of "normal market behavior".
- **Model Selection (Isolation Forest):** Using `scikit-learn`, an Isolation Forest algorithm detects severe deviations in market conditions that threaten profitability (e.g., unexpected spikes in raw material costs corresponding with volume dry-outs). Output is mapped to a calibrated **Risk Score (0–100)**.
- **Explainability (SHAP):** Given executive reluctance to trust "black-box" models, the integration of SHAP (SHapley Additive exPlanations) visualizes exactly *why* a risk alert was triggered, attributing fractional risk increases to explicit features (e.g., "-0.05 from VIX, +0.12 from 50MA Volatility").

## 5. Dashboard Showcase
The user interface features a highly polished "Scarlet and White" aesthetic mirroring professional financial terminals.

**Key Visualizations Include:**
- **Risk & Anomaly Module:** Radial gauges for risk scoring alongside composed charts tracking 180-day volatility overlayed with active anomaly triggers.
- **Supply Chain Intelligence:** A live, AI-generated Incident Feed that dynamically reacts to macro signals (e.g., matching a spike in Wheat Futures to a generated "Bakery Supply Sourcing Delay" incident).
- **Financials:** Clean quarterly comparison graphs measuring top-line revenue against gross margin erosion.

## 6. Lessons Learned
- **Decoupling Data from UI:** Initially, data extraction was run synchronously upon HTTP requests. This caused UI blocking. Pivoting to a strict batch-process ETL script loading into a centralized relational SQL database vastly improved responsiveness and scalability.
- **Data Veracity:** Dealing with real-world financial data meant managing unpredictable nulls and market holidays. Building robust Pandas cleaning functions was critical to keeping the backend ML pipelines stable.
- **What Worked:** Leveraging FastAPI in conjunction with SQLAlchemy provided an incredibly type-safe and resilient API layer.
