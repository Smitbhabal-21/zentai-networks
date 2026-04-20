import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TickerTape from '../components/Layout/TickerTape'
import Sidebar from '../components/Layout/Sidebar'
import Header from '../components/Layout/Header'

// Import all panels
import GlobalMarketsPanel from '../components/GlobalMarkets/GlobalMarketsPanel'
import FinancialPanel from '../components/Financial/FinancialPanel'
import SupplyChainPanel from '../components/SupplyChain/SupplyChainPanel'
import RiskPanel from '../components/Risk/RiskPanel'
import IncidentFeedPanel from '../components/Incidents/IncidentFeedPanel'
import AboutPanel from '../components/About/AboutPanel'

import { api } from '../services/api'

// Keep static array consistent for iterating via sidebars
const COMPANIES_STATIC = [
    { key: 'citi', name: 'Citi Bank', tag: 'CITI' },
    { key: 'dhl', name: 'DHL Logistics', tag: 'DHL' },
    { key: 'mcd', name: 'McDonald\'s', tag: 'MCD' },
    { key: 'aapl', name: 'Apple Inc.', tag: 'AAPL' },
    { key: 'xom', name: 'ExxonMobil', tag: 'XOM' },
    { key: 'jnj', name: 'Johnson & Johnson', tag: 'JNJ' },
    { key: 'pg', name: 'Procter & Gamble', tag: 'P&G' },
    { key: 'ford', name: 'Ford Motor Co.', tag: 'FORD' },
    { key: 'att', name: 'AT&T', tag: 'AT&T' },
    { key: 'wmt', name: 'Walmart', tag: 'WMT' },
]

export default function Dashboard() {
    const [activeCompany, setActiveCompany] = useState('citi')
    const [activeModule, setActiveModule] = useState('overview')  // Default to global markets

    // Module data states
    const [marketData, setMarketData] = useState(null)
    const [financialData, setFinancialData] = useState(null)
    const [supplyData, setSupplyData] = useState(null)
    const [riskData, setRiskData] = useState(null)
    const [incidentData, setIncidentData] = useState(null)

    // Ticker globals
    const [allStocks, setAllStocks] = useState([])
    const [tickerMarkets, setTickerMarkets] = useState([])

    // Loading states
    const [loading, setLoading] = useState({
        overview: false, financial: false, supply: false, risk: false, incidents: false
    })
    const [error, setError] = useState(null)

    // Fetch specific module data
    const fetchModule = useCallback(async (module, co) => {
        setLoading(prev => ({ ...prev, [module]: true }))
        try {
            let res
            if (module === 'overview') {
                if (!marketData) res = await api.markets()
            }
            else if (module === 'financial') res = await api.financial(co)
            else if (module === 'supply') res = await api.supply(co)
            else if (module === 'risk') res = await api.risk(co)
            else if (module === 'incidents') res = await api.incidents(co)

            if (res && res.data) {
                if (module === 'overview') setMarketData(res.data)
                else if (module === 'financial') setFinancialData(res.data)
                else if (module === 'supply') setSupplyData(res.data)
                else if (module === 'risk') setRiskData(res.data)
                else if (module === 'incidents') setIncidentData(res.data)
            }
            setError(null)
        } catch (e) {
            console.error(e)
            setError(`Failed to load data for ${module}. Please ensure backend is running.`)
        } finally {
            setLoading(prev => ({ ...prev, [module]: false }))
        }
    }, [marketData])

    // Fetch global ticker data once on mount
    useEffect(() => {
        const fetchGlobalTickers = async () => {
            try {
                const [stocksRes, mktsRes] = await Promise.all([
                    Promise.all(COMPANIES_STATIC.map(c => api.stock(c.key, '5d').catch(() => null))),
                    api.markets().catch(() => null)
                ])

                setAllStocks(stocksRes.filter(Boolean).map(r => r.data))
                if (mktsRes && mktsRes.data && mktsRes.data.markets) {
                    setTickerMarkets(mktsRes.data.markets.filter(m => m.symbol.startsWith('^') || m.symbol.includes('=F')))
                }
            } catch (e) { }
        }
        fetchGlobalTickers()
    }, [])

    // Trigger fetch when active tab changes
    useEffect(() => {
        fetchModule(activeModule, activeCompany)
    }, [activeModule, activeCompany, fetchModule])

    const handleCompanyChange = (key) => {
        setActiveCompany(key)
        // Clear company-specific cache so we force a re-fetch for the new company
        setFinancialData(null)
        setSupplyData(null)
        setRiskData(null)
        setIncidentData(null)
        // if active module isn't relevant to company changing, shift back to an overview/financial
        if (activeModule === 'overview') {
            setActiveModule('financial') // 'overview' is identical for all companies, move user to company stats
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <TickerTape stockData={allStocks} globalData={tickerMarkets} incidentData={incidentData} />

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <Sidebar
                    activeModule={activeModule}
                    onModuleChange={setActiveModule}
                    activeCompany={activeCompany}
                    onCompanyChange={handleCompanyChange}
                />

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-root)' }}>
                    <Header
                        activeCompany={activeCompany}
                        activeModule={activeModule}
                        incidentCount={incidentData?.total_incidents || 0}
                    />

                    {error && (
                        <div style={{ background: 'var(--red-bg)', borderBottom: '1px solid rgba(204,0,51,0.2)', color: 'var(--scarlet)', fontSize: 12, padding: '10px 24px', flexShrink: 0, fontWeight: 500 }}>
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Main Content Area */}
                    <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`${activeCompany}-${activeModule}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.15 }}
                                style={{ height: '100%' }}
                            >
                                {activeModule === 'overview' && (
                                    <GlobalMarketsPanel data={marketData} loading={loading.overview} />
                                )}
                                {activeModule === 'financial' && (
                                    <FinancialPanel data={financialData} loading={loading.financial} />
                                )}
                                {activeModule === 'supply' && (
                                    <SupplyChainPanel data={supplyData} loading={loading.supply} />
                                )}
                                {activeModule === 'risk' && (
                                    <RiskPanel data={riskData} loading={loading.risk} />
                                )}
                                {activeModule === 'incidents' && (
                                    <IncidentFeedPanel data={incidentData} loading={loading.incidents} />
                                )}
                                {activeModule === 'about' && (
                                    <AboutPanel />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    )
}
