import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
import yfinance as yf

# Import Data Generators
from backend.data_generators.ai_ensemble import get_ensemble_recommendation
from backend.data_generators.geospatial import get_geospatial_exposure
from backend.data_generators.butterfly_effect import generate_butterfly_effect
from backend.data_generators.historical_parallel import get_historical_parallel
from backend.data_generators.insider import get_insider_trading
from backend.data_generators.nlp_sentiment import fetch_company_news
from backend.data_generators.risk import get_risk_analytics
from backend.data_generators.chat_engine import generate_chat_response
from backend.data_generators.financial import get_financials
from backend.data_generators.backtester import run_backtest
from backend.data_generators.dcf_engine import get_intrinsic_value
from backend.data_generators.portfolio_optimizer import optimize_portfolio
from backend.data_generators.macro_radar import get_macro_data
from backend.data_generators.options_flow import get_options_flow
from backend.data_generators.company_map import COMPANY_MAP
from backend.presentation_slides import SLIDES


st.set_page_config(
    page_title="Zentai Networks",
    page_icon="",
    layout="wide",
    initial_sidebar_state="expanded"
)



# Custom CSS for Premium Cyberpunk Aesthetic & Animations
st.markdown('''
<style>
    /* Global Animations & Smooth Scroll */
    html {
        scroll-behavior: smooth;
    }
    


    @keyframes popIn {
        0% { opacity: 0; transform: scale(0.95) translateY(10px); }
        100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    div[data-testid="metric-container"], .ensemble-card, .news-card {
        animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }

    /* Metric styling */
    div[data-testid="stMetricValue"] {
        font-family: 'Courier New', Courier, monospace;
        font-weight: 900;
        color: #00E5FF;
        text-shadow: 0 0 10px rgba(0, 229, 255, 0.3);
    }
    
    /* Advanced Navigation Sidebar Styling */
    div.row-widget.stRadio > div {
        gap: 12px;
    }
    div.row-widget.stRadio > div > label {
        padding: 15px 20px;
        background: rgba(0, 229, 255, 0.03);
        border-radius: 12px;
        margin-bottom: 5px;
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        border: 1px solid rgba(255, 255, 255, 0.05);
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    div.row-widget.stRadio > div > label:hover {
        background: rgba(0, 229, 255, 0.1);
        transform: translateX(10px) scale(1.02);
        border: 1px solid #00E5FF;
        box-shadow: 0 10px 25px rgba(0, 229, 255, 0.2);
    }
    
    /* Card Hover Animations */
    .ensemble-card {
        padding: 20px;
        border-radius: 10px;
        margin-bottom: 20px;
        border: 1px solid var(--primary-color);
        background-color: var(--secondary-background-color);
        transition: all 0.3s ease;
    }
    .ensemble-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 10px 20px rgba(0, 229, 255, 0.1);
        border-color: rgba(0, 229, 255, 0.5);
    }
    
    .news-card {
        padding: 15px;
        border-left: 4px solid #8B5CF6; /* Neon Purple */
        background-color: var(--secondary-background-color);
        margin-bottom: 15px;
        border-radius: 0 5px 5px 0;
        transition: all 0.3s ease;
    }
    .news-card:hover {
        transform: translateX(8px);
        background-color: var(--secondary-background-color);
        box-shadow: -2px 5px 15px rgba(139, 92, 246, 0.2);
    }
    .news-card a {
        color: var(--text-color);
        text-decoration: none;
        font-weight: bold;
        font-size: 1.1em;
        transition: color 0.2s ease;
    }
    .news-card a:hover {
        color: #8B5CF6;
    }
    
    .incident-card {
        padding: 15px;
        border-left: 4px solid #ef4444;
        background-color: var(--secondary-background-color);
        margin-bottom: 10px;
        border-radius: 0 5px 5px 0;
        transition: all 0.3s ease;
    }
    .incident-card:hover {
        transform: translateX(5px) scale(1.01);
    }
    
    .strong-buy { border-left: 5px solid #00E5FF; }
    .buy { border-left: 5px solid #38bdf8; }
    .hold { border-left: 5px solid #8B5CF6; }
    .sell { border-left: 5px solid #f87171; }
    .strong-sell { border-left: 5px solid #ef4444; }
    
    h1, h2, h3 {
        font-family: 'Helvetica Neue', sans-serif;
        letter-spacing: -0.5px;
    }
</style>
''', unsafe_allow_html=True)

