"""Timestamped company headlines. Optional FinBERT reports unavailable explicitly."""
import os
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime
import yfinance as yf

def fetch_google_news(query, limit=8):
    try:
        q = urllib.parse.quote(f'"{query}" stock when:7d')
        url = f'https://news.google.com/rss/search?q={q}&hl=en-US&gl=US&ceid=US:en'
        with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent':'ZentaiNetworks/2.0'}), timeout=10) as response:
            root = ET.fromstring(response.read())
        articles=[]
        for item in root.findall('.//item'):
            title, link, date = item.findtext('title'), item.findtext('link'), item.findtext('pubDate')
            if not title or not link or not date: continue
            published = parsedate_to_datetime(date)
            if published < datetime.now(timezone.utc)-timedelta(days=7): continue
            if urllib.parse.urlparse(link).scheme not in ('http','https'): continue
            articles.append({'title':title, 'link':link, 'publisher':item.findtext('source') or 'Google News', 'published_at':published.isoformat()})
        unique={a['title'].lower():a for a in articles}
        return sorted(unique.values(), key=lambda a:a['published_at'], reverse=True)[:limit]
    except Exception:
        return []

def fetch_company_news(ticker, company_name='', limit=8):
    return fetch_google_news(company_name or ticker, limit)

def calculate_nlp_sentiment(ticker, company_name=''):
    unavailable={'score':None, 'label':'unavailable', 'headlines_analyzed':0, 'negative_count':None, 'status':'unavailable'}
    if os.environ.get('ENABLE_FINBERT') != '1': return unavailable
    try:
        from transformers import pipeline
        headlines=[a['title'] for a in fetch_company_news(ticker,company_name)]
        if not headlines: return unavailable
        results=pipeline('sentiment-analysis',model='ProsusAI/finbert')(headlines, truncation=True)
        values=[r['score']*(1 if r['label'].lower()=='positive' else -1 if r['label'].lower()=='negative' else 0) for r in results]
        score=sum(values)/len(values)
        return {'score':score,'label':'positive' if score>0.2 else 'negative' if score < -0.2 else 'neutral', 'headlines_analyzed':len(values),'negative_count':sum(v<0 for v in values),'status':'available'}
    except Exception:
        return unavailable
