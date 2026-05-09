"""
Executive Briefing Room - Contextual Chat Engine.
A rule-based Natural Language Generator that acts like an LLM.
It parses current financial, risk, and sentiment context to answer user queries.
"""
from backend.data_generators.company_map import COMPANY_MAP
from backend.data_generators.financial import get_financials
from backend.data_generators.risk import get_risk_analytics
from backend.data_generators.ai_ensemble import get_ensemble_recommendation
import re

def generate_chat_response(query: str, company_key: str) -> str:
    """
    Parses the user's query and matches it against live data context 
    to generate a realistic, conversational analyst response.
    """
    query = query.lower()
    
    # Fetch all context required to answer questions
    info = COMPANY_MAP.get(company_key, {})
    company_name = info.get("name", "the company")
    
    if "risk" in query or "safe" in query or "danger" in query:
        risk_data = get_risk_analytics(company_key)
        score = risk_data.get("current_risk_score", 0)
        label = risk_data.get("risk_label", "Unknown")
        volatility = risk_data.get("volatility_pct", 0)
        
        if score > 70:
            return f"Right now, the ML Risk Engine is flagging {company_name} as **{label}** with a score of {score}/100. We are seeing elevated annualized volatility around {volatility}%, likely driven by recent macroeconomic shocks. I would advise strict capital preservation until this cools off."
        elif score < 40:
            return f"The risk profile for {company_name} is currently looking very stable. The engine scores it a **{label}** ({score}/100) with manageable volatility ({volatility}%). It's a relatively safe environment for deployment."
        else:
            return f"{company_name} is sitting in the **{label}** zone (Risk: {score}/100). The volatility is at {volatility}%. There are no immediate red flags, but I'd keep an eye on breaking news that could push it into the danger zone."

    elif "revenue" in query or "margin" in query or "financial" in query or "money" in query or "earnings" in query:
        fin_data = get_financials(company_key)
        kpis = fin_data.get("latest_kpis", {})
        rev = kpis.get("revenue_m") or 0
        margin = kpis.get("net_margin_pct") or 0
        growth = kpis.get("revenue_growth_pct") or 0
        
        if growth > 0:
            return f"Financially, {company_name} is showing solid momentum. They pulled in **${rev:,.0f}M** in revenue last quarter, which is a **+{growth}% growth** over the previous period. Their net margins are holding at {margin}%, indicating healthy operational efficiency."
        else:
            return f"The financials for {company_name} are showing some strain. They generated **${rev:,.0f}M** last quarter, but that represents a **{growth}% contraction**. With net margins at {margin}%, leadership needs to protect their bottom line."

    elif "invest" in query or "buy" in query or "sell" in query or "hold" in query or "recommend" in query:
        ai_data = get_ensemble_recommendation(company_key)
        consensus = ai_data.get("consensus", "HOLD")
        confidence = ai_data.get("confidence", 50)
        
        if consensus in ["STRONG BUY", "BUY"]:
            return f"The Multi-AI Ensemble is currently issuing a **{consensus}** directive with **{confidence}% confidence**. The fundamentals and risk models are heavily aligned. If you are looking for an entry point, the math supports moving now."
        elif consensus == "HOLD":
            return f"The Ensemble is suggesting a **HOLD** right now ({confidence}% confidence). The underlying models are sending mixed signals—either risk is slightly elevated or margins are flat. I recommend waiting for a clearer catalyst."
        else:
            return f"I strongly advise caution. The Ensemble directive is **{consensus}** with {confidence}% confidence. Our anomaly detection and sentiment models are picking up significant headwinds. It is not a safe time to allocate capital here."

    elif "news" in query or "sentiment" in query:
        risk_data = get_risk_analytics(company_key)
        nlp_score = risk_data.get("nlp_sentiment", {}).get("score", 0)
        
        if nlp_score > 0.2:
            return f"The market sentiment around {company_name} is overwhelmingly **Positive** right now based on our FinBERT analysis of recent headlines. The news cycle is working in their favor."
        elif nlp_score < -0.2:
            return f"Our NLP engine has detected highly **Negative** sentiment in the global news cycle regarding {company_name}. This pessimistic coverage is currently dragging down their overall AI scores."
        else:
            return f"The news sentiment for {company_name} is currently **Neutral**. The headlines aren't showing any extreme euphoria or panic, which usually means the stock will trade purely on its technicals."

    elif "stock" in query or "price" in query or "rate" in query or "market" in query or "today" in query:
        try:
            import yfinance as yf
            ticker = info.get("ticker", "")
            stock = yf.Ticker(ticker)
            todays_data = stock.history(period="1d")
            if not todays_data.empty:
                current_price = todays_data['Close'].iloc[0]
                prev_close = stock.fast_info.get("previousClose", current_price)
                pct_change = ((current_price - prev_close) / prev_close) * 100
                direction = "up" if pct_change >= 0 else "down"
                
                return f"The current live market price for {company_name} ({ticker}) is **${current_price:,.2f}**. It is {direction} {abs(pct_change):.2f}% today. The AI models are continuously analyzing this price action against historical volatility to update the Risk Score."
            else:
                return f"I am unable to pull the live stock rate for {company_name} at this exact moment. Please check the Financial Performance tab for historical closing data."
        except Exception as e:
            return f"I encountered an error fetching the live market data for {company_name}."

    elif "butterfly" in query or "cause" in query or "incident" in query or "chain" in query:
        return f"If you are looking at macro incidents, our **Butterfly Effect Engine** has mapped exactly how global supply chain disruptions or geopolitical events trickle down into {company_name}'s balance sheet. You can view the exact step-by-step causal chain in the 'Global Incidents' tab."

    elif "history" in query or "parallel" in query or "past" in query or "quantum" in query:
        return f"Traders often ask 'Has the market ever looked like this before?'. We built a **Quantum Timeline Matcher** that mathematically scans the last 5 years of {company_name}'s stock to find the single 30-day period that most closely matches today, and projects a Predictive Shadow. You can see this visual overlay in the 'Predictive History' tab."

    elif "supply" in query or "map" in query or "geography" in query or "location" in query:
        return f"To understand {company_name}'s geographic risk, we have built a **Supply Chain Heatmap**. It tracks their specific manufacturing hubs and revenue centers against active global threat zones. Check out the 'Supply Chain Heatmap' tab to view the interactive 3D globe."

    elif "insider" in query or "ceo" in query or "trade" in query or "exec" in query:
        return f"If you want to know what the executives are doing with their own money, the **Insider Trading Tracker** scrapes live SEC Form 4 filings to show you exactly how many shares the CEO and CFO of {company_name} are buying or dumping right now."

    elif "competitor" in query or "war" in query or "sector" in query or "compare" in query:
        return f"To see how {company_name} stacks up against its peers, head over to the **Sector War-Room**. You can run a side-by-side AI evaluation against any other company to see who dominates in Margins, Risk, and News Sentiment."

    elif "biggest risk" in query or "main risk" in query or "top risk" in query or ("biggest" in query and "risk" in query):
        risk_data = get_risk_analytics(company_key)
        score = risk_data.get("current_risk_score", 0)
        volatility = risk_data.get("volatility_pct", 0)
        nlp_score = risk_data.get("nlp_sentiment", {}).get("score", 0)
        sentiment_label = "negative" if nlp_score < -0.1 else "positive" if nlp_score > 0.1 else "neutral"
        
        return (
            f"The three biggest risk factors for {company_name} right now are:\n\n"
            f"1. **Market Volatility** — Annualised volatility is currently at **{volatility}%**, "
            f"which {('is elevated and suggests large price swings ahead.' if volatility > 30 else 'is within a manageable range.')} \n\n"
            f"2. **News & Sentiment Risk** — The NLP engine is reading a **{sentiment_label}** tone "
            f"across recent headlines, which directly impacts institutional confidence.\n\n"
            f"3. **Overall Risk Index** — The ML Risk Engine currently scores {company_name} at "
            f"**{score}/100**. {('This is in the danger zone. Capital preservation should be prioritised.' if score > 65 else 'This is within an acceptable range for a measured position.')}"
        )

    elif "full" in query or "summary" in query or "overview" in query or "brief me" in query:
        risk_data = get_risk_analytics(company_key)
        fin_data = get_financials(company_key)
        ai_data = get_ensemble_recommendation(company_key)
        
        risk_score = risk_data.get("current_risk_score", 0)
        risk_label = risk_data.get("risk_label", "Moderate")
        kpis = fin_data.get("latest_kpis", {})
        rev = kpis.get("revenue_m") or 0
        margin = kpis.get("net_margin_pct") or 0
        consensus = ai_data.get("consensus", "HOLD")
        confidence = ai_data.get("confidence", 50)
        
        return (
            f"Here is your full executive briefing on **{company_name}**:\n\n"
            f"**Recommendation:** The Multi-AI Ensemble is issuing a **{consensus}** directive "
            f"with **{confidence:.0f}% confidence**.\n\n"
            f"**Risk:** The ML Risk Engine scores this asset at **{risk_score}/100** "
            f"({risk_label}). Manage position sizing accordingly.\n\n"
            f"**Financials:** Revenue last quarter came in at **${rev:,.0f}M** with net "
            f"margins of **{margin:.1f}%**.\n\n"
            f"**Bottom Line:** {'The fundamentals and risk profile are aligned — this is a reasonable entry point for a long position.' if consensus in ['STRONG BUY', 'BUY'] else 'The models are sending mixed or negative signals. Hold off until the risk profile clears.'}"
        )

    else:
        return (
            f"I am not sure I caught that. I can help you with:\n\n"
            f"- **Stock price** — live market rate\n"
            f"- **Risk score** — current volatility and anomaly detection\n"
            f"- **Financials** — revenue, margins, and growth\n"
            f"- **Investment recommendation** — the AI consensus directive\n"
            f"- **News sentiment** — what the headlines are saying\n"
            f"- **Full summary** — a complete executive briefing\n\n"
            f"Try rephrasing your question or click one of the quick buttons above."
        )