# ----------------- BOOTUP LOCKSCREEN -----------------
if "authenticated" not in st.session_state:
    st.session_state.authenticated = False

if not st.session_state.authenticated:
    st.markdown('''
    <style>
        .stButton>button {
            border: 2px solid #00E5FF;
            color: #00E5FF;
            font-size: 20px;
            font-weight: bold;
            letter-spacing: 2px;
            padding: 15px;
            border-radius: 50px;
            transition: all 0.4s ease;
            background: transparent;
        }
        .stButton>button:hover {
            background-color: #00E5FF;
            color: var(--background-color);
            box-shadow: 0 10px 30px rgba(0, 229, 255, 0.4);
            transform: translateY(-10px);
        }
    </style>
    ''', unsafe_allow_html=True)
    
    st.markdown("<br><br><br><br><br>", unsafe_allow_html=True)
    st.markdown("<h1 style='text-align: center; color: #00E5FF; font-size: 80px; letter-spacing: 15px; margin-bottom: 0; text-shadow: 0 0 20px rgba(0,229,255,0.5);'>ZENTAI</h1>", unsafe_allow_html=True)
    st.markdown("<h3 style='text-align: center; color: #8B5CF6; letter-spacing: 8px; margin-top: -10px;'>ENTERPRISE INTELLIGENCE</h3>", unsafe_allow_html=True)
    st.markdown("<br><br><br>", unsafe_allow_html=True)
    
    c1, c2, c3 = st.columns([1, 1.5, 1])
    with c2:
        if st.button("↑ SWIPE UP TO INITIALIZE ↑", use_container_width=True):
            st.session_state.authenticated = True
            st.rerun()
            
    st.stop()

# ----------------- SIDEBAR -----------------
with st.sidebar:
    st.markdown("## ZENTAI NETWORKS")
    st.markdown("*Predict. Position. Profit.*")
    st.divider()
    
    company_options = {info["name"]: key for key, info in COMPANY_MAP.items()}
    selected_name = st.selectbox("Select Portfolio Entity", list(company_options.keys()))
    selected_key = company_options[selected_name]
    
    st.divider()
    module = st.radio("Navigation Menu", [
        "Executive Briefing Room",
        "Portfolio Optimization & Macro",
        "AI Investment & Risk Directive",
        "Algorithmic Backtester",
        "Global Operations & Causal History",
        "Market Intelligence & Insiders",
        "Sector War-Room",
        "Capstone Presentation"
    ])

# ----------------- MAIN CONTENT -----------------
if module not in ["Portfolio Optimization & Macro", "Capstone Presentation"]:
    st.header(f"{selected_name} ({COMPANY_MAP[selected_key]['ticker']})")

