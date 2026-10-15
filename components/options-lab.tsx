"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Company } from "@/lib/companies";
import type { Quote } from "@/lib/types";
import { expirationProfit, optionResult, type OptionInputs } from "@/lib/options-lab";
import { useFeed } from "./use-feed";

type Contract = { symbol: string; strike: number; bid: number | null; ask: number | null; last_price: number | null; volume: number | null; open_interest: number | null; last_trade_at: string | null };
type Chain = { source: string; as_of: string; methodology: string; expirations: { expiration: string; calls: Contract[] }[]; fetched_at: string };
const dollars = (n: number | null) => n === null || !Number.isFinite(n) ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
const time = (value?: string | null) => value && !Number.isNaN(Date.parse(value)) ? new Date(value).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "unavailable";

export function OptionsLab({ company, quote, auto }: { company: Company; quote?: Quote; auto: boolean }) {
  const feed = useFeed<Chain>(`/api/analytics?section=options_chain&company=${company.key}`, 300000, auto);
  const [expiration, setExpiration] = useState("");
  const [longStrike, setLongStrike] = useState<number | "">("");
  const [longAsk, setLongAsk] = useState<number | "">("");
  const [shortStrike, setShortStrike] = useState<number | "">("");
  const [shortBid, setShortBid] = useState<number | "">("");
  const [contracts, setContracts] = useState(1);
  const [multiplier, setMultiplier] = useState(100);
  const [budget, setBudget] = useState(500);
  const [selected, setSelected] = useState<"long-call" | "bull-call-spread">("bull-call-spread");
  const [quoteOrigin, setQuoteOrigin] = useState("");
  const spot = quote?.price ?? 0;
  const input: OptionInputs = { spot, longStrike: Number(longStrike), longAsk: Number(longAsk), shortStrike: Number(shortStrike), shortBid: Number(shortBid), contracts, multiplier };
  const long = longStrike !== "" && longAsk !== "" ? optionResult("long-call", input) : null;
  const spread = shortStrike !== "" && shortBid !== "" && long ? optionResult("bull-call-spread", input) : null;
  const result = selected === "long-call" ? long : spread;
  const available = feed.data?.expirations || [];
  const activeExpiry = available.find(item => item.expiration === expiration) || available[0];
  const activeDate = activeExpiry?.expiration || expiration;
  const nearCalls = useMemo(() => activeExpiry?.calls.filter(row => row.ask !== null && row.ask > 0 || row.bid !== null && row.bid > 0)
    .sort((a, b) => Math.abs(a.strike - spot) - Math.abs(b.strike - spot)).slice(0, 12).sort((a, b) => a.strike - b.strike) || [], [activeExpiry, spot]);
  const points = useMemo(() => {
    if (!spot || !long) return [];
    const min = Math.max(0, Math.min(spot * .6, input.longStrike * .8));
    const max = Math.max(spot * 1.5, input.shortStrike * 1.15, long.breakEven * 1.2);
    return Array.from({ length: 61 }, (_, index) => {
      const price = min + (max - min) * index / 60;
      return { price: Number(price.toFixed(2)), longCall: expirationProfit("long-call", input, price), spread: spread ? expirationProfit("bull-call-spread", input, price) : null };
    });
  }, [spot, long, spread, input.longStrike, input.longAsk, input.shortStrike, input.shortBid, input.contracts, input.multiplier]);
  const choose = (leg: "long" | "short", row: Contract) => {
    if (leg === "long" && row.ask && row.ask > 0) { setLongStrike(row.strike); setLongAsk(row.ask); setQuoteOrigin(`Long ask from ${row.symbol}; last trade ${time(row.last_trade_at)}`); }
    if (leg === "short" && row.bid !== null && row.bid > 0) { setShortStrike(row.strike); setShortBid(row.bid); setQuoteOrigin(`Short bid from ${row.symbol}; last trade ${time(row.last_trade_at)}`); }
  };
  const setManual = (setter: (value: number | "") => void, value: string) => { setter(value === "" ? "" : Number(value)); setQuoteOrigin(""); };

  return <div className="options-lab stack">
    <section className="panel options-intro">
      <p className="eyebrow">DEFINED-RISK STRATEGY WORKSPACE</p>
      <h2>Understand the trade before the trade</h2>
      <p>Compare a long call with a debit call spread using your own budget. Public option quotes are reference snapshots and may be delayed. Zentai does not place trades or recommend a contract.</p>
      <div className="options-spot"><span>{company.ticker} observed share price</span><strong>{dollars(spot || null)}</strong><small>{quote ? `${quote.source} · ${time(quote.asOf)} · ${quote.feedLabel}` : "Price feed unavailable. Payoff analysis waits for an observed share price."}</small></div>
    </section>
    <section className="panel">
      <div className="panel-heading"><div><p className="eyebrow">PUBLIC OPTIONS CHAIN</p><h2>Choose an expiration and strikes</h2></div><button className="button" onClick={feed.refresh} disabled={feed.loading}>Refresh quotes</button></div>
      {feed.error && <p className="notice error" role="alert">{feed.error} Enter contract prices manually below.</p>}
      {feed.loading && !feed.data && <p className="loading" role="status">Loading available public contracts…</p>}
      {available.length > 0 && <><label className="options-expiry">Expiration <select value={activeDate} onChange={event => { setExpiration(event.target.value); setLongStrike(""); setLongAsk(""); setShortStrike(""); setShortBid(""); setQuoteOrigin(""); }}>{available.map(item => <option key={item.expiration} value={item.expiration}>{item.expiration}</option>)}</select></label>
        <div className="table-scroll"><table className="options-chain-table"><thead><tr><th>Call strike</th><th>Bid</th><th>Ask</th><th>Volume</th><th>Open interest</th><th>Last trade</th><th>Use quote</th></tr></thead><tbody>{nearCalls.map(row => <tr key={row.symbol}><td>{dollars(row.strike)}</td><td>{dollars(row.bid)}</td><td>{dollars(row.ask)}</td><td>{row.volume ?? "—"}</td><td>{row.open_interest ?? "—"}</td><td>{time(row.last_trade_at)}</td><td><div className="options-row-actions"><button disabled={!row.ask} onClick={() => choose("long", row)}>Buy at ask</button><button disabled={!row.bid} onClick={() => choose("short", row)}>Sell at bid</button></div></td></tr>)}</tbody></table></div>
        <p className="source">{feed.data?.source} · fetched {time(feed.data?.fetched_at)}. {feed.data?.methodology} Bid/ask can change before execution; the quoted legs are not guaranteed to fill together.</p></>}
      {!feed.loading && !available.length && <p className="note">No usable call quotes are available. You can still study a manual scenario below.</p>}
    </section>
    <section className="panel"><div className="panel-heading"><div><p className="eyebrow">EDITABLE SCENARIO</p><h2>Set the position and risk limit</h2></div></div>
      <div className="options-inputs">
        <label>Long call strike<input type="number" min="0.01" step="0.01" value={longStrike} onChange={e => setManual(setLongStrike, e.target.value)} /></label>
        <label>Long call ask / share<input type="number" min="0.01" step="0.01" value={longAsk} onChange={e => setManual(setLongAsk, e.target.value)} /></label>
        <label>Short call strike<input type="number" min="0.01" step="0.01" value={shortStrike} onChange={e => setManual(setShortStrike, e.target.value)} /></label>
        <label>Short call bid / share<input type="number" min="0" step="0.01" value={shortBid} onChange={e => setManual(setShortBid, e.target.value)} /></label>
        <label>Contracts<input type="number" min="1" step="1" value={contracts} onChange={e => setContracts(Number(e.target.value))} /></label>
        <label>Shares per contract<input type="number" min="1" step="1" value={multiplier} onChange={e => setMultiplier(Number(e.target.value))} /></label>
        <label>Maximum loss budget ($)<input type="number" min="1" step="1" value={budget} onChange={e => setBudget(Number(e.target.value))} /></label>
        <label>Manual expiration (if no chain)<input type="date" value={available.length ? activeDate : expiration} disabled={available.length > 0} onChange={e => setExpiration(e.target.value)} /></label>
      </div>
      <p className="source">{quoteOrigin ? `Most recently selected quote: ${quoteOrigin}. Other inputs may have been edited manually. ` : "Manual inputs are hypothetical, not live quotes. "}Confirm contract multiplier and expiration with your broker. Calculations exclude fees, slippage, early exercise, and assignment effects.</p>
    </section>
    <section className="panel"><div className="panel-heading"><div><p className="eyebrow">AT-EXPIRATION PAYOFF</p><h2>Compare cost, break-even, and upside</h2></div></div>
      <div className="options-strategies"><button className={selected === "long-call" ? "selected" : ""} onClick={() => setSelected("long-call")} aria-pressed={selected === "long-call"}><span>Long call</span><strong>{long ? dollars(long.maxLoss) : "Add a valid long call"}</strong><small>Maximum premium at risk · upside uncapped at expiration</small><em>Break-even {long ? dollars(long.breakEven) : "—"}</em></button><button className={selected === "bull-call-spread" ? "selected" : ""} onClick={() => setSelected("bull-call-spread")} aria-pressed={selected === "bull-call-spread"}><span>Debit call spread</span><strong>{spread ? dollars(spread.maxLoss) : "Add a valid higher short strike"}</strong><small>Maximum debit at risk · capped upside {spread ? dollars(spread.maxGain) : "—"}</small><em>Break-even {spread ? dollars(spread.breakEven) : "—"}</em></button></div>
      {result ? <><div className="options-result-grid"><div><span>Maximum loss</span><strong>{dollars(result.maxLoss)}</strong><small>{result.maxLoss > budget ? "Over your stated budget" : "Within your stated budget"}</small></div><div><span>At-expiry break-even</span><strong>{dollars(result.breakEven)}</strong><small>{spot ? `${((result.breakEven / spot - 1) * 100).toFixed(1)}% above observed share price` : "Price unavailable"}</small></div><div><span>Maximum gain</span><strong>{result.maxGain === null ? "Uncapped" : dollars(result.maxGain)}</strong><small>At expiration, before fees</small></div><div><span>Outlay vs share cost</span><strong>{result.capitalAtRiskPct.toFixed(1)}%</strong><small>Relative to buying {contracts * multiplier} shares; the entire option outlay can be lost</small></div></div>
        {result.maxLoss > budget && <p className="notice error" role="alert">The selected position exceeds your maximum loss budget by {dollars(result.maxLoss - budget)}. Reduce contracts or change the premium/strikes.</p>}
        <div className="options-chart" role="img" aria-label="At-expiration dollar profit and loss across possible share prices for a long call and debit call spread"><ResponsiveContainer width="100%" height="100%"><LineChart data={points} margin={{ top: 16, right: 24, left: 8, bottom: 12 }}><CartesianGrid stroke="var(--border)" strokeDasharray="3 5" /><XAxis dataKey="price" tickFormatter={value => `$${Number(value).toFixed(0)}`} tick={{ fill: "var(--muted)", fontSize: 11 }} /><YAxis tickFormatter={value => `$${Number(value).toFixed(0)}`} tick={{ fill: "var(--muted)", fontSize: 11 }} /><Tooltip contentStyle={{ background: "var(--panel)", border: "1px solid var(--border)", color: "var(--text)" }} formatter={value => dollars(Number(value))} labelFormatter={value => `Share price at expiry ${dollars(Number(value))}`} /><ReferenceLine y={0} stroke="var(--muted)" /><ReferenceLine x={spot} stroke="var(--accent)" strokeDasharray="4 4" /><Line name="Long call" type="linear" dataKey="longCall" stroke="var(--positive)" strokeWidth={3} dot={false} isAnimationActive={false} /><Line name="Debit call spread" type="linear" dataKey="spread" stroke="var(--purple)" strokeWidth={3} dot={false} isAnimationActive={false} /></LineChart></ResponsiveContainer></div>
        <div className="options-legend"><span><i /> Long call</span><span><i /> Debit call spread</span><small>Dashed vertical line: observed share price</small></div>
        <p className="source">At expiration: long call profit = max(share price − long strike, 0) − ask. Spread profit subtracts max(share price − short strike, 0) and uses the short bid to reduce cost. Each result is multiplied by contracts × shares per contract. The chart is a scenario, not a forecast.</p></> : <p className="note">Enter a positive long strike and ask. For a debit call spread, the short strike must be higher and its bid must be below the long ask; the net debit must be smaller than the strike width.</p>}
      <p className="options-risk-note">A small cash outlay can still be a 100% loss. Time decay, volatility changes, illiquid spreads, and early assignment can affect the position before expiration. This workspace does not estimate probability of profit or provide investment advice.</p>
    </section>
  </div>;
}
