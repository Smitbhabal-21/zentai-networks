export type OptionStrategy = "long-call" | "bull-call-spread";

export type OptionInputs = {
  spot: number;
  longStrike: number;
  longAsk: number;
  shortStrike: number;
  shortBid: number;
  contracts: number;
  multiplier: number;
};

export type OptionResult = {
  debitPerShare: number;
  maxLoss: number;
  maxGain: number | null;
  breakEven: number;
  capitalAtRiskPct: number;
};

export function optionResult(strategy: OptionStrategy, input: OptionInputs): OptionResult | null {
  const { spot, longStrike, longAsk, shortStrike, shortBid, contracts, multiplier } = input;
  if (![spot, longStrike, longAsk, shortStrike, shortBid, contracts, multiplier].every(Number.isFinite)
    || spot <= 0 || longStrike <= 0 || longAsk <= 0 || contracts < 1 || !Number.isInteger(contracts)
    || multiplier <= 0) return null;
  if (strategy === "bull-call-spread" && (shortStrike <= longStrike || shortBid < 0 || shortBid >= longAsk || longAsk - shortBid >= shortStrike - longStrike)) return null;
  const debitPerShare = strategy === "long-call" ? longAsk : longAsk - shortBid;
  const maxLoss = debitPerShare * multiplier * contracts;
  return {
    debitPerShare,
    maxLoss,
    maxGain: strategy === "long-call" ? null : (shortStrike - longStrike - debitPerShare) * multiplier * contracts,
    breakEven: longStrike + debitPerShare,
    capitalAtRiskPct: maxLoss / (spot * multiplier * contracts) * 100,
  };
}

export function expirationProfit(strategy: OptionStrategy, input: OptionInputs, underlyingAtExpiry: number): number | null {
  const result = optionResult(strategy, input);
  if (!result || !Number.isFinite(underlyingAtExpiry) || underlyingAtExpiry < 0) return null;
  const longValue = Math.max(0, underlyingAtExpiry - input.longStrike);
  const shortValue = strategy === "bull-call-spread" ? Math.max(0, underlyingAtExpiry - input.shortStrike) : 0;
  return (longValue - shortValue - result.debitPerShare) * input.multiplier * input.contracts;
}
