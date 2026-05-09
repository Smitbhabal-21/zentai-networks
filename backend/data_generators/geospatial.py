"""
geospatial.py — Global Operations & Supply Chain Heatmap Engine

This engine maps each company's real-world physical infrastructure
onto a 3D Plotly globe, then automatically detects which facilities
are dangerously close to active geopolitical risk zones.

How the risk detection works (Haversine Formula):
    The Earth is a sphere, so you cannot use simple Euclidean geometry
    (a² + b² = c²) to calculate the distance between two coordinates.
    We use the Haversine formula instead, which calculates the
    'great-circle distance' — the shortest path between two points
    on the surface of a sphere.

    If the distance between a company node and a danger zone is less
    than the danger zone's defined radius, the node is automatically
    flagged as 'Warning' or 'CRITICAL RISK' in the status table.

Real-world accuracy:
    All facility locations are hardcoded from publicly available
    information (e.g., Apple's Foxconn plant in Zhengzhou, Tesla's
    Gigafactory in Shanghai). The danger zones reflect real-world
    geopolitical events as of the project's development date.
"""
from backend.data_generators.company_map import COMPANY_MAP
import math

# Real-world infrastructure mapping for the 10 specific companies
COMPANY_NODES = {
    "apple": [
        {"name": "Apple Park HQ (Cupertino)", "lat": 37.3346, "lon": -122.0090, "type": "Headquarters"},
        {"name": "Foxconn Assembly (Zhengzhou)", "lat": 34.7466, "lon": 113.6253, "type": "Manufacturing"},
        {"name": "TSMC Fabrication (Taiwan)", "lat": 24.7731, "lon": 120.9886, "type": "Supplier"},
        {"name": "Cork Operations (Ireland)", "lat": 51.8985, "lon": -8.4756, "type": "EU Operations"}
    ],
    "microsoft": [
        {"name": "Redmond Campus HQ", "lat": 47.6740, "lon": -122.1215, "type": "Headquarters"},
        {"name": "Azure Data Center (Dublin)", "lat": 53.3498, "lon": -6.2603, "type": "Infrastructure"},
        {"name": "Azure Data Center (Pune)", "lat": 18.5204, "lon": 73.8567, "type": "Infrastructure"},
        {"name": "Surface Assembly (China)", "lat": 22.5431, "lon": 114.0579, "type": "Manufacturing"}
    ],
    "amazon": [
        {"name": "Seattle HQ", "lat": 47.6062, "lon": -122.3321, "type": "Headquarters"},
        {"name": "AWS US-East (N. Virginia)", "lat": 39.0438, "lon": -77.4874, "type": "Infrastructure"},
        {"name": "EU Distribution (Frankfurt)", "lat": 50.1109, "lon": 8.6821, "type": "Logistics"},
        {"name": "Asia Fulfillment (Tokyo)", "lat": 35.6762, "lon": 139.6503, "type": "Logistics"}
    ],
    "meta": [
        {"name": "Menlo Park HQ", "lat": 37.4529, "lon": -122.1817, "type": "Headquarters"},
        {"name": "Prineville Data Center", "lat": 44.2998, "lon": -120.8346, "type": "Infrastructure"},
        {"name": "Lulea Data Center (Sweden)", "lat": 65.5848, "lon": 22.1567, "type": "Infrastructure"},
        {"name": "Singapore Regional Hub", "lat": 1.3521, "lon": 103.8198, "type": "Operations"}
    ],
    "tesla": [
        {"name": "Gigafactory Texas (HQ)", "lat": 30.2223, "lon": -97.6171, "type": "Headquarters & Assembly"},
        {"name": "Gigafactory Shanghai", "lat": 30.8752, "lon": 121.9216, "type": "Manufacturing"},
        {"name": "Gigafactory Berlin", "lat": 52.3961, "lon": 13.8011, "type": "Manufacturing"},
        {"name": "Lithium Sourcing (Chile)", "lat": -23.8634, "lon": -69.1328, "type": "Supplier"}
    ],
    "nvidia": [
        {"name": "Santa Clara HQ", "lat": 37.3541, "lon": -121.9552, "type": "Headquarters"},
        {"name": "TSMC Primary Fab (Taiwan)", "lat": 24.7731, "lon": 120.9886, "type": "Manufacturing"},
        {"name": "Samsung Sub-Fab (South Korea)", "lat": 37.2636, "lon": 127.0286, "type": "Manufacturing"},
        {"name": "Mellanox R&D (Israel)", "lat": 32.0853, "lon": 34.7818, "type": "R&D"}
    ],
    "jpmorgan": [
        {"name": "New York HQ (Wall Street)", "lat": 40.7074, "lon": -74.0113, "type": "Headquarters"},
        {"name": "London Trading Floor", "lat": 51.5074, "lon": -0.1278, "type": "Operations"},
        {"name": "Tokyo Financial Hub", "lat": 35.6762, "lon": 139.6503, "type": "Operations"},
        {"name": "Frankfurt Euro Clearance", "lat": 50.1109, "lon": 8.6821, "type": "Operations"}
    ],
    "citi": [
        {"name": "New York HQ", "lat": 40.7128, "lon": -74.0060, "type": "Headquarters"},
        {"name": "London European Hub", "lat": 51.5074, "lon": -0.1278, "type": "Operations"},
        {"name": "Hong Kong Asian Hub", "lat": 22.3193, "lon": 114.1694, "type": "Operations"},
        {"name": "Mexico City Retail (Banamex)", "lat": 19.4326, "lon": -99.1332, "type": "Revenue"}
    ],
    "exxon": [
        {"name": "Houston HQ", "lat": 29.7604, "lon": -95.3698, "type": "Headquarters"},
        {"name": "Permian Basin Extraction", "lat": 31.8457, "lon": -102.3676, "type": "Extraction"},
        {"name": "Guyana Offshore Block", "lat": 8.0, "lon": -57.0, "type": "Extraction"},
        {"name": "Singapore Refinery", "lat": 1.25, "lon": 103.68, "type": "Refining"}
    ],
    "pfizer": [
        {"name": "New York HQ", "lat": 40.7527, "lon": -73.9772, "type": "Headquarters"},
        {"name": "Kalamazoo Manufacturing", "lat": 42.2917, "lon": -85.5872, "type": "Manufacturing"},
        {"name": "Puurs Vaccine Plant (Belgium)", "lat": 51.0763, "lon": 4.2789, "type": "Manufacturing"},
        {"name": "API Sourcing (India)", "lat": 19.0760, "lon": 72.8777, "type": "Supplier"}
    ]
}

