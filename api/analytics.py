"""Read-only, validated Python analytics endpoint for Vercel and local development."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse
from datetime import datetime, timezone
import json
import math
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from backend.data_generators.company_map import COMPANY_MAP


def clean(value):
    if isinstance(value, dict): return {str(k):clean(v) for k,v in value.items()}
    if isinstance(value, (list,tuple)): return [clean(v) for v in value]
    if hasattr(value,'item'): return clean(value.item())
    if isinstance(value,float) and not math.isfinite(value): return None
    return value


def execute(params):
    company=params.get('company','apple')
    if company not in COMPANY_MAP: raise ValueError('Unsupported company.')
    ticker=COMPANY_MAP[company]['ticker']
    section=params.get('section','financials')
    if section=='financials':
        from backend.data_generators.financial import get_financials
        result=get_financials(company)
        if not result.get('quarterly'): result={'error':'Financial statements are unavailable from the provider.'}
    elif section=='risk':
        from backend.data_generators.risk import get_risk_analytics
        result=get_risk_analytics(company)
    elif section=='valuation':
        from backend.data_generators.dcf_engine import get_intrinsic_value
        result=get_intrinsic_value(ticker)
    elif section=='options':
        from backend.data_generators.options_flow import get_options_flow
        result=get_options_flow(ticker)
    elif section=='insiders':
        from backend.data_generators.insider import get_insider_trading
        result=get_insider_trading(company)
    elif section=='geography':
        from backend.data_generators.geospatial import get_geospatial_exposure
        result=get_geospatial_exposure(company)
    elif section=='history':
        from backend.data_generators.historical_parallel import get_historical_parallel
        result=get_historical_parallel(company)
    elif section=='backtest':
        from backend.data_generators.backtester import run_backtest
        strategy=params.get('strategy','SMA Crossover'); period=params.get('period','5y')
        if strategy not in ('SMA Crossover','RSI Mean Reversion','MACD Momentum') or period not in ('1y','2y','5y','10y'): raise ValueError('Unsupported strategy or period.')
        cost=float(params.get('cost','10'))
        if not math.isfinite(cost) or not 0<=cost<=100: raise ValueError('Cost must be 0–100 basis points.')
        result=run_backtest(ticker,strategy,period,cost)
    elif section=='portfolio':
        from backend.data_generators.portfolio_optimizer import optimize_portfolio
        capital=float(params.get('capital','10000'))
        if not math.isfinite(capital) or not 100<=capital<=1e9: raise ValueError('Capital must be between 100 and 1 billion.')
        symbols=list(dict.fromkeys(params.get('symbols',','.join(v['ticker'] for v in COMPANY_MAP.values())).split(',')))
        if not 2<=len(symbols)<=10 or any(t not in {v['ticker'] for v in COMPANY_MAP.values()} for t in symbols): raise ValueError('Select between 2 and 10 supported assets.')
        result=optimize_portfolio(symbols,investment_amount=capital)
    else: raise ValueError('Unsupported analytics section.')
    result['fetched_at']=datetime.now(timezone.utc).isoformat()
    return clean(result)


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            params={k:v[0] for k,v in parse_qs(urlparse(self.path).query).items()}
            result=execute(params)
            status=503 if result.get('error') else 200
        except (ValueError,TypeError):
            result={'error':'Invalid analytics request.'};status=400
        except Exception as error:
            print('Analytics failure:',type(error).__name__)
            result={'error':'Analytics are temporarily unavailable. Please retry.'};status=503
        self.send_response(status)
        self.send_header('Content-Type','application/json')
        self.send_header('Cache-Control','public, s-maxage=300, stale-while-revalidate=60' if status==200 else 'no-store')
        self.end_headers()
        self.wfile.write(json.dumps(result,allow_nan=False).encode())

if __name__=='__main__':
    ThreadingHTTPServer(('127.0.0.1',5328),handler).serve_forever()
