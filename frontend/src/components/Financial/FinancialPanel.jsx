import React from 'react'
import {
    ResponsiveContainer, AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, Tooltip, CartesianGrid, Legend, RadialBarChart, RadialBar,
} from 'recharts'
import AiAdvisorySection from '../GlobalMarkets/AiAdvisorySection'

const Tip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
        <div className="custom-tooltip" style={{ fontSize: 12 }}>
            <div style={{ color: '#8B949E', marginBottom: 4 }}>{label}</div>
            {payload.map(p => (
                <div key={p.name} style={{ color: p.color, display: 'flex', gap: 8 }}>
                    <span>{p.name}:</span><span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
                </div>
            ))}
        </div>
    )
}

function KpiCard({ label, value, unit = '', sub, color = '#F59E0B' }) {
    return (
        <div className="kpi-card">
            <div style={{ fontSize: 11, color: '#8B949E', marginBottom: 6 }}>{label}</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700, color }}>
                {value ?? '—'}<span style={{ fontSize: 13, fontWeight: 500, marginLeft: 4, color: '#8B949E' }}>{unit}</span>
            </div>
            {sub != null && (
                <div style={{ fontSize: 11, marginTop: 4, color: sub >= 0 ? '#10B981' : '#EF4444', fontFamily: 'JetBrains Mono, monospace' }}>
                    {sub >= 0 ? '▲' : '▼'} {Math.abs(sub)}%
                </div>
            )}
        </div>
    )
}

export default function FinancialPanel({ data, loading }) {
    if (loading) return <div style={{ padding: 40, color: '#484f58', textAlign: 'center' }}>Fetching financial data from Yahoo Finance…</div>
    if (!data) return null

    const { latest_kpis: kpis, quarterly = [], health_score } = data
    const qData = [...quarterly].reverse().slice(0, 8)   // newest-last for chart

    const scoreColor = health_score?.composite >= 75 ? '#10B981'
        : health_score?.composite >= 55 ? '#F59E0B'
            : health_score?.composite >= 35 ? '#EF4444' : '#8B5CF6'

    const radialData = [{ name: 'Health', value: health_score?.composite ?? 0, fill: scoreColor }]

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>

            <AiAdvisorySection data={data} moduleType="financial" />

            {/* KPI Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <KpiCard label="Revenue (Latest Q)" value={kpis?.revenue_m?.toFixed(0)} unit="M" />
                <KpiCard label="EBITDA" value={kpis?.ebitda_m?.toFixed(0)} unit="M" color="#10B981" />
                <KpiCard label="Gross Margin" value={kpis?.gross_margin_pct} unit="%" color="#3B82F6" sub={kpis?.revenue_growth_pct} />
                <KpiCard label="Net Margin" value={kpis?.net_margin_pct} unit="%" color="#8B5CF6" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 16, flex: 1 }}>
                {/* Revenue + Margin chart */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="section-title">📊 Quarterly Revenue vs Gross Profit (M USD)</div>
                    <ResponsiveContainer width="100%" height={230}>
                        <BarChart data={qData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(0, 7)} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip content={<Tip />} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Bar dataKey="revenue_m" name="Revenue" fill="#F59E0B" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="gross_profit_m" name="Gross Profit" fill="#3B82F6" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="ebitda_m" name="EBITDA" fill="#10B981" radius={[3, 3, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>

                    <div className="section-title" style={{ marginTop: 16 }}>📉 Margin Trend (%)</div>
                    <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={qData}>
                            <defs>
                                <linearGradient id="gm" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="nm" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(0, 7)} />
                            <YAxis tick={{ fontSize: 10 }} unit="%" />
                            <Tooltip content={<Tip />} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Area dataKey="gross_margin_pct" name="Gross Margin" stroke="#3B82F6" fill="url(#gm)" dot={false} />
                            <Area dataKey="net_margin_pct" name="Net Margin" stroke="#10B981" fill="url(#nm)" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Health Score */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                    <div className="section-title" style={{ marginBottom: 0 }}>🏥 Business Health</div>
                    <RadialBarChart width={150} height={150} cx={75} cy={75} innerRadius={45} outerRadius={70}
                        data={[{ value: 100, fill: '#21262d' }, { value: health_score?.composite ?? 0, fill: scoreColor }]}
                        startAngle={220} endAngle={-40}>
                        <RadialBar dataKey="value" cornerRadius={6} />
                    </RadialBarChart>
                    <div style={{ textAlign: 'center', marginTop: -24 }}>
                        <div className="gauge-label" style={{ color: scoreColor }}>{health_score?.composite ?? '—'}</div>
                        <div style={{ fontSize: 12, color: scoreColor, fontWeight: 600 }}>{health_score?.rating}</div>
                    </div>
                    <div style={{ width: '100%' }}>
                        {Object.entries(health_score?.breakdown ?? {}).map(([k, v]) => (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ fontSize: 11, color: '#8B949E', textTransform: 'capitalize' }}>{k.replace('_', ' ')}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 50, height: 4, background: '#21262d', borderRadius: 2, overflow: 'hidden' }}>
                                        <div style={{ width: `${v}%`, height: '100%', background: scoreColor, borderRadius: 2 }} />
                                    </div>
                                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#8B949E' }}>{v}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ fontSize: 11, color: '#484f58', textAlign: 'center' }}>
                        Cash: <span style={{ color: '#E6EDF3' }}>${kpis?.cash_m?.toFixed(0) ?? '—'}M</span><br />
                        Debt/Assets: <span style={{ color: '#E6EDF3' }}>{kpis?.debt_to_assets ?? '—'}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
