"""
Butterfly Effect Causal Engine.
Generates step-by-step impact chains linking global macro incidents
to specific vulnerabilities within a company's balance sheet or supply chain.
"""
from data_generators.company_map import COMPANY_MAP
import random

# Core global incidents that we map from
MACRO_INCIDENTS = [
    {"incident": "Suez Canal Logistics Blockage", "severity": "High"},
    {"incident": "Taiwanese Semiconductor Shortage", "severity": "Critical"},
    {"incident": "Middle East Crude Oil Spike", "severity": "High"},
    {"incident": "European Regulatory AI Act", "severity": "Medium"},
    {"incident": "Global Wheat Yield Drop", "severity": "Medium"},
]

def generate_butterfly_effect(company_key: str) -> dict:
    info = COMPANY_MAP.get(company_key)
    if not info:
        return {"error": "Company not found"}
        
    industry = info["industry"]
    
    # We dynamically select a macro incident based on industry vulnerability
    if "Tech" in industry or "Tele" in industry:
        base_incident = MACRO_INCIDENTS[1] # Semiconductors
        chain = [
            f"{base_incident['incident']} triggers a 22% drop in global silicon wafer exports.",
            f"Component lead times stretch from 14 days to 68 days.",
            f"{info['name']}'s hardware manufacturing experiences a 14% Q3 delivery shortfall.",
            f"Projected Impact: -$1.2B Revenue hit, triggering a 2.1% reduction in Net Margin."
        ]
    elif "Logistics" in industry or "Automotive" in industry or "Energy" in industry:
        base_incident = MACRO_INCIDENTS[2] # Oil
        chain = [
            f"{base_incident['incident']} pushes Brent Crude above $88/barrel.",
            f"Global freight and transport fuel surcharges rise 18%.",
            f"{info['name']}'s operational overhead spikes, squeezing Q3 EBITDA.",
            f"Projected Impact: 4.5% increase in SG&A, triggering an 'Urgent Margin Protection' protocol."
        ]
    elif "Food" in industry or "FMCG" in industry or "Retail" in industry:
        base_incident = MACRO_INCIDENTS[0] # Suez Canal
        chain = [
            f"{base_incident['incident']} creates a 12-day bottleneck in maritime shipping.",
            f"Consumer goods and raw material inventory days stretch to 45+.",
            f"{info['name']} faces out-of-stock events in 15% of European retail footprints.",
            f"Projected Impact: Accounts Receivable risks elevate, requiring a $450M cash buffer."
        ]
    else: # Healthcare / Finance
        base_incident = MACRO_INCIDENTS[3] # European Regulatory
        chain = [
            f"{base_incident['incident']} imposes strict compliance mandates on digital operations.",
            f"Cross-border data processing is throttled pending audit reviews.",
            f"{info['name']} must halt rollout of advanced AI processing tools in the EU sector.",
            f"Projected Impact: Short-term stagnation in European growth metrics, but minimal direct cash flow threat."
        ]

    # Add a random live latency timer to make it feel real-time
    latency = random.randint(12, 144) # hours
        
    return {
        "company": info["name"],
        "trigger_incident": base_incident["incident"],
        "severity": base_incident["severity"],
        "time_to_impact_hours": latency,
        "causal_chain": chain
    }
