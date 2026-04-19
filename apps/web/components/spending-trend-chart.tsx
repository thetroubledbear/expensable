"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface TrendPoint {
  month: string
  spent: number
  received: number
}

interface Props {
  data: TrendPoint[]
  currency: string
}

function formatMonth(month: string) {
  const [year, m] = month.split("-")
  return new Date(Number(year), Number(m) - 1, 1).toLocaleString("en", { month: "short" })
}

function formatAmount(v: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(v)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label, currency }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-md px-3.5 py-2.5 text-xs">
      <p className="font-semibold text-slate-500 mb-1.5">{formatMonth(String(label))}</p>
      {payload.map((p: { dataKey: string; value: number; color: string }) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-slate-500">{p.dataKey === "spent" ? "Spent" : "Income"}:</span>
          <span className="font-semibold text-slate-800 tabular-nums">{formatAmount(p.value, currency)}</span>
        </div>
      ))}
    </div>
  )
}

export function SpendingTrendChart({ data, currency }: Props) {
  if (data.every((d) => d.spent === 0 && d.received === 0)) {
    return (
      <div className="flex items-center justify-center h-[220px] text-sm text-slate-400">
        No transaction data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="gradSpent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f87171" stopOpacity={0.18} />
            <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradReceived" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#34d399" stopOpacity={0.18} />
            <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="month"
          tickFormatter={formatMonth}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => formatAmount(v, currency)}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          width={72}
        />
        <Tooltip content={<CustomTooltip currency={currency} />} />
        <Area
          type="monotone"
          dataKey="received"
          stroke="#34d399"
          strokeWidth={2}
          fill="url(#gradReceived)"
          dot={false}
          activeDot={{ r: 4, fill: "#34d399", strokeWidth: 0 }}
        />
        <Area
          type="monotone"
          dataKey="spent"
          stroke="#f87171"
          strokeWidth={2}
          fill="url(#gradSpent)"
          dot={false}
          activeDot={{ r: 4, fill: "#f87171", strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
