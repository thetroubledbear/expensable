"use client"

import { useEffect, useState } from "react"
import { Sparkles, RefreshCw, WifiOff } from "lucide-react"

interface InsightsResponse {
  insights: string[]
  available: boolean
  empty?: boolean
  error?: string
}

export function AIInsightsWidget() {
  const [state, setState] = useState<"loading" | "done" | "error" | "unavailable">("loading")
  const [insights, setInsights] = useState<string[]>([])

  async function load() {
    setState("loading")
    try {
      const res = await fetch("/api/insights/ai")
      const data: InsightsResponse = await res.json()

      if (!data.available) {
        setState("unavailable")
        return
      }
      if (data.empty || data.insights.length === 0) {
        setState("error")
        return
      }
      setInsights(data.insights)
      setState("done")
    } catch {
      setState("unavailable")
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (state === "loading") {
    return (
      <div className="flex flex-col gap-2.5 pt-1">
        {[80, 65, 90, 55].map((w, i) => (
          <div key={i} className="flex gap-2.5 items-start">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-200 mt-1.5 shrink-0 animate-pulse" />
            <div
              className="h-3.5 bg-slate-100 rounded animate-pulse"
              style={{ width: `${w}%` }}
            />
          </div>
        ))}
      </div>
    )
  }

  if (state === "unavailable") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-4">
        <WifiOff className="w-6 h-6 text-slate-300" />
        <p className="text-xs text-slate-400">
          Ollama not running.{" "}
          <code className="font-mono bg-slate-100 px-1 rounded text-xs">
            ollama serve
          </code>
        </p>
      </div>
    )
  }

  if (state === "error") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <p className="text-xs text-slate-400">Not enough data for insights yet</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <ul className="space-y-2.5 flex-1">
        {insights.map((insight, i) => (
          <li key={i} className="flex gap-2.5 items-start">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
            <p className="text-sm text-slate-700 leading-relaxed">{insight}</p>
          </li>
        ))}
      </ul>
      <button
        onClick={load}
        className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors self-start"
      >
        <RefreshCw className="w-3 h-3" />
        Regenerate
      </button>
    </div>
  )
}

export function AIInsightsWidgetHeader() {
  return (
    <div className="flex items-center gap-1.5">
      <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
      <span>AI Insights</span>
    </div>
  )
}
