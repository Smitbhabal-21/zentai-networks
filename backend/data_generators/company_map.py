# ============================================================
# company_map.py — The Single Source of Truth
# ============================================================
# This file is the central registry for every company the
# platform tracks. Adding a new company is as simple as
# adding one entry here — the rest of the application picks
# it up automatically thanks to this shared dictionary.
#
# Each entry carries:
#   - "name"     : The full display name shown in the UI
#   - "ticker"   : The exact Yahoo Finance ticker symbol used
#                  for ALL live API calls across every engine
#   - "industry" : Used by the Geospatial and AI engines to
#                  contextualise risk analysis
#   - "tag"      : Short label for chart legends
#   - "color"    : Brand color for consistent chart rendering
# ============================================================

COMPANY_MAP = {
    # ----- Financials -----
    "citi_bank": {
        "name": "Citi Bank",
        "ticker": "C",
        "industry": "Financials",
        "tag": "CITI",
        "color": "#0059B3"
    },
    "jpmorgan": {
        "name": "JPMorgan Chase",
        "ticker": "JPM",
        "industry": "Financials",
        "tag": "JPM",
        "color": "#121A2F"
    },

    # ----- Technology -----
    "apple": {
        "name": "Apple Inc.",
        "ticker": "AAPL",
        "industry": "Technology",
        "tag": "AAPL",
        "color": "#A3AAAE"
    },
    "microsoft": {
        "name": "Microsoft",
        "ticker": "MSFT",
        "industry": "Technology",
        "tag": "MSFT",
        "color": "#00A4EF"
    },
    "meta": {
        "name": "Meta Platforms",
        "ticker": "META",
        "industry": "Technology",
        "tag": "META",
        "color": "#0668E1"
    },

    # ----- Semiconductors -----
    "nvidia": {
        "name": "Nvidia Corp",
        "ticker": "NVDA",
        "industry": "Semiconductors",
        "tag": "NVDA",
        "color": "#76B900"
    },

    # ----- Consumer / E-Commerce -----
    "amazon": {
        "name": "Amazon",
        "ticker": "AMZN",
        "industry": "Consumer",
        "tag": "AMZN",
        "color": "#FF9900"
    },

    # ----- Automotive -----
    "tesla": {
        "name": "Tesla Inc.",
        "ticker": "TSLA",
        "industry": "Automotive",
        "tag": "TSLA",
        "color": "#E31937"
    },

    # ----- Energy -----
    "exxon": {
        "name": "ExxonMobil",
        "ticker": "XOM",
        "industry": "Energy",
        "tag": "XOM",
        "color": "#D22630"
    },

    # ----- Pharmaceuticals -----
    "pfizer": {
        "name": "Pfizer Inc.",
        "ticker": "PFE",
        "industry": "Pharmaceuticals",
        "tag": "PFE",
        "color": "#0026B2"
    },
}