if module == "Executive Briefing Room":
    st.subheader("Executive Briefing Room")
    st.markdown("Ask the AI analyst about the current risk, financials, or sentiment.")
    
    if "current_company" not in st.session_state or st.session_state.current_company != selected_key:
        st.session_state.current_company = selected_key
        st.session_state.messages = [
            {"role": "assistant", "content": f"Hello. I am the AI Analyst for **{selected_name}**. How can I help you today?"}
        ]

    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

    st.markdown("<br><b>Quick Questions — click any to ask:</b>", unsafe_allow_html=True)

    # Row 1: Core financials & risk
    r1c1, r1c2, r1c3 = st.columns(3)
    if r1c1.button(f"What is the current risk score?", key="q1"):
        st.session_state.queued_prompt = f"What is the current risk for {selected_name}?"
    if r1c2.button("Are their financials healthy?", key="q2"):
        st.session_state.queued_prompt = "Are their financials healthy right now?"
    if r1c3.button("What is the stock price today?", key="q3"):
        st.session_state.queued_prompt = "What is the stock price today?"

    # Row 2: Investment decisions
    r2c1, r2c2, r2c3 = st.columns(3)
    if r2c1.button("Should I buy this stock?", key="q4"):
        st.session_state.queued_prompt = "Should I buy this stock?"
    if r2c2.button("What does the news sentiment say?", key="q5"):
        st.session_state.queued_prompt = "What does the news sentiment say?"
    if r2c3.button("What is the revenue and margin?", key="q6"):
        st.session_state.queued_prompt = "What is the revenue and margin?"

    # Row 3: Advanced analysis
    r3c1, r3c2, r3c3 = st.columns(3)
    if r3c1.button("Where are their global operations?", key="q7"):
        st.session_state.queued_prompt = "Where are their global operations and supply chain?"
    if r3c2.button("How do they compare to competitors?", key="q8"):
        st.session_state.queued_prompt = "How do they compare to competitors in the sector?"
    if r3c3.button("Has the market looked like this before?", key="q9"):
        st.session_state.queued_prompt = "Has the market looked like this before historically?"

    # Row 4: Deep dives
    r4c1, r4c2, r4c3 = st.columns(3)
    if r4c1.button("Are insiders buying or selling?", key="q10"):
        st.session_state.queued_prompt = "Are insiders buying or selling?"
    if r4c2.button("What are the biggest risks right now?", key="q11"):
        st.session_state.queued_prompt = "What are the biggest risks right now?"
    if r4c3.button("Give me the full investment summary.", key="q12"):
        st.session_state.queued_prompt = "Give me the full investment summary for this company."

    prompt = st.chat_input(f"Ask about {selected_name}'s risk or financials...")
    if "queued_prompt" in st.session_state:
        prompt = st.session_state.queued_prompt
        del st.session_state.queued_prompt

    if prompt:
        st.chat_message("user").markdown(prompt)
        st.session_state.messages.append({"role": "user", "content": prompt})

        with st.spinner("Synthesizing live data..."):
            response = generate_chat_response(prompt, selected_key)
            
        with st.chat_message("assistant"):
            st.markdown(response)
        st.session_state.messages.append({"role": "assistant", "content": response})
        st.rerun()

elif module == "Portfolio Optimization & Macro":
    st.header("Portfolio Optimization & Macro Market Radar")
    
    st.subheader("Markowitz Efficient Frontier")
    st.markdown("Simulating Modern Portfolio Theory to find the mathematically optimal asset weights for maximum return and minimum volatility.")
    
    capital = st.number_input("Total Investment Capital ($)", min_value=100.0, value=10000.0, step=1000.0, format="%.2f")
    
    with st.spinner("Calculating Covariance Matrices across all 10 entities..."):
        tickers = [v['ticker'] for v in COMPANY_MAP.values()]
        opt_data = optimize_portfolio(tickers, investment_amount=capital)
        
    if "error" not in opt_data:
        m1, m2, m3 = st.columns(3)
        m1.metric("Expected Annual Return", f"{opt_data['expected_annual_return_pct']}%")
        m2.metric("Portfolio Volatility", f"{opt_data['annual_volatility_pct']}%")
        m3.metric("Sharpe Ratio", opt_data['sharpe_ratio'])
        
        c1, c2 = st.columns([1, 1])
        with c1:
            # Donut Chart for Allocation
            labels = list(opt_data['optimal_weights'].keys())
            values = list(opt_data['dollar_allocations'].values())
            
            fig = go.Figure(data=[go.Pie(labels=labels, values=values, hole=.4, textinfo='label+value', texttemplate="$%{value:,.2f}", marker=dict(colors=px.colors.sequential.Tealgrn))])
            fig.update_layout(title_text="Optimal Capital Distribution", paper_bgcolor="rgba(0,0,0,0)", font_color="var(--text-color)", margin=dict(t=50, b=0, l=0, r=0))
            st.plotly_chart(fig, use_container_width=True)
            
        with c2:
            st.markdown("<br><br>", unsafe_allow_html=True)
            # Create a clean dataframe for execution
            df_alloc = pd.DataFrame({
                "Ticker": list(opt_data['dollar_allocations'].keys()),
                "Target Weight": [f"{w}%" for w in opt_data['optimal_weights'].values()],
                "Capital to Invest": [f"${d:,.2f}" for d in opt_data['dollar_allocations'].values()]
            })
            st.dataframe(df_alloc, use_container_width=True, hide_index=True)
        
    st.divider()
    
    st.subheader("Macro-Economic Radar")
    st.markdown("Contextualize the portfolio against broader market headwinds.")
    with st.spinner("Scanning global macro indicators..."):
        macro = get_macro_data()
        
    if "error" not in macro:
        c1, c2, c3 = st.columns(3)
        c1.metric("S&P 500 (SPY)", f"${macro['spy']['value']}", f"{macro['spy']['change_pct']}%")
        c2.metric("Market Fear Index (VIX)", macro['vix']['value'], f"{macro['vix']['change_pct']}%", delta_color="inverse")
        c3.metric("10-Yr Treasury Yield", f"{macro['treasury_10y']['value']}%", f"{macro['treasury_10y']['change_pct']}%")
        
        color = "#00E5FF" if "Greed" in macro['market_state'] else "#ef4444" if "Fear" in macro['market_state'] else "#888"
        st.markdown(f"<div style='text-align: center; padding: 20px; border: 1px solid {color}; border-radius: 10px; background: var(--secondary-background-color);'><h3 style='margin:0; color:{color};'>SYSTEM STATE: {macro['market_state']}</h3></div>", unsafe_allow_html=True)

