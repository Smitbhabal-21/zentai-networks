# Zentai Networks BI Terminal (Streamlit Edition)

A fully integrated, real-time enterprise Business Intelligence dashboard built natively for Streamlit. It features a Multi-AI Ensemble Engine that aggregates NLP Sentiment, Machine Learning Risk Models, and Fundamental Heuristics to output definitive investment directives.

## 🚀 How to Deploy Live (Free & Zero Config)

This application is strictly designed to be "host-level ready" for Streamlit Community Cloud.

### Step 1: Push to GitHub
Ensure this entire repository (including `backend/requirements.txt` and `streamlit_app.py`) is pushed to a public or private GitHub repository.

### Step 2: Deploy to Streamlit Cloud
1. Go to [share.streamlit.io](https://share.streamlit.io/) and sign in with your GitHub account.
2. Click **"New app"**.
3. Select your GitHub repository.
4. Set the **Main file path** to `streamlit_app.py`.
5. Click **Deploy**.

*Streamlit will automatically read the `requirements.txt`, install all ML dependencies (including PyTorch and transformers), apply the custom theme from `.streamlit/config.toml`, and host the application securely on a live URL.*

## 🧠 The Multi-AI Ensemble
The application does not rely on a single data point. It leverages a consensus algorithm:
- **FinBERT NLP:** Scrapes live Yahoo Finance news and runs it through a HuggingFace transformer to gauge market sentiment.
- **Isolation Forest ML:** Analyzes rolling volatility and price drawdowns to detect severe statistical anomalies and output a 0-100 risk score.
- **Fundamental Heuristics:** Evaluates quarterly revenue growth and EBITDA margins.

## 💻 Local Development
If you wish to run the app locally before deploying:
```bash
pip install -r backend/requirements.txt
streamlit run streamlit_app.py
```
