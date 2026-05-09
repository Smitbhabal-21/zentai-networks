SLIDES = [
    {
        "title": "Zentai Networks: Enterprise Intelligence",
        "content": "<br><br><h2 style='text-align: center; color: #00E5FF; font-size: 36px; letter-spacing: 2px;'>Engineering a Decision Support System</h2><br><p style='text-align: center; font-size: 24px; color: #CCCCCC;'>A Technical Deep-Dive into the Architecture, Quantitative Algorithms, and Data Pipelines powering the Zentai platform.</p><br><hr style='border-color: #00E5FF; opacity: 0.3;'>"
    },
    {
        "title": "1. The Business Dilemma",
        "content": "<blockquote><i>Executive decision-making is currently hampered by data silos, high latency, and information overload.</i></blockquote><br><ul><li><b>Data Fragmentation:</b> CFOs manually synthesize data across disparate platforms (Bloomberg, Supply Chain Portals, News Aggregators).</li><li><b>Reactive Analysis:</b> Legacy BI tools display static historical data but fail to mathematically project future risk or intrinsic value in real-time.</li><li><b>Decision Paralysis:</b> Providing executives with raw, unformatted data without automated algorithmic synthesis leads to high-latency decision making.</li></ul>"
    },
    {
        "title": "2. The Engineering Solution",
        "content": "<p>Zentai Networks resolves this by aggregating massive datasets into a highly performant, single-pane application.</p><table style='width:100%; border-collapse: collapse; margin-top: 20px;'><tr><th style='border-bottom: 2px solid #00E5FF; padding: 10px; text-align: left;'>Engineering Goal</th><th style='border-bottom: 2px solid #00E5FF; padding: 10px; text-align: left;'>Implementation</th></tr><tr><td style='padding: 15px; border-bottom: 1px solid #333;'><b>Data Aggregation</b></td><td style='padding: 15px; border-bottom: 1px solid #333;'>Building async pipelines to fetch live tick data and fundamentals via REST APIs.</td></tr><tr><td style='padding: 15px; border-bottom: 1px solid #333;'><b>Unified Health Score</b></td><td style='padding: 15px; border-bottom: 1px solid #333;'>Engineering algorithms to compress multi-dimensional risk factors into a single scalar metric.</td></tr><tr><td style='padding: 15px;'><b>Predictive Analytics</b></td><td style='padding: 15px;'>Implementing quantitative backtesting and statistical pattern recognition engines.</td></tr></table>"
    },
    {
        "title": "3. Software Architecture Overview",
        "content": "<ul><li><b>Pattern:</b> The application utilizes a <b>Modular Monolith</b> architecture.</li><li><b>Separation of Concerns:</b> The system strictly separates the Data Ingestion Layer, the Mathematical Processing Engines, and the Frontend UI rendering.</li><li><b>Why not Microservices?:</b> For a real-time quantitative dashboard, keeping the Pandas DataFrames in shared memory drastically reduces network latency compared to passing massive JSON payloads between microservices.</li></ul>"
    },
    {
        "title": "4. The Core Tech Stack",
        "content": "<div style='display: flex; justify-content: space-between; margin-top: 20px;'><ul style='list-style-type: none; font-size: 20px;'><li>🐍 <b>Language & Core</b></li><li>Python 3.12</li><li>Object-Oriented Design</li></ul><ul style='list-style-type: none; font-size: 20px;'><li>⚙️ <b>Backend Data Science</b></li><li>Pandas (DataFrames)</li><li>NumPy (Linear Algebra)</li><li>SciPy (Statistics)</li></ul><ul style='list-style-type: none; font-size: 20px;'><li>🖥️ <b>Frontend & UI</b></li><li>Streamlit (Native Rendering)</li><li>Plotly (WebGL Charts)</li><li>Custom CSS Keyframes</li></ul></div>"
    },
    {
        "title": "5. Data Ingestion & Pipeline Handling",
        "content": "<ul><li><b>The Source:</b> We rely on the <code>yfinance</code> library to hook directly into Yahoo Finance's live REST APIs.</li><li><b>Data Formatting:</b> Raw JSON responses are instantly cast into Pandas DataFrames for highly efficient, vectorized operations.</li><li><b>Error Handling:</b> Robust try/except blocks and <code>NaN</code> propagation handling ensure the UI never crashes due to missing remote data.</li></ul>"
    },
    {
        "title": "6. Frontend Engineering (UI/UX)",
        "content": "<ul><li><b>Streamlit Rendering:</b> We utilize Streamlit to generate the React frontend entirely via Python, vastly accelerating development speed.</li><li><b>State Management:</b> We heavily utilize <code>st.session_state</code> to persist variables (like this exact presentation slide index) across browser reruns.</li><li><b>Cyberpunk Aesthetics:</b> We inject custom CSS to override Streamlit's default DOM, implementing Glassmorphism (<code>rgba</code> backgrounds, backdrop-blur) and smooth keyframe animations.</li></ul>"
    },
    {
        "title": "7. System Entity Mapping",
        "content": "<p>To ensure O(1) lookup times across all 8 modules, the entire application relies on a single source of truth:</p><br><blockquote><code>COMPANY_MAP</code> is a static Python dictionary mapping exact ticker symbols to their industries, geographical supply chain nodes, and AI context parameters. This guarantees that if we add a new company, the entire system instantly adapts without code duplication.</blockquote>"
    },
    {
        "title": "8. Engine 1: AI Risk Directive",
        "content": "<p>This engine calculates the <b>Unified Business Health Score</b> by mathematically aggregating three distinct vectors:</p><ol><li><b>Volatility (Risk AI):</b> Calculates the standard deviation of recent closing prices.</li><li><b>Fundamentals (Financial AI):</b> Evaluates Gross Margins and Revenue Growth against hardcoded algorithmic thresholds.</li><li><b>Sentiment (Strategy AI):</b> Parses live news headlines using heuristic keyword matching.</li></ol>"
    },
    {
        "title": "9. Engine 2: DCF Valuation (The Math)",
        "content": "<ul><li><b>The Algorithm:</b> Discounted Cash Flow is a quantitative method to determine 'Intrinsic Value'.</li><li><b>Implementation:</b> The engine scrapes Free Cash Flow (FCF) data, projects it 5 years into the future using a constant growth rate, and discounts it back to Present Value using an estimated WACC (Weighted Average Cost of Capital).</li><li><b>Execution:</b> Calculated natively using Python floats to determine the exact 'Margin of Safety' percentage.</li></ul>"
    },
    {
        "title": "10. Engine 3: Portfolio Optimization",
        "content": "<ul><li><b>Modern Portfolio Theory (MPT):</b> Implementing Harry Markowitz's Nobel-prize winning mathematics natively in Python.</li><li><b>The Matrix:</b> We use Pandas to calculate the daily percentage returns of all 10 companies over the last 365 days, and then generate an `(N x N)` <b>Covariance Matrix</b> to understand how the assets move relative to each other.</li></ul>"
    },
    {
        "title": "11. Covariance & Inverse Volatility Weighting",
        "content": "<ul><li><b>The Math:</b> Instead of equally weighting the portfolio (10% each), the algorithm calculates the Inverse Volatility of each asset.</li><li><b>Risk Minimization:</b> Assets with high standard deviations (like Tesla) are mathematically penalized and assigned lower weights. Highly stable assets (like JPMorgan) are assigned heavier weights to maximize the portfolio's Sharpe Ratio.</li></ul>"
    },
    {
        "title": "12. The Capital Allocator Algorithm",
        "content": "<blockquote><i>Executives execute on absolute capital, not abstract percentages.</i></blockquote><br><ul><li><b>Execution:</b> The user inputs a float variable (e.g., `$100,000`).</li><li><b>Dynamic Allocation:</b> The engine multiplies this input against the optimized MPT weight vector, returning exact dollar allocations for the UI execution table.</li></ul>"
    },
    {
        "title": "13. Engine 4: Algorithmic Backtester",
        "content": "<p>This module evaluates trading signals against historical time-series data to simulate 'Alpha'.</p><br><ul><li><b>Vectorization:</b> We avoid slow Python `for` loops by using Pandas vectorized column operations.</li><li><b>Look-Ahead Bias Prevention:</b> The most critical bug in quantitative finance. We use `df['Signal'].shift(1)` to ensure the algorithm only buys on the day <i>after</i> a signal is generated, simulating real-world latency.</li></ul>"
    },
    {
        "title": "14. Backtester: SMA Crossovers",
        "content": "<ul><li><b>Simple Moving Average (SMA):</b> A classic trend-following algorithm.</li><li><b>Implementation:</b> We calculate `df['Close'].rolling(window=50).mean()`.</li><li><b>The Trigger:</b> When the 50-day average crosses above the 200-day average, `NumPy.where()` explicitly sets the position column to 1 (Long). Otherwise, it sets it to 0 (Cash).</li></ul>"
    },
    {
        "title": "15. Backtester: RSI & MACD",
        "content": "<ul><li><b>RSI (Relative Strength Index):</b> Measures momentum velocity. We programmed the standard formula: calculating average gains/losses over a 14-day window to identify oversold (<30) thresholds.</li><li><b>MACD (Moving Average Convergence Divergence):</b> Calculates the delta between the 12-day and 26-day Exponential Moving Averages (EMA) to identify trend acceleration.</li></ul>"
    },
    {
        "title": "16. Engine 5: Geospatial Supply Chain",
        "content": "<ul><li><b>The Problem:</b> Plotting static infrastructure on a map does not provide risk context.</li><li><b>Plotly WebGL:</b> We use Plotly's Orthographic projection to render a high-performance, interactive 3D globe.</li><li><b>Hardcoded Nodes:</b> Each of the 10 companies has explicit latitude/longitude arrays mapping their physical HQs, Manufacturing plants, and Data Centers.</li></ul>"
    },
    {
        "title": "17. The Haversine Collision Algorithm",
        "content": "<ul><li><b>Proactive Risk Mathematics:</b> To calculate risk, we must detect if a corporate node is physically near an active geopolitical Danger Zone.</li><li><b>The Haversine Formula:</b> Because the Earth is a sphere, standard Euclidean distance (`a² + b² = c²`) fails. We programmed the Haversine trigonometric formula to calculate the exact great-circle distance between coordinates.</li><li><b>The Trigger:</b> If the distance is less than the danger zone's blast radius, the UI automatically flags it as CRITICAL RISK.</li></ul>"
    },
    {
        "title": "18. Engine 6: Historical Pattern Recognition",
        "content": "<p>Transitioning from static reporting to predictive quantitative analytics.</p><br><ul><li><b>The Goal:</b> Find the exact 30-day period in the last 5 years that mathematically mirrors the current 30-day volatility trend.</li><li><b>Normalization:</b> We cannot compare raw prices (e.g., a $150 stock today vs $50 four years ago). The algorithm first normalizes both arrays using <code>(price - mean) / standard_deviation</code>.</li></ul>"
    },
    {
        "title": "19. Pearson Correlation Implementation",
        "content": "<ul><li><b>SciPy Integration:</b> We use `scipy.stats.pearsonr` to scan the historical arrays.</li><li><b>The Loop:</b> A sliding window moves across 5 years of daily closing data, calculating the correlation coefficient against the current 30-day normalized array.</li><li><b>The Output:</b> The algorithm returns the index with the maximal correlation score (e.g., `0.92`), allowing the UI to plot the exact historical match.</li></ul>"
    },
    {
        "title": "20. The Predictive Shadow & Candlesticks",
        "content": "<ul><li><b>OHLC Rendering:</b> The engine extracts full Open, High, Low, Close arrays to render professional Plotly Candlestick charts.</li><li><b>The Shadow:</b> The algorithm explicitly calculates the percentage return in the 30 days <i>immediately following</i> the historical match index, providing a statistical baseline projection for the coming month.</li></ul>"
    },
    {
        "title": "21. Engine 7: Market Intelligence",
        "content": "<ul><li><b>Options Flow (Derivatives):</b> The engine scrapes live Put/Call volume sizes.</li><li><b>Demographic Simulation:</b> Because exchanges do not broadcast IP addresses, the algorithm simulates Institutional vs Retail capital originations. Very high volume blocks are mathematically weighted toward Institutional hubs (e.g., Hedge Funds in New York).</li></ul>"
    },
    {
        "title": "22. Engine 8: Sector War-Room",
        "content": "<ul><li><b>Multi-Dimensional Comparison:</b> Comparing companies solely on price is fundamentally flawed.</li><li><b>Radar Charts:</b> We use Plotly Polar Radar charts to visualize multi-dimensional superiority, plotting normalized vectors for Margin Health, Sentiment, Yield, and Volatility simultaneously.</li></ul>"
    },
    {
        "title": "23. Capstone Rubric Alignment (Part 1)",
        "content": "<table style='width:100%; border-collapse: collapse; margin-top: 10px;'><tr><th style='border-bottom: 2px solid #00E5FF; padding: 10px; text-align: left;'>Objective</th><th style='border-bottom: 2px solid #00E5FF; padding: 10px; text-align: left;'>Engineering Solution</th></tr><tr><td style='padding: 15px; border-bottom: 1px solid #333;'><b>1. Decision Support</b></td><td style='padding: 15px; border-bottom: 1px solid #333;'>Implemented via the Multi-AI Directive and Executive NLP Chatbot.</td></tr><tr><td style='padding: 15px; border-bottom: 1px solid #333;'><b>2. Unified Health Score</b></td><td style='padding: 15px; border-bottom: 1px solid #333;'>Algorithmic aggregation of Risk, Strategy, & Financial vectors.</td></tr><tr><td style='padding: 15px;'><b>3. Forward-Looking Insights</b></td><td style='padding: 15px;'>Engineered via DCF Valuation and Pearson Correlation matchers.</td></tr></table>"
    },
    {
        "title": "24. Capstone Rubric Alignment (Part 2)",
        "content": "<table style='width:100%; border-collapse: collapse; margin-top: 10px;'><tr><th style='border-bottom: 2px solid #00E5FF; padding: 10px; text-align: left;'>Objective</th><th style='border-bottom: 2px solid #00E5FF; padding: 10px; text-align: left;'>Engineering Solution</th></tr><tr><td style='padding: 15px; border-bottom: 1px solid #333;'><b>4. Operational Optimization</b></td><td style='padding: 15px; border-bottom: 1px solid #333;'>Implemented via the Haversine Supply Chain Geospatial Heatmap.</td></tr><tr><td style='padding: 15px; border-bottom: 1px solid #333;'><b>5. Strategic Planning</b></td><td style='padding: 15px; border-bottom: 1px solid #333;'>Engineered via the Markowitz Portfolio Optimizer and Backtester.</td></tr><tr><td style='padding: 15px;'><b>6. Reduce Uncertainty</b></td><td style='padding: 15px;'>Achieved by seamlessly aggregating disparate data into a centralized Streamlit UI.</td></tr></table>"
    },
    {
        "title": "25. Deployment & DevOps",
        "content": "<ul><li><b>Package Management:</b> The system uses `uv` and `requirements.txt` to strictly pin dependencies (e.g., `pandas==2.2.0`), ensuring zero environment drift between local execution and cloud deployment.</li><li><b>Cloud Readiness:</b> The decoupled architecture allows the Pandas engines to be easily containerized via Docker and deployed to AWS EC2 or Streamlit Community Cloud with zero code modifications.</li></ul>"
    },
    {
        "title": "26. Future Architecture Roadmap",
        "content": "<ul><li><b>Data Persistence:</b> Integrate PostgreSQL to allow users to save custom portfolios, historical backtest logs, and executive notes.</li><li><b>Microsecond Latency:</b> Upgrade the ingestion pipeline from `yfinance` REST APIs to secure WebSocket connections for true, unthrottled tick data.</li><li><b>Automated Execution:</b> Connect the Capital Allocator engine directly to institutional brokerage APIs (like Alpaca) for one-click trade execution.</li></ul>"
    },
    {
        "title": "27. Conclusion",
        "content": "<br><br><h2 style='text-align: center; color: #8B5CF6; font-size: 40px;'>Thank You</h2><br><p style='text-align: center; font-size: 24px;'>Zentai Networks successfully demonstrates how modern Software Engineering principles and Python data science frameworks can fundamentally transform executive decision-making.</p>"
    }
]
