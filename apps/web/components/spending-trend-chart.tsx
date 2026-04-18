"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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
      <BarChart data={data} barCategoryGap="30%" barGap={3}>
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
        <Tooltip
          formatter={(v, name) => [
            formatAmount(v as number, currency),
            name === "spent" ? "Spent" : "Received",
          ]}
          labelFormatter={(label) => formatMonth(String(label))}
          contentStyle={{
            borderRadius: "0.75rem",
            border: "1px solid #f1f5f9",
            fontSize: 12,
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
          }}
        />
        <Legend
          formatter={(v) => (v === "spent" ? "Spent" : "Received")}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
        />
        <Bar dataKey="spent" fill="#f87171" radius={[4, 4, 0, 0]} />
        <Bar dataKey="received" fill="#34d399" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
