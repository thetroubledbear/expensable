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

  const total = data.reduce((a, d) => a + d.total, 0)

  return (
    <div className="flex flex-col h-full gap-3">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={78}
            paddingAngle={1}
            minAngle={3}
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
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 overflow-auto">
        {data.map((entry) => {
          const pct = total > 0 ? ((entry.total / total) * 100) : 0
          const displayPct = pct < 1 ? pct.toFixed(1) : Math.round(pct).toString()
          return (
            <div key={entry.name} className="flex items-center gap-1.5 min-w-0">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
              <span className="text-xs text-slate-500 truncate">{entry.name}</span>
              <span className="text-xs text-slate-400 tabular-nums">{displayPct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
