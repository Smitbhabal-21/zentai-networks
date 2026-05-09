"""
AI Advisory Data Generator.
Combines real-time financial/risk data with researched historical context (2024-2025)
to generate actionable profit-enhancement strategies.
"""
from backend.data_generators.company_map import COMPANY_MAP
from backend.data_generators.financial import get_financials
from backend.data_generators.stock import get_stock_history
from backend.data_generators.risk import get_risk_analytics

RESEARCH_DB = {
    "citi": {
        "context": "Citi reported $85.2B revenue in 2025 (up 6%), demonstrating positive operating leverage from its multi-year simplification strategy. The bank has focused heavily on 5 core businesses and divesting international consumer franchises (like Banamex).",
        "challenges": [
            "Operating under stringent regulatory consent orders requiring vast remediation.",
            "Sensitivity to global interest rate fluctuations and macroeconomic headwinds.",
            "U.S. consumer credit card net charge-offs in a volatile economic environment."
        ],
        "strategies": [
            {
                "title": "Accelerate 'Sky' AI Integration in Wealth Management",
                "description": "Leverage recent AI investments to boost productivity and cross-selling in the Wealth segment, aiming to close the profitability gap with peers and exceed the 10-11% RoTCE target.",
                "priority": "High"
            },
            {
                "title": "Accelerate International Divestitures",
                "description": "Fast-track remaining non-core international consumer exits to free up capital for high-margin Services and Markets divisions.",
                "priority": "High"
            },
            {
                "title": "Tighten Credit Risk Modeling",
                "description": "Enhance predictive modeling for U.S. consumer credit cards to preemptively adjust allowances as unemployment assumptions fluctuate.",
                "priority": "Medium"
            }
        ]
    },
    "dhl": {
        "context": "DHL Group reported €84.2B revenue in 2024 (up 3.0%), driven by strong Q4 e-commerce volumes despite a weak global trade environment. EBIT was €5.9B. The company launched 'Strategy 2030' and the 'Fit for Growth' program to improve the cost base by >€1B.",
        "challenges": [
            "Macroeconomic volatility, trade conflicts, and Red Sea crisis causing supply chain bottlenecks.",
            "Muted market demand, particularly in European road freight.",
            "Fluctuating air and ocean freight rates squeezing margins."
        ],
        "strategies": [
            {
                "title": "Accelerate 'Fit for Growth' Cost Reduction",
                "description": "Aggressively implement the €1B+ cost-improvement program to protect EBIT margins amid muted global trade volumes.",
                "priority": "High"
            },
            {
                "title": "Expand High-Margin Sectors",
                "description": "Pivot capacity towards resilient, high-growth sectors identified in Strategy 2030: pharmaceuticals, medical devices, and renewable energy logistics.",
                "priority": "High"
            },
            {
                "title": "Monetize Green Logistics",
                "description": "Capitalize on 'Green Logistics of Choice' by offering premium, low-carbon shipping solutions to enterprise clients looking to decarbonize their Scope 3 emissions.",
                "priority": "Medium"
            }
        ]
    },
    "mcd": {
        "context": "McDonald's rebounded strongly in 2025 with $26.9B revenue and 3.1% global comparable sales growth. Growth was fueled by value leadership (e.g., $5 Meal Deal) and a massive digital loyalty program (210M active users generating $37B systemwide).",
        "challenges": [
            "Price-sensitive consumers and inflation squeezing low-income spending habits.",
            "Reputational recovery from the late-2024 E. coli outbreak.",
            "Structural shifts in dietary habits (e.g., rise of GLP-1 weight-loss medications)."
        ],
        "strategies": [
            {
                "title": "Double Down on Digital Loyalty Monetization",
                "description": "Leverage the 210M-strong active user base to deploy hyper-personalized, data-driven offers, driving frequency without across-the-board discounting.",
                "priority": "High"
            },
            {
                "title": "Optimize the Value Matrix",
                "description": "Maintain traffic momentum through strategic value platforms (like the $5 Meal Deal) while protecting franchisee margins through supply chain efficiencies.",
                "priority": "High"
            },
            {
                "title": "Menu Evolution for Health Trends",
                "description": "Accelerate testing and rollout of high-protein, health-conscious menu items to counter the structural impact of GLP-1 medications on traditional fast-food demand.",
                "priority": "Medium"
            }
        ]
    },
    "aapl": {
        "context": "Apple reported record fiscal 2025 revenue of $416.16B (up 6.43%). Growth was driven by resilient premium iPhone demand and record-breaking Services revenue (>26% of total). The company launched its privacy-centric 'Apple Intelligence' strategy.",
        "challenges": [
            "Intense competitive pressure in China from domestic rivals (Huawei, Xiaomi).",
            "Lengthening iPhone upgrade cycles and smartphone market saturation.",
            "Global regulatory scrutiny and potential tariff impacts on supply chain."
        ],
        "strategies": [
            {
                "title": "Monetize 'Apple Intelligence' Ecosystem",
                "description": "Drive hardware upgrade super-cycles by restricting advanced AI features to newer silicon, while exploring premium subscription tiers for third-party AI integrations (e.g., OpenAI/Gemini).",
                "priority": "High"
            },
            {
                "title": "Aggressive Services Expansion",
                "description": "Continue diversifying revenue away from hardware by expanding high-margin Services (Apple TV+, Arcade, Financial Services) to capitalize on the massive installed base.",
                "priority": "High"
            },
            {
                "title": "Supply Chain Diversification",
                "description": "Accelerate the shift of manufacturing out of China (to India and Vietnam) to mitigate geopolitical risks and tariff exposure.",
                "priority": "Medium"
            }
        ]
    },
    "xom": {
        "context": "ExxonMobil delivered $28.8B in 2025 earnings and record production (4.7M boe/d) from advantaged assets like the Permian and Guyana. The company pursues a 'dual-engine' strategy, investing heavily in traditional oil while committing up to $30B to low-carbon solutions.",
        "challenges": [
            "Fluctuating crude oil prices and weaker chemical margins.",
            "Regulatory pressures and scrutiny over the pace of its energy transition strategy.",
            "Geopolitical disruptions impacting global logistics and production."
        ],
        "strategies": [
            {
                "title": "Maximize 'Advantaged' Asset Cash Flow",
                "description": "Ruthlessly prioritize capital allocation towards high-return, low-cost barrels in Guyana and the Permian Basin to sustain robust cash generation amid price volatility.",
                "priority": "High"
            },
            {
                "title": "Pioneer AI Data Center Power Solutions",
                "description": "Capitalize on the late-2025 strategic pivot to provide behind-the-meter natural gas power generation, integrated with CCS, to energy-hungry AI data centers.",
                "priority": "High"
            },
            {
                "title": "Scale CCS-as-a-Service",
                "description": "Accelerate the commercialization of Carbon Capture and Storage along the U.S. Gulf Coast to create a new, high-margin revenue stream while navigating transition pressures.",
                "priority": "Medium"
            }
        ]
    },
    "jnj": {
        "context": "Johnson & Johnson reported strong 2025 sales of $94.2B (up 6.0%), driven by its pivot to a disease-centric approach in Innovative Medicine and MedTech. The company invested >$17B in R&D and executed major M&A (e.g., Shockwave Medical for $13.1B).",
        "challenges": [
            "Major patent cliffs, specifically the loss of exclusivity for blockbuster drug Stelara.",
            "Ongoing legal liabilities and talc litigation risks.",
            "Fierce competition requiring constant innovation in MedTech and Pharma."
        ],
        "strategies": [
            {
                "title": "Accelerate Post-Stelara Pipeline Execution",
                "description": "Aggressively commercialize recent M&A acquisitions (Ambrx, Proteologix) and push the robust oncology/immunology pipeline to offset biosimilar erosion.",
                "priority": "High"
            },
            {
                "title": "Optimize MedTech Integration",
                "description": "Rapidly integrate Shockwave Medical and V-Wave to dominate high-growth cardiovascular segments and drive immediate top-line synergies.",
                "priority": "High"
            },
            {
                "title": "Leverage the $55B US Investment Pledge",
                "description": "Utilize planned infrastructure investments to optimize domestic manufacturing, reducing reliance on vulnerable global supply chains and mitigating tariff risks.",
                "priority": "Medium"
            }
        ]
    },
    "pg": {
        "context": "Procter & Gamble reported $84.3B in net sales for FY2025, generating $17.8B in operating cash flow. The company focuses on 'irresistible superiority' in daily-use categories, marking its 69th consecutive year of dividend increases.",
        "challenges": [
            "Macroeconomic volatility and consumption slowdowns in key global markets.",
            "Commodity cost pressures, tariffs, and increased shipping expenses.",
            "Supply chain disruptions and fierce competition in consumer staples."
        ],
        "strategies": [
            {
                "title": "Execute 15% Workforce Restructuring",
                "description": "Accelerate the planned reduction of non-manufacturing roles to streamline operations, drive efficiency, and fund reinvestment in core brand superiority.",
                "priority": "High"
            },
            {
                "title": "Prune Underperforming Portfolio Assets",
                "description": "Aggressively exit lower-margin brands and SKUs to protect overall profitability against commodity and logistics headwinds.",
                "priority": "High"
            },
            {
                "title": "Supply Chain Digitization",
                "description": "Invest heavily in digital acumen and predictive analytics to optimize inventory, forecast demand, and mitigate ongoing manufacturing interruptions.",
                "priority": "Medium"
            }
        ]
    },
    "ford": {
        "context": "Ford reached $187.3B in 2025 revenue but faced an $8.2B net loss due to a massive $19.5B Q4 special charge. The company is overhauling its EV strategy after $5.1B in Model e losses, pivoting towards hybrids and a flexible 'Universal EV Platform'.",
        "challenges": [
            "Cooling consumer demand for premium EVs and intense price competition from Tesla and Chinese entrants.",
            "Massive financial drag from the Model e division.",
            "Supply chain vulnerabilities for battery materials and public charging infrastructure."
        ],
        "strategies": [
            {
                "title": "Accelerate Hybrid Production Ramp",
                "description": "Capitalize on strong consumer preference by shifting capital from pure BEVs to highly profitable extended-range hybrids and traditional Ford Pro commercial vehicles.",
                "priority": "High"
            },
            {
                "title": "Execute 'Universal EV Platform' Shift",
                "description": "Transition North American EV development exclusively to smaller, affordable architectures to compete on price, abandoning high-cost, large-format BEVs.",
                "priority": "High"
            },
            {
                "title": "Monetize Battery Energy Storage (BESS)",
                "description": "Diversify EV investments by aggressively scaling the new stationary battery storage business to capture grid-level demand and utilize existing battery plant capacity.",
                "priority": "Medium"
            }
        ]
    },
    "att": {
        "context": "AT&T reported 2025 revenues of $125.6B. The company solidified its position as a pure-play connectivity provider post-media divestitures, achieving strong 5G and fiber growth, and reported a major net income boost from the DIRECTV sale.",
        "challenges": [
            "Commoditization of core voice and data services limiting pricing power.",
            "Massive capital intensity required for 5G (C-band) and fiber network buildouts.",
            "High debt load sensitivity in a higher interest rate environment."
        ],
        "strategies": [
            {
                "title": "Drive Fiber-Mobility Convergence",
                "description": "Aggressively bundle AT&T Fiber with AT&T Mobility to lock in households, drastically reducing churn and increasing Customer Lifetime Value (CLV).",
                "priority": "High"
            },
            {
                "title": "Scale 'Gigapower' Joint Ventures",
                "description": "Utilize off-balance-sheet structures (like the BlackRock partnership) to accelerate fiber footprint expansion (targeting 50M locations) without crippling CapEx.",
                "priority": "High"
            },
            {
                "title": "Monetize 5G Standalone (SA) Core",
                "description": "Launch premium network slicing services for enterprise clients, creating new B2B revenue streams beyond commoditized consumer data plans.",
                "priority": "Medium"
            }
        ]
    },
    "wmt": {
        "context": "Walmart posted $681.0B in FY2025 revenue (up 5.1%). The omnichannel strategy proved highly successful, combining 10,750+ stores with double-digit e-commerce growth and high-margin services like Walmart Connect and a 200K+ seller marketplace.",
        "challenges": [
            "Intense e-commerce competition from Amazon and emerging discount platforms.",
            "Economic pressures impacting consumer discretionary spending.",
            "Tariff threats threatening the 'Everyday Low Price' (EDLP) model and margins."
        ],
        "strategies": [
            {
                "title": "Scale Walmart Connect Advertising",
                "description": "Aggressively expand high-margin retail media networks, leveraging vast first-party shopper data to outpace traditional retail sales growth.",
                "priority": "High"
            },
            {
                "title": "Accelerate E-commerce Marketplace Expansion",
                "description": "Grow the 200K+ third-party seller base and optimize omnichannel fulfillment (store-to-home delivery) to counter Amazon's dominance.",
                "priority": "High"
            },
            {
                "title": "AI-Driven Supply Chain Automation",
                "description": "Deploy generative AI and automation across distribution centers to compress fulfillment costs and protect margins against tariff and inflation pressures.",
                "priority": "Medium"
            }
        ]
    }
}

