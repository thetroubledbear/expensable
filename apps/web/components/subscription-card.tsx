"use client"

import { useState, useRef } from "react"
import { Calendar, X, Undo2 } from "lucide-react"

const FREQ_LABEL = { monthly: "/mo", weekly: "/wk", annual: "/yr" } as const
const FREQ_BADGE = { monthly: "Monthly", weekly: "Weekly", annual: "Annual" } as const

interface Props {
  id: string
  merchantName: string
  amount: number
  currency: string
  frequency: "monthly" | "weekly" | "annual"
  lastSeenAt: string
  estimatedAnnual: number
  isOwner: boolean
}

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function SubscriptionCard({
  id,
  merchantName,
  amount,
  currency,
  frequency,
  lastSeenAt,
  estimatedAnnual,
  isOwner,
}: Props) {
  const [dismissed, setDismissed] = useState(false)
  const [undoPending, setUndoPending] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function dismiss() {
    setUndoPending(true)
    setCountdown(5)

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1))
    }, 1000)

    timerRef.current = setTimeout(async () => {
      clearInterval(intervalRef.current!)
      setUndoPending(false)
      setDismissed(true)
      await fetch(`/api/subscriptions/${id}`, { method: "DELETE" })
    }, 5000)
  }

  function handleUndo() {
    clearTimeout(timerRef.current!)
    clearInterval(intervalRef.current!)
    setUndoPending(false)
  }

  if (dismissed) return null

  if (undoPending) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center justify-between gap-3">
        <span className="text-sm text-slate-500 min-w-0 truncate">
          <span className="font-medium text-slate-700">{merchantName}</span> dismissed
        </span>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleUndo}
            className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
            Undo
          </button>
          <span className="text-xs text-slate-400 tabular-nums w-5 text-right">{countdown}s</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 mr-2">
          <p className="font-semibold text-slate-900 truncate">{merchantName}</p>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 mt-1">
            {FREQ_BADGE[frequency]}
          </span>
        </div>
        {isOwner && (
          <button
            onClick={dismiss}
            className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">
            {fmt(amount, currency)}
            <span className="text-sm font-normal text-slate-400 ml-1">
              {FREQ_LABEL[frequency]}
            </span>
          </p>
          <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
            {fmt(estimatedAnnual, currency)}/yr
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Calendar className="w-3 h-3" />
          {new Date(lastSeenAt).toLocaleDateString("en", { month: "short", day: "numeric" })}
        </div>
      </div>
    </div>
  )
}
