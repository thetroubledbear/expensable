"use client"

import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, Sparkles } from "lucide-react"
import type { CategoryComparison } from "@/app/api/insights/spending-comparison/route"

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(n)
}

export function SpendingInsightsWidget({ currency }: { currency: string }) {
  const [data, setData] = useState<CategoryComparison[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/insights/spending-comparison")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 bg-slate-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-slate-400 text-center mt-4">
        Need two months of data for comparisons
      </p>
    )
  }

  return (
    <div className="space-y-2 overflow-y-auto h-full">
      {data.map((item) => (
        <div
          key={item.name}
          className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-slate-700 truncate font-medium">{item.name}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400">{fmt(item.thisMonth, currency)}</span>

            {item.direction === "new" && (
              <span className="flex items-center gap-1 text-xs font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" /> new
              </span>
            )}
            {item.direction === "gone" && (
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">gone</span>
            )}
            {item.changePct !== null && item.direction === "up" && (
              <span className="flex items-center gap-0.5 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                <TrendingUp className="w-3 h-3" />
                +{item.changePct}%
              </span>
            )}
            {item.changePct !== null && item.direction === "down" && (
              <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <TrendingDown className="w-3 h-3" />
                {item.changePct}%
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
