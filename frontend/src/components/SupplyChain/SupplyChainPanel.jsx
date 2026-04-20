import React from 'react'
import {
    ResponsiveContainer, AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, Tooltip, CartesianGrid, Legend, LineChart, Line,
} from 'recharts'
import AiAdvisorySection from '../GlobalMarkets/AiAdvisorySection'

const Tip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
        <div className="custom-tooltip" style={{ fontSize: 12 }}>
            <div style={{ color: '#8B949E', marginBottom: 4 }}>{label}</div>
            {payload.map(p => (
                <div key={p.name} style={{ color: p.color, display: 'flex', gap: 8 }}>
                    <span>{p.name}:</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
                    </span>
                </div>
            ))}
        </div>
    )
}

function KpiPill({ label, value, unit = '', color = '#F59E0B', sublabel }) {
    return (
        <div className="kpi-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#484f58', marginBottom: 4 }}>{label}</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 700, color }}>
                {value ?? '—'}<span style={{ fontSize: 11, color: '#8B949E', marginLeft: 3 }}>{unit}</span>
            </div>
            {sublabel && <div style={{ fontSize: 10, color: '#8B949E', marginTop: 2 }}>{sublabel}</div>}
        </div>
    )
}

function RiskMeter({ value, label }) {
    const color = value > 70 ? '#EF4444' : value > 40 ? '#F59E0B' : '#10B981'
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8B949E' }}>
                <span>{label}</span><span style={{ fontFamily: 'JetBrains Mono, monospace', color }}>{value?.toFixed(1)}</span>
            </div>
            <div style={{ height: 6, background: '#21262d', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s ease' }} />
            </div>
        </div>
    )
}

export default function SupplyChainPanel({ data, loading }) {
    if (loading) return <div style={{ padding: 40, color: '#484f58', textAlign: 'center' }}>Fetching supply chain data from Yahoo Finance…</div>
    if (!data) return null

    const { latest = {}, trend = [] } = data
    const trendData = [...trend].reverse().slice(0, 8)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>

            <AiAdvisorySection data={data} moduleType="supply" />

            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                <KpiPill label="Inventory" value={latest.inventory_m?.toFixed(0)} unit="M" />
                <KpiPill label="Inv. Turnover" value={latest.inventory_turnover?.toFixed(1)} sublabel="×/year" color="#10B981" />
                <KpiPill label="Days Inventory" value={latest.days_inventory?.toFixed(1)} unit="d" color="#F59E0B" />
                <KpiPill label="Cash Conv. Cycle" value={latest.cash_conversion_cycle?.toFixed(1)} unit="d" color="#8B5CF6" />
                <KpiPill label="On-Time Delivery" value={latest.on_time_delivery_pct?.toFixed(1)} unit="%" color="#3B82F6" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, flex: 1 }}>
                {/* Inventory trend */}
                <div className="card">
                    <div className="section-title">📦 Inventory Level (M USD)</div>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={trendData}>
                            <defs>
                                <linearGradient id="inv" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(0, 7)} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip content={<Tip />} />
                            <Area dataKey="inventory_m" name="Inventory ($M)" stroke="#F59E0B" fill="url(#inv)" dot={true} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* DIO / DPO / DSO */}
                <div className="card">
                    <div className="section-title">⏱️ Working Capital Days</div>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(0, 7)} />
                            <YAxis tick={{ fontSize: 10 }} unit="d" />
                            <Tooltip content={<Tip />} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Line dataKey="days_inventory" name="Days Inventory" stroke="#F59E0B" dot={false} strokeWidth={2} />
                            <Line dataKey="days_payable" name="Days Payable" stroke="#10B981" dot={false} strokeWidth={2} />
                            <Line dataKey="days_receivable" name="Days Receivable" stroke="#3B82F6" dot={false} strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* CCC + Fulfillment */}
                <div className="card">
                    <div className="section-title">🔄 Cash Conversion Cycle (days)</div>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(0, 7)} />
                            <YAxis tick={{ fontSize: 10 }} unit="d" />
                            <Tooltip content={<Tip />} />
                            <Bar dataKey="cash_conversion_cycle" name="CCC"
                                fill="#8B5CF6" radius={[3, 3, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Risk meters */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="section-title">⚡ Supply Chain Risk Indicators</div>
                    <RiskMeter label="Supplier Risk Score" value={latest.supplier_risk_score} />
                    <RiskMeter label="Fulfillment Risk" value={100 - (latest.fulfillment_score ?? 70)} />
                    <RiskMeter label="Inventory Overstock Risk" value={Math.min(100, (latest.days_inventory ?? 30) * 1.5)} />
                    <RiskMeter label="Accounts Receivable Risk" value={Math.min(100, (latest.days_receivable ?? 30) * 2)} />
                    <div style={{ marginTop: 8, padding: '10px 12px', background: '#0a0c0f', borderRadius: 6, fontSize: 11, color: '#8B949E', lineHeight: 1.7 }}>
                        CCC: <span style={{ color: '#E6EDF3', fontFamily: 'JetBrains Mono, monospace' }}>{latest.cash_conversion_cycle?.toFixed(1) ?? '—'}d</span>
                        &nbsp;|&nbsp;
                        A/P: <span style={{ color: '#E6EDF3', fontFamily: 'JetBrains Mono, monospace' }}>${latest.accounts_payable_m?.toFixed(0) ?? '—'}M</span>
                        &nbsp;|&nbsp;
                        A/R: <span style={{ color: '#E6EDF3', fontFamily: 'JetBrains Mono, monospace' }}>${latest.accounts_receivable_m?.toFixed(0) ?? '—'}M</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