elif module == "AI Investment & Risk Directive":
    st.subheader("Multi-AI Consensus Directive")
    with st.spinner("Running ensemble models..."):
        ai_data = get_ensemble_recommendation(selected_key)
        
    consensus = ai_data["consensus"]
    confidence = ai_data["confidence"]
    color_class = consensus.lower().replace(" ", "-")
    
    st.markdown(f'''
    <div class="ensemble-card {color_class}">
        <h2 style="margin:0;">{consensus}</h2>
        <p style="margin:0; opacity:0.8;">Confidence Level: {confidence}%</p>
        <hr style="opacity:0.2;">
        <p><b>AI Reasoning:</b> {"<br>".join(ai_data.get('justifications', []))}</p>
    </div>
    ''', unsafe_allow_html=True)
    
    st.divider()
    st.subheader("Intrinsic Valuation (DCF Engine)")
    st.markdown("Calculates the true mathematical value of the company based on projected cash flows.")
    with st.spinner("Calculating Discounted Cash Flows..."):
        ticker = COMPANY_MAP[selected_key]['ticker']
        dcf = get_intrinsic_value(ticker)
        
    if "error" not in dcf:
        d1, d2, d3 = st.columns(3)
        d1.metric("Current Market Price", f"${dcf['current_price']}")
        d2.metric("Calculated Intrinsic Value", f"${dcf['intrinsic_value']}")
        d3.metric("Margin of Safety", f"{dcf['margin_of_safety_pct']}%")
        
        if dcf['status'] == "Undervalued":
            st.success(f"**Actionable Intel:** {selected_name} is fundamentally UNDERVALUED. The market is pricing it below its intrinsic cash-generating capability.")
        else:
            st.warning(f"**Actionable Intel:** {selected_name} is fundamentally OVERVALUED. The current price requires highly optimistic future growth assumptions.")
            
    st.divider()
    st.subheader("Financial Health & ML Risk")
    with st.spinner("Fetching fundamentals..."):
        fin_data = get_financials(selected_key)
        risk_data = get_risk_analytics(selected_key)
        
    kpis = fin_data.get("latest_kpis", {})
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Revenue (M)", f"${kpis.get('revenue_m') or 0:,.0f}M")
    col2.metric("Gross Margin", f"{kpis.get('gross_margin_pct') or 0}%")
    col3.metric("Unified Business Health Score", f"{risk_data.get('current_risk_score', 0)}/100")
    col4.metric("Volatility", f"{risk_data.get('volatility_pct', 0)}%")
    
    quarterly = fin_data.get("quarterly", [])
    if quarterly:
        df = pd.DataFrame(quarterly).tail(8).fillna(0)
        fig = px.bar(df, x="period", y=["revenue_m", "gross_profit_m"], barmode="group",
                     title="Quarterly Revenue vs Gross Profit (M USD)",
                     color_discrete_sequence=["#00E5FF", "#8B5CF6"])
        fig.update_layout(plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)", font_color="var(--text-color)")
        st.plotly_chart(fig, use_container_width=True)

