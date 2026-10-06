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
