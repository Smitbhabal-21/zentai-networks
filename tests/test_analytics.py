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

class AccuracyTests(unittest.TestCase):
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