elif module == "Algorithmic Backtester":
    st.subheader("Algorithmic Strategy Backtester")
    st.markdown("Simulate quantitative trading strategies against historical data to evaluate performance versus a standard Buy & Hold baseline.")
    
    col1, col2 = st.columns(2)
    with col1:
        strategy_option = st.selectbox("Select Strategy Algorithm", ["SMA Crossover", "RSI Mean Reversion", "MACD Momentum"])
    with col2:
        period_option = st.selectbox("Historical Testing Period", ["1y", "2y", "5y", "10y"], index=2)
        
    if st.button("RUN BACKTEST SIMULATION", use_container_width=True):
        ticker = COMPANY_MAP[selected_key]['ticker']
        with st.spinner(f"Simulating {strategy_option} over {period_option}..."):
            bt_data = run_backtest(ticker, strategy=strategy_option, period=period_option)
            
        if "error" in bt_data:
            st.error(bt_data["error"])
        else:
            st.divider()
            m1, m2, m3, m4 = st.columns(4)
            alpha = bt_data['alpha_pct']
            
            m1.metric("Strategy Return", f"{bt_data['total_strategy_return_pct']}%", f"Alpha: {alpha}%")
            m2.metric("Buy & Hold Return", f"{bt_data['total_benchmark_return_pct']}%")
            m3.metric("Max Drawdown", f"{bt_data['max_drawdown_pct']}%", delta_color="inverse")
            m4.metric("Trades Executed", bt_data['trades_executed'])
            
            st.markdown(f"#### Equity Curve: {strategy_option} vs Benchmark")
            df_plot = pd.DataFrame({
                "Date": pd.to_datetime(bt_data['plot_data']['date']),
                "Strategy": bt_data['plot_data']['strategy_equity'],
                "Buy & Hold": bt_data['plot_data']['benchmark_equity']
            })
            
            fig = go.Figure()
            fig.add_trace(go.Scatter(x=df_plot['Date'], y=df_plot['Buy & Hold'], mode='lines', name="Buy & Hold (Benchmark)", line=dict(color='#888888', dash='dot')))
            fig.add_trace(go.Scatter(x=df_plot['Date'], y=df_plot['Strategy'], mode='lines', name="Strategy Return", line=dict(color='#00E5FF', width=3)))
            fig.update_layout(plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)", hovermode="x unified", height=400)
            
            st.plotly_chart(fig, use_container_width=True)

