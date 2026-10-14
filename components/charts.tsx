"use client";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Line,
  LineChart,
  BarChart,
  Bar,
  Legend,
  ReferenceLine,
  ReferenceDot,
} from "recharts";
const axis = {
  stroke: "var(--border)",
  tick: { fill: "var(--muted)", fontSize: 11 },
  tickLine: false,
  axisLine: false,
};
const tooltip = {
  contentStyle: {
    background: "var(--panel)",
    border: "1px solid var(--border)",
    borderRadius: 14,
    color: "var(--text)",
  },
  labelStyle: { color: "var(--muted)" },
};
export function PriceChart({
  data,
}: {
  data: { date: string; close: number }[];
}) {
  return (
    <div
      className="chart"
      role="img"
      aria-label="Historical closing price chart"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 20, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="var(--border)"
            strokeDasharray="3 5"
          />
          <XAxis
            dataKey="date"
            {...axis}
            minTickGap={70}
            tickFormatter={(d) =>
              new Date(d).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            }
          />
          <YAxis
            {...axis}
            orientation="right"
            domain={["auto", "auto"]}
            tickFormatter={(v) => Number(v).toFixed(0)}
            width={48}
          />
          <Tooltip
            {...tooltip}
            labelFormatter={(d) => new Date(String(d)).toLocaleDateString()}
            formatter={(v) => [Number(v).toFixed(2), "Close"]}
          />
          <Area
            dataKey="close"
            type="monotone"
            stroke="var(--accent)"
            strokeWidth={2}
            fill="url(#priceFill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
export function ValuationHistoryChart({ data, lines, newsMarkers = [], filingMarkers = [], eventNotes = [], selectedNewsDate }: {
  data: { date: string; close: number }[];
  lines: { name: string; value: number; color: string }[];
  newsMarkers?: { date: string; close: number; important: boolean }[];
  filingMarkers?: { date: string; close: number }[];
  eventNotes?: { date: string; title: string; kind: "news" | "filing" }[];
  selectedNewsDate?: string | null;
}) {
  const values = [...data.map(point => point.close), ...lines.map(line => line.value)].filter(value => Number.isFinite(value) && value > 0);
  const low = Math.min(...values), high = Math.max(...values);
  const padding = Math.max((high - low) * .08, high * .03);
  return <div className="valuation-history-chart" role="img" aria-label="Historical closing prices, dated news markers, and today's selected valuation reference levels">
    <ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ top: 15, right: 18, left: 0, bottom: 0 }}>
      <defs><linearGradient id="valuationPriceFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity={.25} /><stop offset="100%" stopColor="var(--accent)" stopOpacity={0} /></linearGradient></defs>
      <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 5" />
      <XAxis dataKey="date" {...axis} minTickGap={65} tickFormatter={date => new Date(date).toLocaleDateString("en-US", { month: "short", year: "2-digit" })} />
      <YAxis {...axis} orientation="right" domain={[Math.max(0, low - padding), high + padding]} tickFormatter={value => `$${Number(value).toFixed(0)}`} width={56} />
      <Tooltip content={({ active, label, payload }) => {
        if (!active || !payload?.length) return null;
        const notes = eventNotes.filter(note => note.date === String(label));
        return <div className="history-chart-tooltip" role="tooltip">
          <strong>{new Date(String(label)).toLocaleDateString("en-US", { dateStyle: "medium" })}</strong>
          <span>Observed price: ${Number(payload[0].value).toFixed(2)}</span>
          {notes.slice(0, 3).map((note, index) => <span key={`${note.kind}-${index}`} className={note.kind === "filing" ? "filing" : ""}>{note.kind === "filing" ? "SEC filing" : "Headline"}: {note.title}</span>)}
          {notes.length > 3 && <small>+{notes.length - 3} more source events below</small>}
        </div>;
      }} />
      <Area dataKey="close" type="monotone" stroke="var(--accent)" strokeWidth={2.5} fill="url(#valuationPriceFill)" isAnimationActive={false} />
      {lines.map(line => <ReferenceLine key={line.name} y={line.value} stroke={line.color} strokeWidth={2} strokeDasharray="6 5" />)}
      {selectedNewsDate && <ReferenceLine x={selectedNewsDate} stroke="var(--red)" strokeDasharray="3 4" strokeWidth={1.5} />}
      {newsMarkers.map(marker => <ReferenceDot key={marker.date} x={marker.date} y={marker.close} r={marker.date === selectedNewsDate ? 7 : 5} fill={marker.important ? "var(--red)" : "var(--accent)"} stroke="var(--panel)" strokeWidth={2} />)}
      {filingMarkers.map(marker => <ReferenceDot key={`filing-${marker.date}`} x={marker.date} y={marker.close} r={4} fill="var(--warning)" stroke="var(--panel)" strokeWidth={2} />)}
    </AreaChart></ResponsiveContainer>
  </div>;
}
export function Lines({
  data,
  keys,
}: {
  data: Record<string, any>[];
  keys: string[];
}) {
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="date"
            {...axis}
            minTickGap={80}
            tickFormatter={(v) => String(v).slice(0, 10)}
          />
          <YAxis {...axis} domain={["auto", "auto"]} />
          <Tooltip {...tooltip} />
          <Legend />
          {keys.map((k, i) => (
            <Line
              key={k}
              type="monotone"
              dataKey={k}
              stroke={["var(--accent)", "var(--positive)", "var(--purple)"][i]}
              strokeDasharray={i === 1 ? "6 4" : i === 2 ? "2 3" : undefined}
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
export function FinancialChart({ data }: { data: Record<string, any>[] }) {
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="period"
            {...axis}
            tickFormatter={(v) => String(v).slice(0, 7)}
          />
          <YAxis
            {...axis}
            width={65}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}B`}
          />
          <Tooltip {...tooltip} />
          <Legend />
          <Bar
            dataKey="revenue_m"
            name="Revenue ($M)"
            fill="var(--accent)"
            isAnimationActive={false}
            radius={[6, 6, 0, 0]}
          />
          <Bar
            dataKey="net_income_m"
            name="Net income ($M)"
            fill="var(--positive)"
            isAnimationActive={false}
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
