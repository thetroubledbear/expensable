"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, X } from "lucide-react"
import type { SpendingPrediction } from "@/app/api/insights/predictions/route"

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(n)
}

export function SpendingAlerts({ currency }: { currency: string }) {
  const [alerts, setAlerts] = useState<SpendingPrediction[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Load previously dismissed alerts from sessionStorage
    try {
      const raw = sessionStorage.getItem("dismissed-alerts")
      if (raw) setDismissed(new Set(JSON.parse(raw)))
    } catch {}

    fetch("/api/insights/predictions")
      .then((r) => r.json())
      .then((data: SpendingPrediction[]) => setAlerts(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  function dismiss(category: string) {
    setDismissed((prev) => {
      const next = new Set(prev).add(category)
      try { sessionStorage.setItem("dismissed-alerts", JSON.stringify(Array.from(next))) } catch {}
      return next
    })
  }

  const visible = alerts.filter((a) => !dismissed.has(a.category))
  if (!loaded || visible.length === 0) return null

  return (
    <div className="mb-4 space-y-2">
      {visible.map((alert) => (
        <div
          key={alert.category}
          className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3"
        >
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 flex-1">
            <span className="font-semibold">{alert.category}:</span>{" "}
            at this pace you&apos;ll spend{" "}
            <span className="font-semibold">{fmt(alert.projected, currency)}</span> this month
            {" "}— {alert.overagePct}% more than last month ({fmt(alert.lastMonth, currency)}).
            {alert.daysLeft > 0 && (
              <> {alert.daysLeft} day{alert.daysLeft !== 1 ? "s" : ""} left.</>
            )}
          </p>
          <button
            onClick={() => dismiss(alert.category)}
            className="text-amber-400 hover:text-amber-600 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