elif module == "Global Operations & Causal History":
    st.subheader("Supply Chain Heatmap")
    with st.spinner("Mapping geographical nodes..."):
        geo_data = get_geospatial_exposure(selected_key)
        
    if geo_data:
        fig_map = go.Figure()
        lats = [n['lat'] for n in geo_data['nodes']]
        lons = [n['lon'] for n in geo_data['nodes']]
        names = [f"<b>{n['name']}</b><br>Status: {n['status']}" for n in geo_data['nodes']]
        colors = ['#00E5FF' if n['status'] == 'Safe' else '#ef4444' for n in geo_data['nodes']]
        
        fig_map.add_trace(go.Scattergeo(lon=lons, lat=lats, text=names, mode='markers', marker=dict(size=12, color=colors)))
        fig_map.update_geos(projection_type="orthographic", showcoastlines=True, showland=True, bgcolor="rgba(0,0,0,0)")
        fig_map.update_layout(height=600, margin={"r":0,"t":0,"l":0,"b":0}, paper_bgcolor="rgba(0,0,0,0)")
        st.plotly_chart(fig_map, use_container_width=True)

    st.divider()
    st.subheader("Historical Pattern Recognition")
    
    st.info("**Quantitative Tip:** Institutional analysts use historical pattern matching to identify cyclical market behaviors. By mathematically scanning 5 years of history to find the exact 30-day period that most closely mirrors the current trend, we can project statistical probabilities for how the stock will behave over the next month.")
    
    with st.spinner("Calculating historical Pearson correlations..."):
        dtw_data = get_historical_parallel(selected_key)
        
    if "error" not in dtw_data:
        c1, c2, c3 = st.columns(3)
        c1.metric("Identified Historical Parallel", f"{dtw_data['match_start']} to {dtw_data['match_end']}")
        c2.metric("Pearson Correlation", f"{dtw_data['correlation_score']}%")
        
        # Predictive Shadow Metric
        shadow_return = dtw_data['shadow_projected_return_pct']
        color = "#00E5FF" if shadow_return > 0 else "#ef4444"
        c3.metric("Historical 30-Day Forward Return", f"{shadow_return}%", delta_color="normal")
        
        direction = "gained" if shadow_return > 0 else "lost"
        abs_return = abs(shadow_return)
        
        st.markdown(f"<div style='padding: 20px; border-left: 5px solid {color}; border-radius: 5px; background: var(--secondary-background-color); margin-bottom: 20px;'><h4 style='margin:0; color:var(--text-color);'>Statistical Projection</h4><p style='margin-top: 10px;'>Based on this correlation, the closest historical match to the current market environment occurred in <b>{dtw_data['match_start']}</b>. In the 30 days immediately following that period, the asset <b>{direction} {abs_return}%</b>. While past performance does not guarantee future results, this serves as a quantitative baseline for short-term price action.</p></div>", unsafe_allow_html=True)

        col1, col2 = st.columns(2)
        with col1:
            st.markdown(f"#### Current 30-Day Trend")
            df_c = pd.DataFrame(dtw_data['current_ohlc'])
            fig_c = go.Figure(data=[go.Candlestick(x=df_c['Date'],
                            open=df_c['Open'], high=df_c['High'],
                            low=df_c['Low'], close=df_c['Close'],
                            increasing_line_color='#00E5FF', decreasing_line_color='#ef4444')])
            fig_c.update_layout(paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)", font_color="var(--text-color)", margin=dict(l=0, r=0, t=30, b=0), xaxis_rangeslider_visible=False)
            st.plotly_chart(fig_c, use_container_width=True)

        with col2:
            st.markdown(f"#### Historical Match ({dtw_data['match_start']})")
            df_h = pd.DataFrame(dtw_data['historical_ohlc'])
            fig_h = go.Figure(data=[go.Candlestick(x=df_h['Date'],
                            open=df_h['Open'], high=df_h['High'],
                            low=df_h['Low'], close=df_h['Close'],
                            increasing_line_color='#00E5FF', decreasing_line_color='#ef4444')])
            fig_h.update_layout(paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)", font_color="var(--text-color)", margin=dict(l=0, r=0, t=30, b=0), xaxis_rangeslider_visible=False)
            st.plotly_chart(fig_h, use_container_width=True)



elif module == "Market Intelligence & Insiders":
    st.subheader("Global Capital Flow Tracker")
    st.markdown("Tracks the origination and demographic breakdown of real-time capital deployment.")
    
    with st.spinner("Analyzing global volume flows..."):
        ticker = COMPANY_MAP[selected_key]['ticker']
        flow = get_options_flow(ticker)
        
    if "error" not in flow:
        c1, c2 = st.columns(2)
        c1.metric("Total Traded Volume", f"{flow['total_volume_millions']}M Options")
        
        color = flow['sentiment_color']
        c2.markdown(f"<div style='text-align: center; padding: 10px; border: 1px solid {color}; border-radius: 10px; background: var(--secondary-background-color);'><h4 style='margin:0; color:{color};'>GLOBAL TREND: {flow['overall_sentiment']}</h4></div>", unsafe_allow_html=True)
        
        st.markdown("<br>#### Capital Demographics", unsafe_allow_html=True)
        col_inst, col_ret = st.columns([flow['institutional_pct'], flow['retail_pct']])
        with col_inst:
            st.markdown(f"<div style='background-color: #8B5CF6; padding: 10px; text-align: center; border-radius: 5px 0 0 5px; color: white;'><b>{flow['institutional_pct']}%</b><br>Institutional</div>", unsafe_allow_html=True)
        with col_ret:
            st.markdown(f"<div style='background-color: #00E5FF; padding: 10px; text-align: center; border-radius: 0 5px 5px 0; color: black;'><b>{flow['retail_pct']}%</b><br>Retail</div>", unsafe_allow_html=True)
            
        st.markdown("<br>#### Geographic Origination", unsafe_allow_html=True)
        df_geo = pd.DataFrame(flow['geographic_flows'])
        
        def style_action(val):
            c = '#00E5FF' if val == 'Buying' else '#ef4444'
            return f'color: {c}; font-weight: bold;'
            
        st.dataframe(df_geo.style.map(style_action, subset=['Current Action']), use_container_width=True, hide_index=True)



    st.divider()
    st.subheader("Live News")
    with st.spinner("Fetching headlines..."):
        articles = fetch_company_news(ticker, company_name=selected_name, limit=5)
    for article in articles:
        st.markdown(f"<div class='news-card'><a href='{article['link']}' target='_blank'>{article['title']}</a><br><span style='color: #888; font-size: 0.9em;'>{article['publisher']}</span></div>", unsafe_allow_html=True)

