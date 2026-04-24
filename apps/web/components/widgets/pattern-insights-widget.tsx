"use client"

import { useEffect, useState } from "react"
import { Calendar, Sun, Moon, TrendingUp, TrendingDown } from "lucide-react"

interface PatternData {
  weekendVsWeekday: {
    weekendAvgDaily: number
    weekdayAvgDaily: number
    diffPct: number
  } | null
  topDay: {
    day: string
    avgSpend: number
    vsAvgPct: number
  } | null
  quietDay: {
    day: string
    avgSpend: number
    vsAvgPct: number
  } | null
  currency: string
  monthsAnalyzed: number
}

interface PatternRow {
  id: string
  icon: React.ReactNode
  statement: string
  badge: string
  circleColor: string
}

function buildRows(data: PatternData): PatternRow[] {
  const rows: PatternRow[] = []

  if (data.weekendVsWeekday) {
    const icon = data.weekendVsWeekday.diffPct > 0 ? (
      <Sun className="w-4 h-4 text-white" />
    ) : (
      <Moon className="w-4 h-4 text-white" />
    )
    const circleColor = data.weekendVsWeekday.diffPct > 0 ? "bg-amber-500" : "bg-emerald-600"
    const statement =
      data.weekendVsWeekday.diffPct > 0
        ? `You spend ${Math.abs(data.weekendVsWeekday.diffPct)}% more on weekends`
        : `You spend ${Math.abs(data.weekendVsWeekday.diffPct)}% more on weekdays`

    rows.push({
      id: "weekend-vs-weekday",
      icon,
      statement,
      badge: `${Math.abs(data.weekendVsWeekday.diffPct)}%`,
      circleColor,
    })
  }

  if (data.topDay) {
    rows.push({
      id: "top-day",
      icon: <TrendingUp className="w-4 h-4 text-white" />,
      statement: `${data.topDay.day}s are your biggest spending day (+${data.topDay.vsAvgPct}% vs average)`,
      badge: `+${data.topDay.vsAvgPct}%`,
      circleColor: "bg-amber-500",
    })
  }

  if (data.quietDay) {
    rows.push({
      id: "quiet-day",
      icon: <TrendingDown className="w-4 h-4 text-white" />,
      statement: `${data.quietDay.day}s are your quietest day (${data.quietDay.vsAvgPct}% vs average)`,
      badge: `${data.quietDay.vsAvgPct}%`,
      circleColor: "bg-emerald-600",
    })
  }

  return rows
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 rounded-2xl p-3 bg-white">
      <div className="w-9 h-9 rounded-full bg-slate-100 animate-pulse shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="h-3.5 bg-slate-100 rounded animate-pulse w-3/4 mb-1" />
        <div className="h-2.5 bg-slate-50 rounded animate-pulse w-1/2" />
      </div>
      <div className="w-14 h-6 bg-slate-100 rounded-full animate-pulse shrink-0" />
    </div>
  )
}

export function PatternInsightsWidget() {
  const [data, setData] = useState<PatternData | null>(null)
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<PatternRow[]>([])

  useEffect(() => {
    fetch("/api/insights/patterns")
      .then((r) => r.json())
      .then((d: PatternData) => {
        setData(d)
        setRows(buildRows(d))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-3">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    )
  }

  if (!data || (data.monthsAnalyzed < 2 && !data.weekendVsWeekday && !data.topDay && !data.quietDay)) {
    return (
      <div className="flex items-center justify-center py-6">
        <p className="text-sm text-slate-500">Not enough data yet (need 2+ months)</p>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center py-6">
        <p className="text-sm text-slate-500">Not enough data yet (need 2+ months)</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div
          key={row.id}
          className="flex items-center gap-3 rounded-2xl p-3 bg-white hover:bg-slate-50 transition-colors"
        >
          <div className={`w-9 h-9 rounded-full ${row.circleColor} flex items-center justify-center shrink-0`}>
            {row.icon}
          </div>

          <p className="text-sm text-slate-700 flex-1 leading-snug">{row.statement}</p>

          <span className="inline-flex items-center justify-center min-w-fit px-2.5 py-1 rounded-full bg-emerald-50 text-xs font-semibold text-emerald-600 shrink-0">
            {row.badge}
          </span>
        </div>
      ))}
    </div>
  )
}
