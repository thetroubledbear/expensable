"use client"

import { useEffect, useState } from "react"
import type { HealthScoreData } from "@/app/api/dashboard/health-score/route"

const GRADE_COLOR: Record<string, string> = {
  A: "text-emerald-600",
  B: "text-green-500",
  C: "text-amber-500",
  D: "text-orange-500",
  F: "text-red-500",
}

const GRADE_RING: Record<string, string> = {
  A: "stroke-emerald-500",
  B: "stroke-green-400",
  C: "stroke-amber-400",
  D: "stroke-orange-400",
  F: "stroke-red-500",
}

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const filled = (score / 100) * circ

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={128} height={128} className="-rotate-90">
        <circle cx={64} cy={64} r={r} fill="none" stroke="#f1f5f9" strokeWidth={10} />
        <circle
          cx={64} cy={64} r={r} fill="none" strokeWidth={10}
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
          className={`transition-all duration-700 ${GRADE_RING[grade] ?? "stroke-slate-400"}`}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-3xl font-bold leading-none ${GRADE_COLOR[grade] ?? "text-slate-700"}`}>
          {score}
        </span>
        <span className={`text-sm font-semibold mt-0.5 ${GRADE_COLOR[grade] ?? "text-slate-500"}`}>
          {grade}
        </span>
      </div>
    </div>
  )
}

function Bar({ pts, max, label }: { pts: number; max: number; label: string }) {
  const pct = Math.round((pts / max) * 100)
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span className="font-medium text-slate-700">{pts}/{max}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function HealthScoreWidget() {
  const [data, setData] = useState<HealthScoreData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard/health-score")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-24 h-24 rounded-full bg-slate-100 animate-pulse" />
      </div>
    )
  }

  if (!data) return <p className="text-sm text-slate-400 text-center mt-4">Unable to compute score</p>

  return (
    <div className="flex flex-col items-center gap-5 h-full justify-center">
      <ScoreRing score={data.score} grade={data.grade} />
      <div className="w-full space-y-2.5 max-w-xs">
        {Object.values(data.breakdown).map((b) => (
          <Bar key={b.label} pts={b.pts} max={b.max} label={b.label} />
        ))}
      </div>
    </div>
  )
}
