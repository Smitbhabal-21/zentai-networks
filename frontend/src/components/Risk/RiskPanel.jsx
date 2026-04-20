import React from 'react'
import {
    ResponsiveContainer, AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
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
                        {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
                    </span>
                </div>
            ))}
        </div>
    )
}

function RiskGauge({ score, label }) {
    const pct = Math.min(100, Math.max(0, score))
    const color = pct > 75 ? '#EF4444' : pct > 55 ? '#F59E0B' : pct > 35 ? '#3B82F6' : '#10B981'
    const ringDeg = (pct / 100) * 270  // 270-degree arc
    return (
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{
                width: 120, height: 120, borderRadius: '50%',
                background: `conic-gradient(${color} 0deg, ${color} ${ringDeg}deg, #21262d ${ringDeg}deg 360deg)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
            }}>
                <div style={{
                    width: 90, height: 90, borderRadius: '50%',
                    background: '#161b22',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700, color }}>
                        {pct.toFixed(0)}
                    </div>
                    <div style={{ fontSize: 9, color: '#484f58' }}>/ 100</div>
                </div>
            </div>
            <div style={{ fontSize: 12, color, fontWeight: 600 }}>{label}</div>
        </div>
    )
}

export default function RiskPanel({ data, loading }) {
    if (loading) return <div style={{ padding: 40, color: '#484f58', textAlign: 'center' }}>Running ML anomaly detection…</div>
    if (!data) return null

    const { timeline = [], anomaly_events = [], shap = [] } = data
    const tl = timeline.slice(-180)

    const riskColor = data.current_risk_score > 75 ? '#EF4444'
        : data.current_risk_score > 55 ? '#F59E0B'
            : data.current_risk_score > 35 ? '#3B82F6' : '#10B981'

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>

            <AiAdvisorySection data={data} moduleType="risk" />

            {/* Top row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 1fr', gap: 16, alignItems: 'center' }}>
                <RiskGauge score={data.current_risk_score} label={data.risk_label} />

                <div className="kpi-card">
                    <div style={{ fontSize: 10, color: '#484f58', marginBottom: 4 }}>Annualized Volatility</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700, color: '#8B5CF6' }}>
                        {data.volatility_pct?.toFixed(2)}<span style={{ fontSize: 12 }}>%</span>
                    </div>
                </div>
                <div className="kpi-card">
                    <div style={{ fontSize: 10, color: '#484f58', marginBottom: 4 }}>Current Drawdown</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700, color: '#EF4444' }}>
                        {data.drawdown_pct?.toFixed(2)}<span style={{ fontSize: 12 }}>%</span>
                    </div>
                </div>
                <div className="kpi-card">
                    <div style={{ fontSize: 10, color: '#484f58', marginBottom: 4 }}>Value at Risk (95%, 1D)</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700, color: '#F59E0B' }}>
                        {data.var_95_pct?.toFixed(3)}<span style={{ fontSize: 12 }}>%</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#484f58', marginTop: 4 }}>
                        Anomalies (30D): <span style={{ color: data.anomaly_count_30d > 3 ? '#EF4444' : '#10B981', fontFamily: 'JetBrains Mono, monospace' }}>{data.anomaly_count_30d}</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, flex: 1 }}>
                {/* Risk timeline */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="section-title">🔴 Risk Score Timeline (180 Days)</div>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={tl}>
                            <defs>
                                <linearGradient id="rsk" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={riskColor} stopOpacity={0.4} />
                                    <stop offset="95%" stopColor={riskColor} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(0, 7)} interval={30} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                            <Tooltip content={<Tip />} />
                            <ReferenceLine y={75} stroke="#EF4444" strokeDasharray="4 2" label={{ value: 'Critical', fill: '#EF4444', fontSize: 10 }} />
                            <ReferenceLine y={55} stroke="#F59E0B" strokeDasharray="4 2" label={{ value: 'High', fill: '#F59E0B', fontSize: 10 }} />
                            <Area dataKey="risk" name="Risk Score" stroke={riskColor} fill="url(#rsk)" dot={false} strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>

                    <div className="section-title" style={{ marginTop: 8 }}>📊 Volatility (%)</div>
                    <ResponsiveContainer width="100%" height={130}>
                        <AreaChart data={tl}>
                            <defs>
                                <linearGradient id="vol" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(0, 7)} interval={30} />
                            <YAxis tick={{ fontSize: 10 }} unit="%" />
                            <Tooltip content={<Tip />} />
                            <Area dataKey="volatility_pct" name="Volatility" stroke="#8B5CF6" fill="url(#vol)" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* SHAP + anomalies */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* SHAP */}
                    <div className="card" style={{ flex: 1 }}>
                        <div className="section-title">🧠 SHAP Explainability</div>
                        <div style={{ fontSize: 10, color: '#484f58', marginBottom: 10 }}>Feature contributions to risk score</div>
                        {shap.map(s => {
                            const max = Math.max(...shap.map(x => Math.abs(x.shap_value))) || 1
                            const pct = (Math.abs(s.shap_value) / max) * 100
                            const col = s.shap_value > 0 ? '#EF4444' : '#10B981'
                            return (
                                <div key={s.feature} style={{ marginBottom: 10 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8B949E', marginBottom: 3 }}>
                                        <span>{s.feature}</span>
                                        <span style={{ fontFamily: 'JetBrains Mono, monospace', color: col, fontSize: 10 }}>
                                            {s.shap_value > 0 ? '+' : ''}{s.shap_value.toFixed(4)}
                                        </span>
                                    </div>
                                    <div style={{ height: 5, background: '#21262d', borderRadius: 3, overflow: 'hidden' }}>
                                        <div style={{ width: `${pct}%`, height: '100%', background: col, borderRadius: 3 }} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Anomaly events */}
                    <div className="card" style={{ flex: 1, overflow: 'auto' }}>
                        <div className="section-title">🚨 Anomaly Events (Recent)</div>
                        {anomaly_events.slice(0, 8).map((ev, i) => (
                            <div key={i} style={{
                                display: 'flex', justifyContent: 'space-between', padding: '5px 0',
                                borderBottom: '1px solid #21262d', fontSize: 11,
                            }}>
                                <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#8B949E' }}>{ev.date}</span>
                                <span style={{ color: '#EF4444', fontFamily: 'JetBrains Mono, monospace' }}>${ev.price?.toFixed(2)}</span>
                                <span style={{ color: ev.risk > 70 ? '#EF4444' : '#F59E0B', fontFamily: 'JetBrains Mono, monospace' }}>
                                    Risk: {ev.risk?.toFixed(0)}
                                </span>
                            </div>
                        ))}
                        {anomaly_events.length === 0 && (
                            <div style={{ color: '#10B981', fontSize: 11 }}>✓ No major anomalies detected</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
