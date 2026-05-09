"""
NLP Sentiment Analysis Engine.
Fetches live global news via Yahoo Finance and runs unstructured text 
through a HuggingFace transformer (FinBERT) to generate sentiment scores.
"""
import logging
import yfinance as yf

# Suppress HuggingFace/Torch verbose logging
logging.getLogger("transformers").setLevel(logging.ERROR)

# Lazy loading for heavy ML models to avoid blocking imports
_sentiment_pipeline = None

def get_sentiment_pipeline():
    global _sentiment_pipeline
    if _sentiment_pipeline is None:
        try:
            from transformers import pipeline
            # Using a pre-trained FinBERT model for financial news
            _sentiment_pipeline = pipeline("sentiment-analysis", model="ProsusAI/finbert")
        except Exception as e:
            print(f"Warning: Failed to load NLP pipeline: {e}")
            _sentiment_pipeline = "fallback"
    return _sentiment_pipeline

import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET

def fetch_google_news(query: str, limit: int = 5) -> list:
    """Fallback: Fetch recent news using Google News RSS without API keys."""
    try:
        encoded_query = urllib.parse.quote(f"{query} stock financial news")
        url = f"https://news.google.com/rss/search?q={encoded_query}&hl=en-US&gl=US&ceid=US:en"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            xml_data = response.read()
            
        root = ET.fromstring(xml_data)
        articles = []
        for item in root.findall('.//item')[:limit]:
            title = item.find('title').text if item.find('title') is not None else ''
            link = item.find('link').text if item.find('link') is not None else ''
            source = item.find('source').text if item.find('source') is not None else 'Google News'
            
            # Clean up the title (Google appends ' - Source' at the end)
            if " - " in title:
                title = title.rsplit(" - ", 1)[0]
                
            if title:
                articles.append({
                    "title": title,
                    "link": link,
                    "publisher": source
                })
        return articles
    except Exception as e:
        print(f"Error fetching Google News: {e}")
        return []

def fetch_company_news(ticker: str, company_name: str = "", limit: int = 8) -> list:
    """Fetch recent news headlines and links. Tries Yahoo Finance, falls back to Google News."""
    articles = []
    
    # Attempt 1: Yahoo Finance
    try:
        stock = yf.Ticker(ticker)
        news_data = stock.news
        if news_data:
            for item in news_data[:limit]:
                title = item.get('title', '')
                link = item.get('link', '')
                publisher = item.get('publisher', 'Yahoo Finance')
                
                if title:
                    articles.append({
                        "title": title,
                        "link": link,
                        "publisher": publisher
                    })
    except Exception as e:
        print(f"Error fetching YF news for {ticker}: {e}")
        
    # Attempt 2: If YF is empty, or we want a combined feed, pull from Google News
    if len(articles) < 3:
        query = company_name if company_name else ticker
        google_articles = fetch_google_news(query, limit=limit - len(articles))
        articles.extend(google_articles)
        
    return articles

def calculate_nlp_sentiment(ticker: str, company_name: str = "") -> dict:
    """
    Scrapes recent news and runs it through FinBERT.
    Returns an aggregated sentiment score (-1 to 1).
    """
    articles = fetch_company_news(ticker, company_name)
    headlines = [a["title"] for a in articles]
    if not headlines:
        return {
            "score": 0.0,
            "label": "neutral",
            "headlines_analyzed": 0,
            "negative_count": 0
        }
        
    pipeline = get_sentiment_pipeline()
    
    if pipeline == "fallback":
        # Fallback if transformers fails to load
        return {"score": 0.0, "label": "neutral", "headlines_analyzed": len(headlines), "negative_count": 0}

    total_score = 0.0
    neg_count = 0
    
    try:
        results = pipeline(headlines)
        
        for res in results:
            label = res['label'].lower() # positive, negative, neutral
            score = res['score'] # Confidence score
            
            if label == 'positive':
                total_score += score
            elif label == 'negative':
                total_score -= score
                neg_count += 1
            # Neutral adds 0
            
        avg_score = total_score / len(headlines)
        
        # Determine aggregate label
        if avg_score > 0.2:
            agg_label = "positive"
        elif avg_score < -0.2:
            agg_label = "negative"
        else:
            agg_label = "neutral"
            
        return {
            "score": avg_score,
            "label": agg_label,
            "headlines_analyzed": len(headlines),
            "negative_count": neg_count
        }
        
    except Exception as e:
        print(f"NLP processing error for {ticker}: {e}")
        return {"score": 0.0, "label": "neutral", "headlines_analyzed": 0, "negative_count": 0}
