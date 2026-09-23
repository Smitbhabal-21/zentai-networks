"""Deterministic briefing grounded in available observations, with explicit gaps."""
from backend.data_generators.company_map import COMPANY_MAP
from backend.data_generators.financial import get_financials
from backend.data_generators.risk import get_risk_analytics
from backend.data_generators.stock import get_stock_history
from backend.data_generators.nlp_sentiment import fetch_company_news

def generate_chat_response(query, company_key):
    info=COMPANY_MAP.get(company_key)
    if not info: return 'Company unavailable.'
    query=query.lower()
    if any(word in query for word in ('news','sentiment')):
        news=fetch_company_news(info['ticker'],info['name'],5)
        return '\n\n'.join(f"- [{n['title']}]({n['link']}) — {n['publisher']}, {n['published_at']}" for n in news) if news else 'Timestamped news is currently unavailable. No sentiment conclusion is available.'
    if any(word in query for word in ('buy','sell','invest','recommend')):
        return 'This terminal provides descriptive research, not calibrated buy/sell predictions. Review reported financials, risk metrics, and valuation assumptions in their respective sections.'
    if any(word in query for word in ('risk','safe','volatility')):
        d=get_risk_analytics(company_key)
        if d.get('error'): return 'Risk observations are unavailable; no assessment can be made.'
        return f"As of {d.get('as_of')}, the relative anomaly score is {d['current_risk_score']}/100 and annualized volatility is {d['volatility_pct']}%. This score is not a probability of loss."
    if any(word in query for word in ('price','stock','today')):
        d=get_stock_history(company_key)
        if d.get('error'): return 'Price history is unavailable.'
        return f"The latest reported daily close is ${d['current_price']:.2f}, dated {d['candles'][-1]['date']}. Daily change: {d['price_change_pct']}%. This is a historical closing observation, not a streaming quote."
    if any(word in query for word in ('financial','margin','revenue','summary')):
        d=get_financials(company_key); k=d.get('latest_kpis',{})
        if k.get('revenue_m') is None: return 'Financial statements are currently unavailable.'
        return f"Reported period: {d.get('as_of')}. Revenue: ${k['revenue_m']:,.1f}M. Net margin: {k.get('net_margin_pct') if k.get('net_margin_pct') is not None else 'unavailable'}. Quarter-over-quarter growth: {k.get('revenue_growth_pct') if k.get('revenue_growth_pct') is not None else 'unavailable'}. Percentage metrics are reported in percent."
    return 'I can summarize reported prices, financials, risk, and recent news. Geographic references and historical patterns are exploratory; they do not establish current incidents or future outcomes.'
