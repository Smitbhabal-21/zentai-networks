import React from 'react'

const COMPANIES = {
    citi: { name: 'Citi Bank', tag: 'CITI', industry: 'Global Banking & Finance' },
    dhl: { name: 'DHL Logistics', tag: 'DHL', industry: 'Global Supply Chain & Freight' },
    mcd: { name: 'McDonald\'s', tag: 'MCD', industry: 'Global QSR & Retail Food' },
    aapl: { name: 'Apple Inc.', tag: 'AAPL', industry: 'Consumer Tech & Hardware' },
    xom: { name: 'ExxonMobil', tag: 'XOM', industry: 'Energy & Oil' },
    jnj: { name: 'Johnson & Johnson', tag: 'JNJ', industry: 'Healthcare & Pharma' },
    pg: { name: 'Procter & Gamble', tag: 'P&G', industry: 'Consumer Goods & FMCG' },
    ford: { name: 'Ford Motor Co.', tag: 'FORD', industry: 'Automotive Manufacturing' },
    att: { name: 'AT&T', tag: 'AT&T', industry: 'Telecommunications' },
    wmt: { name: 'Walmart', tag: 'WMT', industry: 'Global Retail' },
}

const MODULE_LABELS = {
    overview: 'Global Markets Overview',
    financial: 'Financial Performance',
    stock: 'Stock Market Analysis',
    supply: 'Supply Chain Analytics',
    risk: 'Risk & Anomaly Detection',
    incidents: 'Supply Chain Incident Feed',
}

export default function Header({ activeCompany, activeModule, incidentCount = 0 }) {
    const co = COMPANIES[activeCompany]
    const now = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })

    return (
        <header style={{
            background: 'var(--bg-header)',
            borderBottom: '1px solid var(--border)',
            padding: '0 24px',
            height: 58,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
            boxShadow: '0 1px 0 var(--border)',
        }}>
            {/* Left: breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '5px 12px',
                    background: 'var(--scarlet-tint)',
                    border: '1px solid rgba(204,0,51,0.15)',
                    borderRadius: 8,
                }}>
                    <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 800,
                        color: 'var(--scarlet)',
                    }}>{co?.tag}</span>
                    <span style={{ width: 1, height: 14, background: 'var(--border-dark)' }} />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{co?.industry}</span>
                </div>
                <span style={{ color: 'var(--border-dark)', fontSize: 16 }}>›</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {MODULE_LABELS[activeModule]}
                </span>
            </div>

            {/* Right: alerts + time */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {incidentCount > 0 && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: 'var(--red-bg)', border: '1px solid rgba(204,0,51,0.25)',
                        borderRadius: 8, padding: '5px 12px',
                        animation: 'pulse 2s infinite',
                    }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--scarlet)' }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--scarlet)' }}>
                            {incidentCount} Active Incidents
                        </span>
                    </div>
                )}
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>{now}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>Live · Yahoo Finance™</div>
                </div>
            </div>

            <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.7; }
        }
      `}</style>
        </header>
    )
}
