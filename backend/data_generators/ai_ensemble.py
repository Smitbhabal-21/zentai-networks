"""Transparent heuristic signals. Agreement is not predictive confidence."""
from backend.data_generators.risk import get_risk_analytics
from backend.data_generators.financial import get_financials

def get_ensemble_recommendation(company_key):
    risk=get_risk_analytics(company_key)
    financials=get_financials(company_key)
    kpis=financials.get('latest_kpis',{})
    score=risk.get('current_risk_score')
    margin,growth=kpis.get('net_margin_pct'),kpis.get('revenue_growth_pct')
    if any(v is None for v in (score,margin,growth)):
        return {'consensus':'INSUFFICIENT DATA','confidence':None,'agreement_pct':None,'justifications':['Required observations are unavailable; no signal generated.'],'raw_metrics':{}}
    votes=[-1 if score>70 else 1 if score<40 else 0,
           1 if margin>10 and growth>2 else -1 if margin<5 or growth < -5 else 0]
    sentiment=risk.get('nlp_sentiment',{}).get('score')
    if sentiment is not None: votes.append(1 if sentiment>0.2 else -1 if sentiment < -0.2 else 0)
    total=sum(votes)
    consensus='FAVORABLE' if total>0 else 'CAUTIOUS' if total<0 else 'MIXED'
    return {'consensus':consensus,'confidence':None,'agreement_pct':round(max(votes.count(v) for v in set(votes))/len(votes)*100,1),
            'justifications':[f'Relative anomaly score: {score}/100.',f'Net margin: {margin}%; quarter-over-quarter revenue growth: {growth}%.', 'Sentiment unavailable.' if sentiment is None else f'Headline sentiment score: {sentiment:.2f}.'],
            'raw_metrics':{'risk_score':score,'margin':margin,'revenue_growth_pct':growth},
            'methodology':'Threshold-based descriptive signals, not calibrated forecasts or buy/sell instructions.'}
