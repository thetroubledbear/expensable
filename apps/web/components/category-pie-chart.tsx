"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"

interface CategoryData {
  name: string
  color: string
  total: number
}

interface Props {
  data: CategoryData[]
  currency: string
}

function formatAmount(v: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(v)
}

export function CategoryPieChart({ data, currency }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-sm text-slate-400">
        No data this month
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={2}
          dataKey="total"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v) => formatAmount(v as number, currency)}
          contentStyle={{
            borderRadius: "0.75rem",
            border: "1px solid #f1f5f9",
            fontSize: 12,
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
