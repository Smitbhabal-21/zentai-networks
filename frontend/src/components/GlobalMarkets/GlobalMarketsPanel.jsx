import React from 'react'
import AiAdvisorySection from './AiAdvisorySection'

function MarketPill({ data }) {
    const isUp = data.change_pct >= 0
    const color = isUp ? 'var(--green)' : 'var(--red)'
    return (
        <div className="market-pill">
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>{data.name}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700 }}>
                {data.price.toFixed(2)}
            </div>
            <div style={{ display: 'flex', gap: 6, fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, color, marginTop: 4 }}>
                <span>{isUp ? '▲' : '▼'} {Math.abs(data.change).toFixed(2)}</span>
                <span>({Math.abs(data.change_pct).toFixed(2)}%)</span>
            </div>
        </div>
    )
}

function MarketCategory({ title, items }) {
    if (!items || items.length === 0) return null
    return (
        <div style={{ marginBottom: 24 }}>
            <div className="section-title">{title}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {items.map(item => (
                    <MarketPill key={item.symbol} data={item} />
                ))}
            </div>
        </div>
    )
}

export default function GlobalMarketsPanel({ data, loading }) {
    if (loading) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Syncing live global market data from Yahoo Finance...</div>
    if (!data || !data.by_category) return <div style={{ padding: 40, color: 'var(--scarlet)' }}>⚠️ Failed to load robust market data. Ensure internet connection allows Yahoo Finance API calls.</div>

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    Global Macro Environment
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Live market indices and commodities directly influencing supply chain operations.</p>

                {/* New AI Advisory Section */}
                <AiAdvisorySection data={data} />
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                {Object.entries(data.by_category || {}).map(([title, items]) => (
                    <MarketCategory key={title} title={title} items={items} />
                ))}
            </div>
        </div>
    )
}
