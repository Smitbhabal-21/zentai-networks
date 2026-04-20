import React from 'react'

export default function TickerTape({ stockData = [], globalData = [], incidentData = null }) {
    // Generate incidents headlines
    const incidentAlerts = (incidentData?.incidents || []).map(inc => ({
        text: `[${inc.severity.toUpperCase()}] ${inc.title} — ${inc.business_impact}`,
        color: inc.severity === 'high' ? '#FF1A4B' : inc.severity === 'medium' ? '#FFB300' : '#4CAF50'
    }))

    // Add high volatility macro headlines (only top movers > 1.5%)
    const macroAlerts = globalData.filter(g => Math.abs(g.change_pct) >= 1.5).map(g => ({
        text: `MACRO ANOMALY: ${g.name} ${g.change_pct > 0 ? 'surged' : 'dropped'} by ${Math.abs(g.change_pct).toFixed(1)}% today.`,
        color: '#E6EDF3'
    }))

    // Fallback if no specific alerts exist
    let alerts = [...incidentAlerts, ...macroAlerts]
    if (alerts.length === 0) {
        alerts = [{ text: "ZENTAI NETWORKS: Monitoring global macroeconomic baselines and localized supply chain integrity.", color: 'rgba(255,255,255,0.7)' }]
    }

    const tape = alerts
    const doubled = [...tape, ...tape, ...tape]

    return (
        <div style={{
            background: 'var(--bg-ticker)',
            height: 36, display: 'flex', alignItems: 'center',
            overflow: 'hidden', flexShrink: 0, position: 'relative',
        }}>
            {/* Alerts label */}
            <div style={{
                flexShrink: 0, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 6,
                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 800,
                color: '#fff', letterSpacing: 2, borderRight: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(0,0,0,0.3)', height: '100%'
            }}>
                <span style={{ width: 8, height: 8, background: '#FF1A4B', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
                ZENTAI ALERTS
            </div>

            <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{
                    display: 'flex', gap: 36,
                    animation: 'ticker 40s linear infinite', whiteSpace: 'nowrap',
                    paddingLeft: '100%',
                }}>
                    {doubled.map((t, i) => (
                        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 16 }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: t.color, fontWeight: 600 }}>
                                {t.text}
                            </span>
                            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, margin: '0 8px' }}>●</span>
                        </span>
                    ))}
                </div>
            </div>

            <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
        </div>
    )
}