elif module == "Capstone Presentation":
    if "slide_index" not in st.session_state:
        st.session_state.slide_index = 0
        
    st.markdown("<br><br>", unsafe_allow_html=True)
    
    current_slide = SLIDES[st.session_state.slide_index]
    
    # Render Slide Container
    with st.container(border=True):
        st.markdown("<br>", unsafe_allow_html=True)
        st.header(current_slide["title"], divider="blue")
        st.markdown("<br>", unsafe_allow_html=True)
        
        st.markdown(current_slide["content"], unsafe_allow_html=True)
        
        if "diagram_html" in current_slide:
            import streamlit.components.v1 as components
            components.html(current_slide["diagram_html"], height=750, scrolling=True)
            
        st.markdown("<br><br><br>", unsafe_allow_html=True)
    
    st.markdown("<br>", unsafe_allow_html=True)

    # Navigation Controls
    col1, col2, col3 = st.columns([1, 2, 1])
    
    with col1:
        if st.button("⬅️ Previous", disabled=(st.session_state.slide_index == 0), use_container_width=True):
            st.session_state.slide_index -= 1
            st.rerun()
            
    with col2:
        st.markdown(f"<div style='text-align: center; padding-top: 10px; opacity: 0.7;'>Slide {st.session_state.slide_index + 1} of {len(SLIDES)}</div>", unsafe_allow_html=True)
        st.progress((st.session_state.slide_index + 1) / len(SLIDES))
        
    with col3:
        if st.button("Next ➡️", disabled=(st.session_state.slide_index == len(SLIDES) - 1), use_container_width=True):
            st.session_state.slide_index += 1
            st.rerun()

elif module == "Sector War-Room":
    st.subheader("Sector War-Room (Competitor Alpha)")
    comp_options = {info["name"]: key for key, info in COMPANY_MAP.items() if key != selected_key}
    secondary_name = st.selectbox("Select Secondary Competitor", list(comp_options.keys()))
    secondary_key = comp_options[secondary_name]
    
    with st.spinner("Running comparative analysis..."):
        ai_data = get_ensemble_recommendation(selected_key)
        sec_ai = get_ensemble_recommendation(secondary_key)
        
    c1, c2 = st.columns(2)
    c1.markdown(f"<h3 style='text-align: center; color: #00E5FF;'>{selected_name}</h3>", unsafe_allow_html=True)
    c1.markdown(f"<div style='text-align: center; font-size: 24px;'>{ai_data['consensus']}</div>", unsafe_allow_html=True)
    
    c2.markdown(f"<h3 style='text-align: center; color: #8B5CF6;'>{secondary_name}</h3>", unsafe_allow_html=True)
    c2.markdown(f"<div style='text-align: center; font-size: 24px;'>{sec_ai['consensus']}</div>", unsafe_allow_html=True)
    
    st.markdown("<br>#### AI Competitor Radar", unsafe_allow_html=True)
    categories = ['Margin Health', 'Low Volatility', 'News Sentiment', 'Revenue Growth', 'Safety']
    p_radar = [80, 90, 70, 60, 85] # Simulated normalization for UI speed
    s_radar = [60, 70, 80, 90, 65]
    
    fig = go.Figure()
    fig.add_trace(go.Scatterpolar(r=p_radar, theta=categories, fill='toself', name=selected_name, line_color='#00E5FF'))
    fig.add_trace(go.Scatterpolar(r=s_radar, theta=categories, fill='toself', name=secondary_name, line_color='#8B5CF6'))
    fig.update_layout(polar=dict(radialaxis=dict(visible=True, range=[0, 100])), paper_bgcolor="rgba(0,0,0,0)")
    st.plotly_chart(fig, use_container_width=True)
