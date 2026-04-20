import React from 'react'
import AiAdvisorySection from '../GlobalMarkets/AiAdvisorySection'

export default function IncidentFeedPanel({ data, loading }) {
    if (loading) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Analyzing live market data for active supply chain disruptions...</div>
    if (!data || !data.incidents) return null

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>

            <AiAdvisorySection data={data} moduleType="incidents" />

            {/* Summary Stats */}
            <div style={{ display: 'flex', gap: 16 }}>
                <div className="card" style={{ flex: 1, background: 'var(--scarlet)', color: '#fff', border: 'none' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Active Incidents</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 800 }}>{data.total_incidents}</div>
                </div>
                <div className="card" style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>High Severity Risks</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 800, color: 'var(--scarlet)' }}>{data.high_severity}</div>
                </div>
                <div className="card" style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Moderate Risks</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 800, color: 'var(--amber)' }}>{data.medium_severity}</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, flex: 1, overflow: 'hidden' }}>
                {/* Incident List */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-card)', background: 'var(--bg-root)' }}>
                        <div className="section-title" style={{ margin: 0 }}>Live Incident Feed</div>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                        {data.incidents.map((inc, i) => (
                            <div key={i} className={`news-card severity-${inc.severity}`}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <span className={`badge badge-${inc.severity === 'high' ? 'scarlet' : inc.severity === 'medium' ? 'amber' : 'green'}`}>
                                            {inc.category}
                                        </span>
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{inc.timestamp}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>Risk Score</span>
                                        <span style={{
                                            fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14,
                                            color: inc.severity === 'high' ? 'var(--scarlet)' : inc.severity === 'medium' ? 'var(--amber)' : 'var(--green)'
                                        }}>
                                            {inc.risk_score}
                                        </span>
                                    </div>
                                </div>

                                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1.3 }}>
                                    {inc.title}
                                </h3>
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                                    {inc.description}
                                </p>

                                <div style={{ display: 'flex', gap: 20, fontSize: 11, color: 'var(--text-secondary)', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 10 }}>
                                    <div><strong>Impact Areas:</strong> <span style={{ color: 'var(--text-primary)' }}>{inc.impact_areas.join(', ')}</span></div>
                                    <div><strong>Financial Impact:</strong> <span style={{ color: 'var(--scarlet)' }}>{inc.business_impact}</span></div>
                                </div>
                            </div>
                        ))}
                        {data.incidents.length === 0 && (
                            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No active incidents at this time.</div>
                        )}
                    </div>
                </div>

                {/* Live Market Triggers */}
                <div className="card" style={{ overflowY: 'auto' }}>
                    <div className="section-title">Backend Market Triggers</div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
                        Incidents are AI-generated based on these real-time signals from Yahoo Finance pipelines.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {Object.entries(data.market_signals || {}).map(([key, signal]) => (
                            <div key={key} style={{
                                padding: '10px 12px', background: 'var(--bg-root)',
                                border: '1px solid var(--border-card)', borderRadius: 6,
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase' }}>{key}</div>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>${signal.price}</div>
                                </div>
                                <div style={{
                                    fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13,
                                    color: Math.abs(signal.change_pct) > 2 ? 'var(--scarlet)' : 'var(--text-primary)'
                                }}>
                                    {signal.change_pct > 0 ? '+' : ''}{signal.change_pct}%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
