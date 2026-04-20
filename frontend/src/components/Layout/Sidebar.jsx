import React from 'react'

const MODULES = [
    { id: 'overview', label: 'Global Markets', icon: '🌐' },
    { id: 'financial', label: 'Financials', icon: '📊' },
    { id: 'supply', label: 'Supply Chain', icon: '🚚' },
    { id: 'risk', label: 'Risk & Anomaly', icon: '⚠️' },
    { id: 'incidents', label: 'Incident Feed', icon: '🚨' },
]

const COMPANIES = [
    { key: 'citi', tag: 'CITI', color: '#0059B3' },
    { key: 'dhl', tag: 'DHL', color: '#D40511' },
    { key: 'mcd', tag: 'MCD', color: '#FFC72C' },
    { key: 'aapl', tag: 'AAPL', color: '#A3AAAE' },
    { key: 'xom', tag: 'XOM', color: '#D22630' },
    { key: 'jnj', tag: 'JNJ', color: '#D51900' },
    { key: 'pg', tag: 'P&G', color: '#003DA5' },
    { key: 'ford', tag: 'FORD', color: '#003478' },
    { key: 'att', tag: 'AT&T', color: '#00A8E0' },
    { key: 'wmt', tag: 'WMT', color: '#0071CE' },
]

export default function Sidebar({ activeModule, onModuleChange, activeCompany, onCompanyChange }) {
    return (
        <aside style={{
            width: 210, background: 'var(--bg-sidebar)',
            borderRight: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', flexDirection: 'column', flexShrink: 0,
        }}>
            {/* Logo */}
            <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: 'none', border: '2px solid var(--scarlet)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 400, fontSize: 18, color: 'var(--scarlet)',
                        flexShrink: 0, fontFamily: 'serif', fontStyle: 'italic'
                    }}>Z</div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 13, color: '#fff', letterSpacing: '0.02em' }}>
                            ZENTAI
                        </div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: 2 }}>
                            NETWORKS
                        </div>
                    </div>
                </div>
            </div>

            {/* Company selector */}
            <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, paddingLeft: 4 }}>
                    Company
                </div>
                {COMPANIES.map(co => (
                    <button key={co.key} onClick={() => onCompanyChange(co.key)}
                        style={{
                            width: '100%', textAlign: 'left', background: activeCompany === co.key
                                ? 'rgba(204,0,51,0.25)' : 'none',
                            border: 'none', borderRadius: 6,
                            cursor: 'pointer', padding: '7px 10px',
                            color: activeCompany === co.key ? '#fff' : 'rgba(255,255,255,0.45)',
                            fontFamily: 'var(--font-mono)', fontSize: 12,
                            fontWeight: activeCompany === co.key ? 700 : 400,
                            display: 'flex', alignItems: 'center', gap: 8,
                            marginBottom: 2, transition: 'all 0.12s ease',
                        }}
                    >
                        {activeCompany === co.key && (
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--scarlet)', flexShrink: 0 }} />
                        )}
                        {activeCompany !== co.key && <span style={{ width: 6, flexShrink: 0 }} />}
                        {co.tag}
                    </button>
                ))}
            </div>

            {/* Navigation modules */}
            <div style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 18px 8px', }}>
                    Analytics
                </div>
                {MODULES.map(m => (
                    <button key={m.id} onClick={() => onModuleChange(m.id)}
                        style={{
                            width: '100%', textAlign: 'left',
                            background: activeModule === m.id ? 'rgba(204,0,51,0.2)' : 'transparent',
                            border: 'none',
                            borderLeft: activeModule === m.id ? '3px solid var(--scarlet)' : '3px solid transparent',
                            cursor: 'pointer', padding: '9px 16px',
                            color: activeModule === m.id ? '#fff' : 'rgba(255,255,255,0.45)',
                            fontSize: 12.5, fontWeight: activeModule === m.id ? 600 : 400,
                            display: 'flex', alignItems: 'center', gap: 9,
                            transition: 'all 0.12s ease',
                        }}
                    >
                        <span style={{ fontSize: 14, opacity: activeModule === m.id ? 1 : 0.65 }}>{m.icon}</span>
                        {m.label}
                        {m.id === 'incidents' && (
                            <span style={{
                                marginLeft: 'auto', background: 'var(--scarlet)', color: '#fff',
                                fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '1px 6px',
                            }}>LIVE</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Capstone Brief Button */}
            <div style={{ padding: '0 12px 16px' }}>
                <button onClick={() => onModuleChange('about')}
                    style={{
                        width: '100%', textAlign: 'left',
                        background: activeModule === 'about' ? 'rgba(204,0,51,0.2)' : 'transparent',
                        border: 'none', borderLeft: activeModule === 'about' ? '3px solid var(--scarlet)' : '3px solid transparent',
                        cursor: 'pointer', padding: '9px 16px', borderRadius: 4,
                        color: activeModule === 'about' ? '#fff' : 'rgba(255,255,255,0.65)',
                        fontSize: 12.5, fontWeight: activeModule === 'about' ? 600 : 400,
                        display: 'flex', alignItems: 'center', gap: 9, transition: 'all 0.12s ease',
                    }}>
                    <span style={{ fontSize: 14, opacity: activeModule === 'about' ? 1 : 0.65 }}>🎓</span>
                    Capstone Brief
                </button>
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 10, color: 'rgba(255,255,255,0.2)', lineHeight: 1.8 }}>
                Data: Yahoo Finance™<br />
                MITA 688 · Spring 2026<br />
                Smit Bhabal — RUID 250005858
            </div>
        </aside>
    )
}
