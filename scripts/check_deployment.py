"""Smoke-check a deployed public site. Does not change remote state."""
import sys
import json
import ssl
import certifi
from urllib.request import urlopen
from urllib.error import HTTPError
from concurrent.futures import ThreadPoolExecutor
base=sys.argv[1].rstrip('/')
paths=['/','/api/market?symbols=AAPL,SPY&range=3mo','/api/news?symbol=AAPL','/api/analytics?section=financials&company=apple','/api/analytics?section=risk&company=apple','/api/analytics?section=portfolio','/api/analytics?section=backtest&company=apple','/api/analytics?section=history&company=apple','/api/analytics?section=options&company=apple','/api/analytics?section=insiders&company=apple','/api/analytics?section=valuation&company=apple']
def check(path):
    try:
        with urlopen(base+path,timeout=65,context=ssl.create_default_context(cafile=certifi.where())) as r:
            body=r.read()
            if path=='/': return {'path':path,'status':r.status,'dashboard':'Zentai' in body.decode()}
            d=json.loads(body)
            return {'path':path,'status':r.status,'error':d.get('error'),'quote_count':len(d['quotes']) if 'quotes' in d else None,'articles':len(d['articles']) if 'articles' in d else None,'as_of':d.get('as_of')}
    except HTTPError as e:
        return {'path':path,'status':e.code,'body':e.read().decode()[:180]}
    except Exception as e:return {'path':path,'error':str(e)}
with ThreadPoolExecutor(max_workers=3) as pool:
    for r in pool.map(check,paths):print(json.dumps(r),flush=True)
