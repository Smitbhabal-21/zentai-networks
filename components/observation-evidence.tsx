import type { Quote } from "@/lib/types";
import { averageClose, priceWindow } from "@/lib/signal-map";

const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
const day = (value: string) => value.slice(0, 10);
const sourceUrl = (symbol: string) => `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}/history/`;

export function AverageObservationEvidence({ quote }: { quote: Quote }) {
  const long = priceWindow(quote.history, 30);
  const short = long.slice(-10);
  if (long.length < 30) return null;
  const minimum = Math.min(...long.map(point => point.close));
  const maximum = Math.max(...long.map(point => point.close));
  const plotHeight = (close: number) => 14 + (maximum === minimum ? 38 : (close - minimum) / (maximum - minimum) * 72);
  return <div className="observation-evidence">
    <div className="observation-heading"><div><p className="eyebrow">AVERAGE AUDIT</p><h3>Which observations made these lines?</h3><p>One observation is one valid dated daily close from the public chart feed. Weekends and market holidays have no trading observation. The latest point may still change before the session closes.</p></div><a href={sourceUrl(quote.symbol)} target="_blank" rel="noopener noreferrer">Yahoo Finance price history ↗</a></div>
    <div className="observation-math"><div><span>Last 10 observations</span><strong>{money(averageClose(short))}</strong><small>{day(short[0].date)} → {day(short[9].date)} · sum {money(short.reduce((sum, point) => sum + point.close, 0))} ÷ 10</small></div><div><span>Last 30 observations</span><strong>{money(averageClose(long))}</strong><small>{day(long[0].date)} → {day(long[29].date)} · sum {money(long.reduce((sum, point) => sum + point.close, 0))} ÷ 30</small></div></div>
    <p className="observation-purpose">The green last 10 points form the short average; all 30 points form the longer average. Comparing them smooths daily moves to describe trend, but neither average predicts the next price.</p>
    <div className="observation-plot" role="img" aria-label={`Thirty dated ${quote.symbol} closes from ${day(long[0].date)} to ${day(long[29].date)}, with the last ten highlighted`}><div className="observation-plot-axis"><span>{money(maximum)}</span><span>{money(minimum)}</span></div><div className="observation-plot-bars">{long.map((point, index) => <div key={`${point.date}-${index}`} className={`observation-plot-column ${index >= 20 ? "recent" : ""}`} title={`${day(point.date)}: ${money(point.close)}`}><span style={{ height: `${plotHeight(point.close)}%` }} /></div>)}</div></div>
    <div className="observation-plot-labels"><span>{day(long[0].date)}</span><span>last 10 highlighted</span><span>{day(long[29].date)}</span></div>
    <details className="observation-rows"><summary>See all 30 dated closes and reported volume</summary><div className="observation-table-wrap"><table><thead><tr><th>Session</th><th>Daily close</th><th>Reported volume</th><th>Average input</th></tr></thead><tbody>{long.map((point, index) => <tr key={`${point.date}-${index}`}><td>{day(point.date)}</td><td>{money(point.close)}</td><td>{point.volume === null ? "—" : new Intl.NumberFormat("en-US").format(point.volume)}</td><td>{index >= 20 ? "10 and 30" : "30"}</td></tr>)}</tbody></table></div></details>
    <p className="source">Source: {quote.source} historical chart closes for {quote.symbol}; quote observed {new Date(quote.asOf).toLocaleString()}, feed fetched {new Date(quote.fetchedAt).toLocaleString()}. {quote.feedLabel}. Chart timestamps are labeled by their provider date; check the linked history for corrections or corporate-action adjustments.</p>
  </div>;
}

export function BreakoutObservationEvidence({ quote, side, level }: { quote: Quote; side: "call" | "put"; level: number }) {
  const prior = priceWindow(quote.history, 10, 1);
  if (prior.length < 10) return null;
  const minimum = Math.min(...prior.map(point => point.close));
  const maximum = Math.max(...prior.map(point => point.close));
  return <details className="trade-evidence breakout-evidence"><summary>Inspect the 10 dated closes behind this chart level</summary><p>{side === "call" ? "Highest" : "Lowest"} of these ten prior closes = <strong>{money(level)}</strong>. The latest dated close ({day(priceWindow(quote.history, 1)[0].date)}) is excluded, so it cannot set its own breakout threshold. This is a simple price rule, not evidence of an institutional order block.</p><div className="breakout-observations">{prior.map((point, index) => <div key={`${point.date}-${index}`} className={point.close === level ? "level" : ""}><time dateTime={day(point.date)}>{day(point.date)}</time><span className="breakout-track"><i style={{ width: `${14 + (maximum === minimum ? 44 : (point.close - minimum) / (maximum - minimum) * 86)}%` }} /></span><strong>{money(point.close)}</strong>{point.close === level && <small>Level</small>}</div>)}</div><p className="source">Source: <a href={sourceUrl(quote.symbol)} target="_blank" rel="noopener noreferrer">Yahoo Finance price history ↗</a>. {quote.feedLabel}; fetched {new Date(quote.fetchedAt).toLocaleString()}. These are daily chart closes, not options trades or order-book data.</p></details>;
}
