import React from 'react'

export default function AboutPanel() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 20 }}>
            <div style={{ marginBottom: 10 }}>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    Capstone Project Brief
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    Zentai Networks BI Terminal — Master of Information Technology & Analytics (MITA).
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, flex: 1, overflowY: 'auto' }}>
                {/* Left Column: Purpose & Impact */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div className="card">
                        <div className="section-title">🎯 Project Purpose & Impact</div>
                        <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 16 }}>
                            Modern corporate supply chains suffer from critical visibility gaps between <strong>global macroeconomic volatility</strong> and <strong>tactical inventory management</strong>.
                            <br /><br />
                            Zentai Networks acts as an end-to-end Data Engineering pipeline and BI Dashboard. It seamlessly merges real-time financial realities (from Yahoo Finance APIs) with Machine Learning inference to score supplier risk, identify financial anomalies, and auto-generate executive disruption alerts before they impact the bottom line.
                        </p>
                    </div>

                    <div className="card">
                        <div className="section-title">🏗️ Architecture & Deployment</div>
                        <ul style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.8, paddingLeft: 16, margin: 0 }}>
                            <li><strong>ETL Pipeline:</strong> Python, Pandas, yfinance.</li>
                            <li><strong>Data Warehouse:</strong> SQLAlchemy bridging to a normalized SQLite datastore (designed for seamless migration to AWS PostgreSQL RDS).</li>
                            <li><strong>Machine Learning:</strong> Scikit-Learn (Isolation Forests) and SHAP (Explainability).</li>
                            <li><strong>Backend:</strong> FastAPI strictly returning REST endpoints decoupled from database locks.</li>
                            <li><strong>Frontend:</strong> React 18, Vite, Framer Motion, and Recharts.</li>
                            <li style={{ marginTop: 10, color: 'var(--text-muted)' }}>* Local deployment is primary for this academic submission. Cloud AWS migration is an available stretch implementation.</li>
                        </ul>
                    </div>
                </div>

                {/* Right Column: Execution Constraints */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div className="card">
                        <div className="section-title">⏱️ Execution Constraints</div>
                        <div style={{ display: 'grid', gap: 12 }}>
                            <div style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 6, border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Timeline</div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>14-Week Academic Semester</div>
                            </div>
                            <div style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 6, border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Team Size</div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Solo Developer (Smit Bhabal)</div>
                            </div>
                            <div style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 6, border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Presentation Target</div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Academic Faculty Panel & Industry Stakeholders</div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="section-title">🚀 Future Stretch Goals</div>
                        <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                            While the current iteration fulfills rigorous Data Engineering requirements, the following additions are targeted:
                        </p>
                        <ul style={{ fontSize: 13, color: 'var(--scarlet)', lineHeight: 1.8, paddingLeft: 16, marginTop: 10 }}>
                            <li><strong>Real-time Streaming (Apache Kafka):</strong> Migrating the script-based batch ETL script into a continuous publish/subscribe stream for micro-second financial tracking.</li>
                            <li><strong>NLP Sentiment Analysis:</strong> Scraping Reuters and Bloomberg global shipping news, running unstructured data through HuggingFace transformers, and correlating negative sentiment to automated risk spikes.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
