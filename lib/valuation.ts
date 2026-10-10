export type ModelInputs = {
  freeCashFlowM: number;
  sharesM: number;
  growth: number;
  discount: number;
  terminal: number;
};

export function calculateDcf(input: ModelInputs) {
  const { freeCashFlowM, sharesM, growth, discount, terminal } = input;
  if (![freeCashFlowM, sharesM, growth, discount, terminal].every(Number.isFinite) ||
      freeCashFlowM <= 0 || sharesM <= 0 || growth < -.5 || growth > .5 ||
      discount <= terminal || discount <= 0 || discount > .5 || terminal < -.1 || terminal > .1) return null;
  const base = freeCashFlowM / sharesM;
  const years = Array.from({ length: 5 }, (_, i) => {
    const year = i + 1;
    const forecast = base * (1 + growth) ** year;
    const presentValue = forecast / (1 + discount) ** year;
    return { year, forecast, presentValue };
  });
  const terminalValue = years[4].forecast * (1 + terminal) / (discount - terminal);
  const terminalPresentValue = terminalValue / (1 + discount) ** 5;
  const value = years.reduce((sum, item) => sum + item.presentValue, 0) + terminalPresentValue;
  return { value, years, terminalPresentValue };
}