def get_company_advisory(company_key: str) -> dict:
    """
    Generates AI strategic advisory by merging live Yahoo Finance metrics 
    with researched 2024-2025 industry context.
    """
    if company_key not in COMPANY_MAP:
        return {"error": "Company not found"}
        
    info = COMPANY_MAP[company_key]
    research = RESEARCH_DB.get(company_key, {})
    
    # Fetch live data to ground the suggestions
    fin = get_financials(company_key)
    stock = get_stock_history(company_key, "1mo")
    risk = get_risk_analytics(company_key)
    
    # Calculate dynamic strategy based on live data
    live_strategies = []
    
    # Check margins
    net_margin = fin.get("latest_kpis", {}).get("net_margin_pct")
    if net_margin is not None:
        if net_margin < 5:
            live_strategies.append({
                "title": "Urgent Margin Protection Protocol",
                "description": f"Live net margins are dangerously compressed at {net_margin}%. Immediate freeze on non-essential CapEx and rigorous SG&A audit required.",
                "priority": "Critical"
            })
        elif net_margin > 15:
            live_strategies.append({
                "title": "Deploy Excess Margin Capital",
                "description": f"Healthy net margins at {net_margin}% provide a moat. Recommend accelerating M&A or expanding share buyback programs while capital is highly accretive.",
                "priority": "Medium"
            })
            
    # Check risk score
    risk_score = risk.get("current_risk_score", 0)
    if risk_score > 60:
        live_strategies.append({
            "title": "Mitigate Market Volatility Risk",
            "description": f"Live ML risk models detect heightened volatility (Score: {risk_score:.0f}). Activate hedging strategies and increase liquidity reserves immediately.",
            "priority": "High"
        })
        
    # Combine static research strategies with live dynamic strategies
    all_strategies = live_strategies + research.get("strategies", [])
    
    return {
        "company": info["name"],
        "ticker": info["ticker"],
        "industry": info["industry"],
        "context": research.get("context", ""),
        "challenges": research.get("challenges", []),
        "strategies": all_strategies,
        "live_metrics": {
            "revenue": fin.get("latest_kpis", {}).get("revenue_m"),
            "margin": net_margin,
            "stock_price": stock.get("current_price"),
            "price_change_pct": stock.get("price_change_pct"),
            "risk_score": risk_score
        }
    }
