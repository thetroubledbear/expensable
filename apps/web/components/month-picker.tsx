"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Props {
  selectedMonth: string // YYYY-MM
}

export function MonthPicker({ selectedMonth }: Props) {
  const router = useRouter()

  const [year, month] = selectedMonth.split("-").map(Number)

  const now = new Date()
  const nowKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const isCurrentMonth = selectedMonth === nowKey

  function navigate(delta: number) {
    const d = new Date(year, month - 1 + delta, 1)
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    if (next > nowKey) return
    router.push(`/dashboard?month=${next}`)
  }

  const displayName = new Date(year, month - 1, 1).toLocaleString("en", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => navigate(-1)}
        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        aria-label="Previous month"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm font-medium text-slate-700 min-w-[130px] text-center tabular-nums">
        {displayName}
      </span>
      <button
        onClick={() => navigate(1)}
        disabled={isCurrentMonth}
        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Next month"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
      {!isCurrentMonth && (
        <button
          onClick={() => router.push("/dashboard")}
          className="ml-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
        >
          Today
        </button>
      )}
    </div>
  )
}