# Danger Zones (Macro Incidents to plot as red circles)
DANGER_ZONES = [
    {"name": "Taiwan Strait Tensions", "lat": 24.0, "lon": 120.5, "radius_km": 1000},
    {"name": "Red Sea Shipping Disruption", "lat": 20.0, "lon": 38.0, "radius_km": 1500},
    {"name": "Middle East Conflict Zone", "lat": 31.0, "lon": 35.0, "radius_km": 800},
    {"name": "South China Sea Disputes", "lat": 15.0, "lon": 115.0, "radius_km": 1200}
]

def calculate_distance(lat1, lon1, lat2, lon2):
    # Rough haversine approximation for risk collision
    R = 6371 # Earth radius in km
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat/2) * math.sin(dLat/2) + math.cos(math.radians(lat1)) \
        * math.cos(math.radians(lat2)) * math.sin(dLon/2) * math.sin(dLon/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def get_geospatial_exposure(company_key: str) -> dict:
    info = COMPANY_MAP.get(company_key)
    if not info:
        return {}

    raw_nodes = COMPANY_NODES.get(company_key, [])
    processed_nodes = []
    
    for node in raw_nodes:
        status = "Operational (Safe)"
        risk_factor = "None"
        
        # Check collision with danger zones
        for zone in DANGER_ZONES:
            dist = calculate_distance(node["lat"], node["lon"], zone["lat"], zone["lon"])
            if dist <= zone["radius_km"]:
                if dist <= (zone["radius_km"] * 0.5):
                    status = "CRITICAL RISK"
                else:
                    status = "Warning (Elevated Risk)"
                risk_factor = zone["name"]
                break
                
        processed_nodes.append({
            "name": node["name"],
            "lat": node["lat"],
            "lon": node["lon"],
            "type": node["type"],
            "status": status,
            "risk_factor": risk_factor
        })
        
    # Format danger zones for Plotly rendering
    render_zones = [{"name": z["name"], "lat": z["lat"], "lon": z["lon"], "radius": 15} for z in DANGER_ZONES]

    return {
        "company": info["name"],
        "nodes": processed_nodes,
        "danger_zones": render_zones
    }
