import unittest
from unittest.mock import patch, MagicMock
import numpy as np
import pandas as pd
from api.analytics import execute, clean
from backend.data_generators.dcf_engine import get_intrinsic_value
from backend.data_generators.portfolio_optimizer import optimize_portfolio
from backend.data_generators.insider import get_insider_trading
from backend.data_generators.backtester import run_backtest
from backend.data_generators.financial import _compute_health_score, _find_row
from backend.data_generators.historical_parallel import get_historical_parallel
from backend.data_generators.ai_ensemble import get_ensemble_recommendation
from backend.data_generators.analyst_snapshot import credit_tier, get_analyst_snapshot
from backend.data_generators.sec_filings import _fact, get_sec_filing_snapshot
from backend.data_generators.options_flow import get_options_chain

class AccuracyTests(unittest.TestCase):
    def test_options_chain_keeps_bid_ask_and_trade_time(self):
        rows = pd.DataFrame([{'contractSymbol': 'AAPL261120C00340000', 'strike': 340.0,
                              'bid': 4.2, 'ask': 4.8, 'lastPrice': 4.5,
                              'volume': 12, 'openInterest': 300,
                              'lastTradeDate': pd.Timestamp('2026-10-14T15:30:00Z')},
                             {'contractSymbol': 'AAPL261120C00350000', 'strike': 350.0,
                              'bid': np.nan, 'ask': 2.8, 'lastPrice': 2.7,
                              'volume': np.nan, 'openInterest': 100,
                              'lastTradeDate': pd.Timestamp('2026-10-14T15:30:00Z')}])
        with patch('backend.data_generators.options_flow.yf.Ticker') as ticker:
            ticker.return_value.options = ['2026-11-20']
            ticker.return_value.option_chain.return_value.calls = rows
            ticker.return_value.option_chain.return_value.puts = pd.DataFrame([{'contractSymbol': 'AAPL261120P00340000', 'strike': 340.0,
                              'bid': 5.1, 'ask': 5.6, 'lastPrice': 5.3,
                              'volume': 8, 'openInterest': 90,
                              'lastTradeDate': pd.Timestamp('2026-10-14T15:45:00Z')}])
            result = get_options_chain('AAPL')
        self.assertEqual(result['expirations'][0]['calls'][0]['ask'], 4.8)
        self.assertIsNone(result['expirations'][0]['calls'][1]['bid'])
        self.assertIn('2026-10-14', result['expirations'][0]['calls'][0]['last_trade_at'])
        self.assertEqual(result['expirations'][0]['puts'][0]['symbol'], 'AAPL261120P00340000')
        self.assertEqual(result['expirations'][0]['puts'][0]['ask'], 5.6)
    def test_sec_facts_keep_period_and_original_concept(self):
        facts = {'us-gaap': {'NetIncomeLoss': {'units': {'USD': [
            {'form': '10-K', 'start': '2024-01-01', 'end': '2024-12-31', 'filed': '2025-02-01', 'val': 2e9, 'accn': 'a'},
            {'form': '10-Q', 'start': '2025-01-01', 'end': '2025-03-31', 'filed': '2025-04-10', 'val': 1e9, 'accn': 'b'},
        ]}}}}
        result = _fact(facts, ('NetIncomeLoss',), annual=True)
        self.assertEqual(result['value_m'], 2000)
        self.assertEqual(result['period_end'], '2024-12-31')
        self.assertEqual(result['concept'], 'us-gaap:NetIncomeLoss')
    def test_sec_adapter_abstains_without_declared_contact(self):
        with patch.dict('os.environ', {'SEC_USER_AGENT': ''}):
            self.assertEqual(get_sec_filing_snapshot('apple')['status'], 'not_configured')
    def test_filing_reconciliation_respects_fiscal_date_gap(self):
        financial = {'company': 'Apple', 'as_of': '2026-06-30',
                     'quarterly': [], 'latest_kpis': {'cash_m': 39544}}
        filing = {'status': 'available', 'facts': {'cash_m': {'value_m': 39544, 'period_end': '2026-06-27'}}, 'filings': []}
        with patch('backend.data_generators.analyst_snapshot.get_financials', return_value=financial), \
             patch('backend.data_generators.analyst_snapshot.get_intrinsic_value', return_value={'error': 'missing'}), \
             patch('backend.data_generators.analyst_snapshot.get_sec_filing_snapshot', return_value=filing):
            report = get_analyst_snapshot('apple')
        self.assertEqual(report['quality_checks'][0]['status'], 'aligned')
        self.assertIn('3-day period gap', report['quality_checks'][0]['detail'])
    def test_internal_credit_bands_and_abstention(self):
        statement = {
            'quarterly': [{'ebitda_m': 50, 'interest_expense_m': 5}] * 4,
            'latest_kpis': {'total_debt_m': 500, 'cash_m': 100, 'debt_to_assets': .4},
        }
        tier = credit_tier(statement, 'Technology')
        self.assertEqual(tier['grade'], 'BBB')
        self.assertEqual(tier['metrics']['ebitda_interest_coverage'], 10)
        statement['latest_kpis']['cash_m'] = 0
        self.assertEqual(credit_tier(statement, 'Technology')['grade'], 'BB')
        self.assertEqual(credit_tier(statement, 'Financials')['status'], 'not_applicable')
        statement['quarterly'] = statement['quarterly'][:3]
        self.assertEqual(credit_tier(statement, 'Technology')['status'], 'insufficient')
    def test_dcf_missing_inputs_never_invents_upside(self):
        with patch('backend.data_generators.dcf_engine.yf.Ticker') as ticker:
            ticker.return_value.info={'currentPrice':100}
            self.assertIn('error',get_intrinsic_value('AAPL'))
    def test_dcf_invalid_rates(self):
        self.assertIn('error',get_intrinsic_value('AAPL',discount_rate=.01,terminal_growth=.02))
    def test_portfolio_alignment_follows_symbol_labels(self):
        index=pd.bdate_range('2025-01-01',periods=150)
        x=np.arange(150)
        prices=pd.DataFrame({'MSFT':100*np.cumprod(1+.02*np.sin(x)), 'AAPL':100*np.cumprod(1+.005*np.sin(x))},index=index)
        with patch('backend.data_generators.portfolio_optimizer.yf.download',return_value={'Close':prices}):
            result=optimize_portfolio(['AAPL','MSFT'])
        self.assertNotIn('error',result)
        self.assertGreater(result['optimal_weights']['AAPL'],result['optimal_weights']['MSFT'])
        self.assertAlmostEqual(sum(result['dollar_allocations'].values()),10000,places=1)
    def test_missing_asset_does_not_silently_allocate(self):
        with patch('backend.data_generators.portfolio_optimizer.yf.download',return_value={'Close':pd.DataFrame({'AAPL':[1,2]})}):
            self.assertIn('error',optimize_portfolio(['AAPL','MSFT']))
    def test_insiders_normal_import_path(self):
        with patch('backend.data_generators.insider.yf.Ticker') as ticker:
            ticker.return_value.insider_transactions=pd.DataFrame([{'Insider':'Executive A','Position':'CEO','Text':'Purchase','Shares':20,'Value':2000,'Start Date':pd.Timestamp('2026-09-01')}])
            result=get_insider_trading('apple')
            self.assertEqual(result['transactions'][0]['action'],'BUY')
    def test_backtest_returns_contract_and_cost_reduces_return(self):
        index=pd.bdate_range('2024-01-01',periods=400)
        close=100+np.arange(400)*.02+10*np.sin(np.arange(400)/10)
        with patch('backend.data_generators.backtester.yf.Ticker') as ticker:
            ticker.return_value.history.side_effect=lambda **kw:pd.DataFrame({'Close':close},index=index)
            free=run_backtest('AAPL','MACD Momentum',cost_bps=0)
            cost=run_backtest('AAPL','MACD Momentum',cost_bps=10)
        self.assertNotIn('error',cost)
        self.assertGreater(free['strategy_return_pct'],cost['strategy_return_pct'])
        self.assertEqual(len(cost['dates']),len(cost['strategy_curve']))
        self.assertGreater(cost['trades_executed'],0)
    def test_missing_data_abstains(self):
        self.assertIsNone(_compute_health_score({},None,None)['composite'])
        with patch('backend.data_generators.ai_ensemble.get_risk_analytics',return_value={'error':'offline'}), patch('backend.data_generators.ai_ensemble.get_financials',return_value={}):
            self.assertEqual(get_ensemble_recommendation('apple')['consensus'],'INSUFFICIENT DATA')
    def test_historical_match_drops_incomplete_observations(self):
        index=pd.bdate_range('2023-01-01',periods=400)
        close=100+np.arange(400)*.03+4*np.sin(np.arange(400)/11)
        data=pd.DataFrame({k:close.copy() for k in ('Open','High','Low','Close')},index=index)
        data.index.name='Date'
        data.iloc[-1]=np.nan
        with patch('backend.data_generators.historical_parallel.yf.Ticker') as ticker:
            ticker.return_value.history.return_value=data
            result=get_historical_parallel('apple')
        self.assertNotIn('error',result)
        self.assertTrue(np.isfinite(result['correlation_score']))
        self.assertEqual(result['as_of'],str(index[-2])[:10])
    def test_statement_lookup_prefers_exact_accounting_line(self):
        frame=pd.DataFrame(index=['Net Income From Continuing Operations','Net Income'])
        self.assertEqual(_find_row(frame,['Net Income']),'Net Income')
    def test_api_validation_and_json_finiteness(self):
        with self.assertRaises(ValueError): execute({'company':'unknown'})
        with self.assertRaises(ValueError): execute({'section':'unknown'})
        self.assertIsNone(clean(float('nan')))
        self.assertEqual(clean(np.int64(3)),3)
if __name__=='__main__': unittest.main()
