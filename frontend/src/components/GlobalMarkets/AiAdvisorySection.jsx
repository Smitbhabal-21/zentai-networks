import React, { useState, useEffect } from 'react'

export default function AiAdvisorySection({ data, moduleType = "global" }) {
    const [displayText, setDisplayText] = useState('')
    const [isGenerating, setIsGenerating] = useState(true)

    const generateAiContext = () => {
        if (!data) return "Awaiting neural ingestion of module parameters..."

        let promptContext = ""
        let strategy = ""
        let secondary = "Continually monitor key indicators heading into the next fiscal quarter."

        if (moduleType === "global") {
            const all = []
            if (data.by_category) {
                Object.values(data.by_category).forEach(cat => all.push(...cat))
            }
            if (all.length > 0) {
                const sorted = all.sort((a, b) => Math.abs(b.change_pct) - Math.abs(a.change_pct))
                const top = sorted[0]
                promptContext = `Global Macro Sector Driver: ${top.name} at ${top.price.toFixed(2)} (${top.change_pct}%).`
                if (top.change_pct < -2) strategy = `Severe drop detected in ${top.name}. Highly recommend hedging short-term liquidity and freezing aggregate cap-ex directly trailing this entity.`
                else if (top.change_pct > 2) strategy = `Unexpected surge in ${top.name} points to supply inelasticity. Review procurement contracts immediately heavily leveraging this sector.`
                else strategy = `Moderate movement dictates a standardized neutral operating cadence across global equities.`
                secondary = `Trigger automated alerts if ${top.symbol} breaches a 5% delta window.`
            }
        }
        else if (moduleType === "financial") {
            const revGrowth = data.metrics?.revenue_growth_pct || 0
            const ebitda = data.metrics?.ebitda || 0
            promptContext = `Financial Ledger Digest: Revenue Growth ${revGrowth}%, TTM EBITDA $${(ebitda / 1e9).toFixed(2)}B.`
            if (revGrowth < 0) strategy = `Revenue is actively contracting. Immediate focus must pivot toward aggressive cost-cutting in SG&A to protect bottom-line EPS.`
            else strategy = `Top-line expanding favorably. Ensure cash conversion is not severely constrained by ballooning inventory to match revenue velocity.`
            secondary = `Scrub quarterly OpEx forecasts against recent macroeconomic inflation indices.`
        }
        else if (moduleType === "supply") {
            const fillScore = data.latest?.fulfillment_score || 0
            const daysInv = data.latest?.days_inventory || 0
            promptContext = `Supply Operations Digest: Fulfillment Proxy ${fillScore}/100, Days Inv Outstanding: ${daysInv}.`
            if (fillScore < 60) strategy = `Critical breakdown in fulfillment efficiency. The cash conversion cycle is stretching highly abnormally—likely stalled supplier shipments or uncollected receivables. Expedite AR collections.`
            else strategy = `Fulfillment operations are fluid. Inventory is turning within optimized historical bands.`
            secondary = `Conduct a targeted audit on Tier-2 suppliers if days-inventory outstanding spikes suddenly.`
        }
        else if (moduleType === "risk") {
            const riskScore = data.current_risk_score || 40
            const count = data.anomaly_count_30d || 0
            promptContext = `Iso-Forest Risk Model Matrix: Current Score ${riskScore}/100 | Anomalies Detected (30d): ${count}.`
            if (riskScore > 65) strategy = `ALERT: Heightened risk environment detected by underlying Isolation Forest engine. Executive supply chains are actively vulnerable to pricing shocks based on 180D SHAP regressions.`
            else strategy = `Operational environment displays normalized volatility patterns compared to moving baselines.`
            secondary = `Review SHAP metrics below to identify which explicit macro factors are artificially raising the baseline risk.`
        }
        else if (moduleType === "incidents") {
            const high = data.high_severity || 0
            promptContext = `Threat Intel Feed Summary: ${high} Active HIGH SEVERITY Disruption Incidents.`
            if (high > 0) strategy = `CRITICAL: Immediate supply chain disruption alerts triggered. Establish emergency cross-functional task force to evaluate alternative supplier routing or pricing interventions.`
            else strategy = `No high-severity escalations globally. Maintain active geopolitical and macro-economic surveillance through standard channels.`
            secondary = `Distribute contingency plans to relevant regional general managers mapped to localized threats.`
        }

        if (!strategy) return "Market conditions currently stable."

        return `SYSTEM LOG — Zentai Open-AI Analytics Engine Activated.\n\nRunning diagnostic on module parameter [${moduleType.toUpperCase()}]...\n\n${promptContext}\n\n🎯 AI STRATEGIC SUGGESTION:\n${strategy}\n\n⚠️ SECONDARY ACTION:\n${secondary}`
    }

    useEffect(() => {
        setIsGenerating(true)
        setDisplayText('')
        const targetText = generateAiContext()
        let currentIndex = 0
        const interval = setInterval(() => {
            currentIndex += 2
            setDisplayText(targetText.slice(0, currentIndex))
            if (currentIndex >= targetText.length) {
                clearInterval(interval)
                setIsGenerating(false)
            }
        }, 12)
        return () => clearInterval(interval)
    }, [data, moduleType])

    return (
        <div style={{ marginTop: 24, padding: 16, background: '#1A0008', borderRadius: 8, border: '1px solid var(--scarlet)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>🧠</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--scarlet)', fontWeight: 700 }}>
                        ZENTAI FREE-AI ADVISORY
                    </span>
                </div>
                {isGenerating && (
                    <span style={{ fontSize: 10, color: '#fff', background: 'var(--scarlet)', padding: '2px 6px', borderRadius: 10, animation: 'pulse 1s infinite' }}>
                        GENERATING...
                    </span>
                )}
            </div>

            <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6,
                color: 'rgba(255,255,255,0.85)', minHeight: 90, whiteSpace: 'pre-wrap'
            }}>
                {displayText}
                {isGenerating && <span style={{ borderRight: '2px solid var(--scarlet)', animation: 'blink 1s infinite' }}>&nbsp;</span>}
            </div>

            <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
        </div>
    )
}
