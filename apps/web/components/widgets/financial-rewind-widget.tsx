"use client"

import { useState, useEffect } from "react"

interface RewindScenario {
  label: string
  savedAmount: number
  currency: string
  period: string
  type: "cut" | "daily" | "savings"
}

type RewindData = RewindScenario[]

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function SkeletonRow() {
  return (
    <div className="flex items-start justify-between gap-4 py-3 px-3 border-l-2 border-emerald-200 animate-pulse">
      <div className="flex-1">
        <div className="h-4 bg-slate-200 rounded-full w-3/4" />
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <div className="h-5 bg-slate-200 rounded w-20" />
        <div className="h-3 bg-slate-100 rounded w-16" />
      </div>
    </div>
  )
}

export function FinancialRewindWidget() {
  const [data, setData] = useState<RewindData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRewindData() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch("/api/insights/rewind")
        if (!res.ok) {
          throw new Error("Failed to fetch rewind data")
        }
        const rewindData = await res.json()
        setData(rewindData && rewindData.length > 0 ? rewindData : null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    fetchRewindData()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <p className="text-xs italic text-slate-500 mb-4">
          💡 What could have been...
        </p>
        <div className="space-y-1 flex-1">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </div>
    )
  }

  if (error || !data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-slate-400">
          Upload more transactions to unlock rewind insights.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <p className="text-xs italic text-slate-500 mb-4">
        💡 What could have been...
      </p>
      <div className="space-y-1 flex-1 overflow-auto">
        {data.map((scenario, idx) => (
          <div
            key={idx}
            className="flex items-start justify-between gap-4 py-3 px-3 border-l-2 border-emerald-200 hover:bg-emerald-50 transition-colors rounded-r-sm"
          >
            <span className="text-sm text-slate-700 flex-1 line-clamp-2">
              {scenario.label}
            </span>
            <div className="flex flex-col items-end gap-0.5 shrink-0">
              <span className="text-base font-bold text-emerald-600 tabular-nums">
                {formatAmount(scenario.savedAmount, scenario.currency)}
              </span>
              <span className="text-xs text-slate-400">
                {scenario.period}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
