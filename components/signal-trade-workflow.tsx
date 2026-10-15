"use client";

import { useEffect, useMemo, useState } from "react";
import type { Quote } from "@/lib/types";
import { signalHistory } from "@/lib/signal-map";
import { closedOptionPnl, watchedLevel } from "@/lib/signal-workflow";

export type ChainContract = { symbol: string; strike: number; bid: number | null; ask: number | null; last_price: number | null; volume: number | null; open_interest: number | null; last_trade_at: string | null };
export type OptionsChain = { source: string; as_of: string; methodology: string; expirations: { expiration: string; calls: ChainContract[]; puts: ChainContract[] }[]; fetched_at: string };
type JournalEntry = { id: string; savedAt: string; ticker: string; modelDate: string; score: number; side: "call" | "put"; contract: string; expiry: string; strike: number; chartLevel: number; premiumTrigger: number; askSnapshot: number; contracts: number; multiplier: number; budget: number; stop: number | null; target: number | null; status: "Watched" | "Invalidated" | "Closed"; entry: number | null; exit: number | null; pnl: number | null; outcomeDate: string; note: string };

const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
const storageKey = "zentai-signal-option-journal-v1";

export function SignalTradeWorkflow({ quote, chain, loading, error }: { quote?: Quote; chain: OptionsChain | null; loading?: boolean; error?: string | null }) {
  const timeline = useMemo(() => quote ? signalHistory(quote.history) : [], [quote]);
  const signal = timeline.at(-1);
  const setup = watchedLevel(timeline);
  const [expiry, setExpiry] = useState("");
  const [contractSymbol, setContractSymbol] = useState("");
  const [premiumTrigger, setPremiumTrigger] = useState<number | "">("");
  const [stop, setStop] = useState<number | "">("");
  const [target, setTarget] = useState<number | "">("");
  const [contracts, setContracts] = useState(1);
  const [multiplier, setMultiplier] = useState(100);
  const [budget, setBudget] = useState(500);
  const [status, setStatus] = useState<JournalEntry["status"]>("Watched");
  const [entry, setEntry] = useState<number | "">("");
  const [exit, setExit] = useState<number | "">("");
  const [outcomeDate, setOutcomeDate] = useState("");
  const [note, setNote] = useState("");
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [storageError, setStorageError] = useState("");

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (Array.isArray(stored)) setJournal(stored.filter(item => item && typeof item.id === "string" && typeof item.ticker === "string"));
    } catch { setStorageError("Saved research history could not be read in this browser."); }
  }, []);

  const activeExpiry = chain?.expirations.find(item => item.expiration === expiry) || chain?.expirations[0];
  const activeDate = activeExpiry?.expiration || "";
  const choices = useMemo(() => {
    if (!setup || !activeExpiry || !quote) return [];
    const rows = setup.side === "call" ? activeExpiry.calls : (activeExpiry.puts || []);
    return rows.filter(item => item.ask !== null && item.ask > 0 && item.symbol)
      .sort((a, b) => Math.abs(a.strike - quote.price) - Math.abs(b.strike - quote.price)).slice(0, 12)
      .sort((a, b) => a.strike - b.strike);
  }, [setup?.side, activeExpiry, quote?.price]);
  const contract = choices.find(item => item.symbol === contractSymbol);
  const ask = contract?.ask ?? 0;
  const maxLoss = ask * contracts * multiplier;
  const plannedStopLoss = stop !== "" && stop >= 0 && stop < ask ? (ask - stop) * contracts * multiplier : null;
  const pnl = status === "Closed" && entry !== "" && exit !== "" ? closedOptionPnl(entry, exit, contracts, multiplier) : null;
  const companyRecords = journal.filter(item => item.ticker === quote?.symbol);
  const validPlan = !!setup && !!signal && !!contract && premiumTrigger !== "" && premiumTrigger > 0
    && Number.isInteger(contracts) && contracts > 0 && Number.isInteger(multiplier) && multiplier > 0
    && budget > 0 && maxLoss <= budget && (stop === "" || stop >= 0 && stop < ask)
    && (target === "" || target > ask) && (status !== "Closed" || pnl !== null);

  const persist = (next: JournalEntry[]) => {
    try { localStorage.setItem(storageKey, JSON.stringify(next)); setJournal(next); setStorageError(""); }
    catch { setStorageError("Browser storage is unavailable; the research record was not saved."); }
  };
  const save = () => {
    if (!validPlan || !setup || !signal || !contract) return;
    const record: JournalEntry = { id: crypto.randomUUID(), savedAt: new Date().toISOString(), ticker: quote!.symbol,
      modelDate: signal.date, score: signal.score, side: setup.side, contract: contract.symbol, expiry: activeDate,
      strike: contract.strike, chartLevel: setup.level, premiumTrigger: Number(premiumTrigger), askSnapshot: ask,
      contracts, multiplier, budget, stop: stop === "" ? null : stop, target: target === "" ? null : target,
      status, entry: status === "Closed" ? Number(entry) : null, exit: status === "Closed" ? Number(exit) : null, pnl, outcomeDate, note: note.trim().slice(0, 240) };
    persist([record, ...journal].slice(0, 50));
  };

  return <section className="panel trade-workflow" id="signal-option-plan">
    <div className="panel-heading trade-workflow-heading"><div><p className="eyebrow">SIGNAL → CONTRACT → PLAN → OUTCOME</p><h2>Trace a setup without hiding the rules</h2></div><div className="trade-current-quote"><span>{quote?.symbol || "Company"} observed share price</span><strong>{quote ? money(quote.price) : "—"}</strong><small>{quote ? `${quote.source} · ${new Date(quote.asOf).toLocaleString()} · ${quote.feedLabel}` : "Price feed unavailable"}</small></div></div>
    <p className="source">A research journal, not an order ticket. The model uses daily closes and volume; public option quotes can be delayed. Zentai cannot verify a fill or monitor an intraday breakout.</p>
    {signal && setup ? <>
      <div className="trade-steps">
        <div><span>1 · Model</span><strong className={setup.side === "put" ? "bearish" : "bullish"}>{signal.state} {signal.score > 0 ? "+" : ""}{signal.score}/5</strong><small>{signal.date.slice(0, 10)} · {signal.factors.filter(item => item.contribution === (setup.side === "call" ? 1 : -1)).map(item => item.name).join(", ") || "No directional factor"}</small></div>
        <div title="The level uses only the ten observations before the latest close. It is a transparent price breakout rule, not an institutional order block."><span>2 · Chart level ⓘ</span><strong>{money(setup.level)}</strong><small>{setup.side === "call" ? "Highest" : "Lowest"} of ten prior closes. Latest {money(signal.close)} {setup.crossed ? "crossed it" : "has not crossed it"}.</small></div>
        <div><span>3 · Condition</span><strong>{setup.side === "call" ? "Close above" : "Close below"} level</strong><small>Watch the next completed daily close. A past crossing does not establish a new fill.</small></div>
      </div>
      <div className="trade-form">
        <label>Expiration<select value={activeDate} onChange={event => { setExpiry(event.target.value); setContractSymbol(""); }}>{chain?.expirations.map(item => <option key={item.expiration} value={item.expiration}>{item.expiration}</option>)}</select></label>
        <label>{setup.side === "call" ? "Call" : "Put"} contract<select value={contractSymbol} onChange={event => setContractSymbol(event.target.value)}><option value="">Select a quoted contract</option>{choices.map(item => <option key={item.symbol} value={item.symbol}>{money(item.strike)} {setup.side} · ask {money(item.ask!)} · {item.symbol}</option>)}</select></label>
        <label title="Set a premium level yourself; Zentai has no historical option-premium candles to derive one.">Option premium watch level ⓘ<input type="number" min="0.01" step="0.01" value={premiumTrigger} onChange={event => setPremiumTrigger(event.target.value === "" ? "" : Number(event.target.value))} placeholder="Set manually" /></label>
        <label>Maximum loss budget ($)<input type="number" min="1" step="1" value={budget} onChange={event => setBudget(Number(event.target.value))} /></label>
      </div>
      <details className="trade-advanced"><summary>Position size and exit levels</summary><div className="trade-form">
        <label>Contracts<input type="number" min="1" step="1" value={contracts} onChange={event => setContracts(Number(event.target.value))} /></label>
        <label>Shares per contract<input type="number" min="1" step="1" value={multiplier} onChange={event => setMultiplier(Number(event.target.value))} /></label>
        <label title="A planned exit price is not a guaranteed stop fill.">Planned option stop ($)<input type="number" min="0" step="0.01" value={stop} onChange={event => setStop(event.target.value === "" ? "" : Number(event.target.value))} placeholder="Optional" /></label>
        <label>Planned option target ($)<input type="number" min="0" step="0.01" value={target} onChange={event => setTarget(event.target.value === "" ? "" : Number(event.target.value))} placeholder="Optional" /></label>
      </div></details>
      <div className="trade-quote"><div><span>Quoted ask snapshot</span><strong>{contract ? money(ask) : "Choose a contract"}</strong><small>{contract?.symbol || "No contract selected"}</small></div><div><span>Entire premium at risk</span><strong>{contract ? money(maxLoss) : "—"}</strong><small>{contract && maxLoss > budget ? "Exceeds budget" : "Before fees and slippage"}</small></div><div><span>Planned stop loss</span><strong>{plannedStopLoss === null ? "—" : money(plannedStopLoss)}</strong><small>Could exceed this if the stop slips</small></div></div>
      {contract && <details className="trade-evidence"><summary>How this plan was reached</summary><p>Model: {signal.factors.map(item => `${item.name} ${item.contribution > 0 ? "+" : ""}${item.contribution} (${item.reading}; ${item.rule})`).join(" · ")}. Chart level: {money(setup.level)}, from ten completed observations before {signal.date.slice(0, 10)}. Contract: {contract.symbol}, strike {money(contract.strike)}, ask {money(ask)}, bid {contract.bid === null ? "unavailable" : money(contract.bid)}, last trade {contract.last_trade_at || "unavailable"}. Chain fetched {chain?.fetched_at || "unavailable"}; share quote observed {quote?.asOf || "unavailable"}.</p></details>}
      <div className="trade-journal-form"><label>Record outcome<select value={status} onChange={event => setStatus(event.target.value as JournalEntry["status"])}><option>Watched</option><option>Invalidated</option><option>Closed</option></select></label>{status === "Closed" && <><label>Actual entry premium ($)<input type="number" min="0" step="0.01" value={entry} onChange={event => setEntry(event.target.value === "" ? "" : Number(event.target.value))} /></label><label>Actual exit premium ($)<input type="number" min="0" step="0.01" value={exit} onChange={event => setExit(event.target.value === "" ? "" : Number(event.target.value))} /></label></>}<label>Outcome date<input type="date" value={outcomeDate} onChange={event => setOutcomeDate(event.target.value)} /></label><label>What happened?<input maxLength={240} value={note} onChange={event => setNote(event.target.value)} placeholder="Optional note" /></label><button className="button" disabled={!validPlan} onClick={save}>Save research record</button></div>
      {status === "Closed" && pnl !== null && <p className="source">Recorded gross P/L: {money(pnl)} = (exit premium − entry premium) × {contracts} contract(s) × {multiplier} shares. Excludes fees, slippage, and taxes.</p>}
      {!choices.length && <p className="note">{loading ? "Loading public option quotes…" : error ? `Public option quotes are unavailable: ${error}` : `No quoted ${setup.side} contracts are available for this expiration.`} A contract plan requires a current quoted ask.</p>}
      <p className="source">Entry requires your chart condition and chosen option premium level to be checked with current broker data. The newest price observation may be incomplete until the daily close. The quoted ask is a snapshot, not a fill. A stop is a plan, not a loss cap; the full premium can be lost.</p>
    </> : <p className="note">{signal ? "The current model state is mixed, so there is no directional option setup to journal." : "At least 40 valid daily observations are needed to calculate a model state and a prior ten-close breakout level."}</p>}
    <div className="trade-history"><h3>Research history on this device</h3>{storageError && <p className="notice error" role="alert">{storageError}</p>}{companyRecords.length ? companyRecords.slice(0, 8).map(item => <div key={item.id} className="trade-history-row"><div><strong>{item.status} · {item.ticker} {item.expiry} {money(item.strike)} {item.side}</strong><small>Saved {new Date(item.savedAt).toLocaleString()} · model {item.score > 0 ? "+" : ""}{item.score} on {item.modelDate.slice(0, 10)} · chart {money(item.chartLevel)} · premium level {money(item.premiumTrigger)}</small><small>Ask snapshot {money(item.askSnapshot)} · maximum premium {money(item.askSnapshot * item.contracts * item.multiplier)}{item.pnl !== null ? ` · manually recorded gross P/L ${money(item.pnl)}` : ""}{item.outcomeDate ? ` · outcome ${item.outcomeDate}` : ""}</small>{item.note && <small>{item.note}</small>}</div><button aria-label={`Remove ${item.contract} research record`} onClick={() => persist(journal.filter(record => record.id !== item.id))}>Remove</button></div>) : <p className="source">No records saved for this company. Records stay in this browser; clearing its storage removes them.</p>}</div>
  </section>;
}
