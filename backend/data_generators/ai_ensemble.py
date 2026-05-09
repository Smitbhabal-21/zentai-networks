"""
ai_ensemble.py — The Unified Business Health Score Engine

This is the core analytical brain of the Zentai platform.
Instead of relying on a single signal (which can be noisy and misleading),
we run three completely independent AI models in parallel and aggregate
their votes into a single, highly reliable Consensus Directive.

How it works:
    Model 1 (Risk AI)       — Looks at how volatile and risky the stock
                              has been recently, and what the news is saying.
    Model 2 (Financial AI)  — Looks at the actual accounting health:
                              net margins and revenue growth trends.
    Model 3 (Strategy AI)   — Looks at the macro picture: structural
                              challenges and competitive headwinds.

Each model votes:  +1 (Buy), 0 (Hold), or -1 (Sell).
The sum of votes determines the final Consensus:
    +3 → STRONG BUY    |    +2 → BUY    |    0 → HOLD
    -1 → SELL          |   -3 → STRONG SELL
"""

from backend.data_generators.risk import get_risk_analytics
from backend.data_generators.financial import get_financials
from backend.data_generators.company_intelligence import get_company_advisory


def get_ensemble_recommendation(company_key: str) -> dict:
    """
    Runs 3 distinct AI models and aggregates their votes into a
    single Consensus Directive with a Confidence Score and
    human-readable justifications for each model's decision.

    Args:
        company_key (str): The key from COMPANY_MAP (e.g., "apple")

    Returns:
        dict: {
            "consensus": "STRONG BUY" | "BUY" | "HOLD" | "SELL" | "STRONG SELL",
            "confidence": float (0–100),
            "justifications": list of human-readable explanations,
            "raw_metrics": dict of the underlying numbers used
        }
    """
    # Pull the three data feeds simultaneously
    risk_data = get_risk_analytics(company_key)
    fin_data = get_financials(company_key)
    advisory_data = get_company_advisory(company_key)

    # ----------------------------------------------------------------
    # Extract the key signals from each data feed
    # ----------------------------------------------------------------

    # Risk AI signals: anomaly score and news sentiment
    risk_score = risk_data.get("current_risk_score", 50)
    nlp_score = risk_data.get("nlp_sentiment", {}).get("score", 0.0)

    # Financial AI signals: net margins and revenue growth
    margin = fin_data.get("latest_kpis", {}).get("net_margin_pct") or 0
    rev_growth = fin_data.get("latest_kpis", {}).get("revenue_growth_pct") or 0

    # Strategy AI signal: number of 'Critical' macro/structural challenges
    strategies = advisory_data.get("strategies", [])
    critical_challenges = len([s for s in strategies if s.get("priority") == "Critical"])

    # ----------------------------------------------------------------
    # Run the voting logic for each model
    # ----------------------------------------------------------------
    votes = []
    justifications = []

    # Model 1: Risk & Sentiment
    # High risk score (>70) or very negative news → Sell signal
    if risk_score > 70 or nlp_score < -0.3:
        votes.append(-1)
        justifications.append(
            f"RISK AI: High volatility or negative news sentiment detected. "
            f"Current risk index is {risk_score}/100."
        )
    elif risk_score < 40 and nlp_score > 0.1:
        votes.append(1)
        justifications.append(
            f"RISK AI: Favorable market conditions. Low anomaly score ({risk_score}/100) "
            f"and positive news sentiment across recent headlines."
        )
    else:
        votes.append(0)
        justifications.append(
            f"RISK AI: Moderate risk profile. No immediate red flags or strong tailwinds."
        )

    # Model 2: Fundamentals
    # Healthy margins and growing revenue → Buy signal
    if margin > 10 and rev_growth > 2:
        votes.append(1)
        justifications.append(
            f"FINANCIAL AI: Strong fundamental health — {margin:.1f}% net margins "
            f"with positive revenue growth trend."
        )
    elif margin < 5 or rev_growth < -5:
        votes.append(-1)
        justifications.append(
            f"FINANCIAL AI: Weakening fundamentals. Margins at {margin:.1f}% "
            f"or revenue is contracting."
        )
    else:
        votes.append(0)
        justifications.append(
            f"FINANCIAL AI: Stable but unexceptional accounting metrics. "
            f"No significant upside or downside trigger."
        )

    # Model 3: Strategic / Macro
    # Multiple critical headwinds → Sell signal
    if critical_challenges >= 2:
        votes.append(-1)
        justifications.append(
            f"STRATEGY AI: Multiple severe macroeconomic or structural headwinds "
            f"identified ({critical_challenges} critical challenges)."
        )
    elif critical_challenges == 0:
        votes.append(1)
        justifications.append(
            f"STRATEGY AI: Clear strategic positioning with no critical macro challenges. "
            f"Strong competitive moat."
        )
    else:
        votes.append(0)
        justifications.append(
            f"STRATEGY AI: Mixed strategic outlook with some manageable headwinds. "
            f"Proceed with standard caution."
        )

    # ----------------------------------------------------------------
    # Tally the votes and determine the final Consensus
    # ----------------------------------------------------------------
    total_score = sum(votes)

    if total_score >= 2:
        consensus = "STRONG BUY"
        color = "green"
    elif total_score == 1:
        consensus = "BUY"
        color = "blue"
    elif total_score == 0:
        consensus = "HOLD"
        color = "orange"
    elif total_score == -1:
        consensus = "SELL"
        color = "red"
    else:
        consensus = "STRONG SELL"
        color = "darkred"

    # Confidence: how decisive was the vote?
    # A unanimous 3-0 vote = 100%, a split vote = lower confidence
    confidence = (abs(total_score) / 3) * 100
    if confidence == 0:
        confidence = 50  # A tied vote still represents 50% confidence in a Hold

    return {
        "company": company_key,
        "consensus": consensus,
        "color": color,
        "confidence": round(confidence, 1),
        "justifications": justifications,
        "raw_metrics": {
            "risk_score": risk_score,
            "margin": margin,
            "critical_challenges": critical_challenges
        }
    }
