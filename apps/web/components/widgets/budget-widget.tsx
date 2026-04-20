"use client"

import { useEffect, useState } from "react"
import { Sparkles, Check, X } from "lucide-react"

interface BudgetSuggestion {
  categoryId: string
  categoryName: string
  color: string
  currentAvgMonthly: number
  suggestedBudget: number
  reasoning: string
}

interface SavedBudget {
  id: string
  categoryId: string | null
  amount: number
  category: { id: string; name: string; color: string } | null
}

interface Props {
  currency: string
}

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(n)
}

export function BudgetWidget({ currency }: Props) {
  const [suggestions, setSuggestions] = useState<BudgetSuggestion[]>([])
  const [saved, setSaved] = useState<SavedBudget[]>([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState<string | null>(null)
  const [view, setView] = useState<"budgets" | "suggestions">("budgets")

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [budgetsRes, suggestionsRes] = await Promise.all([
        fetch("/api/budgets"),
        fetch("/api/ai/budget-suggestions"),
      ])
      if (budgetsRes.ok) setSaved(await budgetsRes.json())
      if (suggestionsRes.ok) setSuggestions(await suggestionsRes.json())
      setLoading(false)
    }
    load()
  }, [])

  async function acceptSuggestion(s: BudgetSuggestion) {
    setAccepting(s.categoryId)
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: s.categoryId, amount: s.suggestedBudget, aiSuggested: true }),
      })
      if (res.ok) {
        const budget: SavedBudget = await res.json()
        setSaved((prev) => {
          const filtered = prev.filter((b) => b.categoryId !== s.categoryId)
          return [...filtered, budget]
        })
      }
    } finally {
      setAccepting(null)
    }
  }

  async function removeBudget(id: string) {
    await fetch(`/api/budgets/${id}`, { method: "DELETE" })
    setSaved((prev) => prev.filter((b) => b.id !== id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const savedIds = new Set(saved.map((b) => b.categoryId))
  const pendingSuggestions = suggestions.filter((s) => !savedIds.has(s.categoryId))

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex gap-1.5">
        <button
          onClick={() => setView("budgets")}
          className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${view === "budgets" ? "bg-emerald-100 text-emerald-700" : "text-slate-500 hover:bg-slate-100"}`}
        >
          Active ({saved.length})
        </button>
        <button
          onClick={() => setView("suggestions")}
          className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${view === "suggestions" ? "bg-emerald-100 text-emerald-700" : "text-slate-500 hover:bg-slate-100"}`}
        >
          <Sparkles className="w-3 h-3" />
          AI Suggestions {pendingSuggestions.length > 0 && `(${pendingSuggestions.length})`}
        </button>
      </div>

      <div className="flex-1 overflow-auto space-y-2">
        {view === "budgets" && (
          <>
            {saved.length === 0 ? (
              <p className="text-sm text-slate-400 text-center pt-4">No budgets set. Accept AI suggestions to start.</p>
            ) : (
              saved.map((b) => (
                <div key={b.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2 h-2 rounded-full shrink-0 bg-emerald-500" />
                    <span className="text-xs text-slate-600 truncate">{b.category?.name ?? "Overall"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700 tabular-nums">{fmt(b.amount, currency)}/mo</span>
                    <button
                      onClick={() => removeBudget(b.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {view === "suggestions" && (
          <>
            {pendingSuggestions.length === 0 ? (
              <p className="text-sm text-slate-400 text-center pt-4">
                {suggestions.length === 0 ? "Upload more transactions to get AI budget suggestions." : "All suggestions accepted!"}
              </p>
            ) : (
              pendingSuggestions.map((s) => (
                <div key={s.categoryId} className="border border-slate-100 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-xs font-medium text-slate-700">{s.categoryName}</span>
                    </div>
                    <button
                      onClick={() => acceptSuggestion(s)}
                      disabled={accepting === s.categoryId}
                      className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2 py-0.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Check className="w-3 h-3" />
                      {accepting === s.categoryId ? "Saving…" : `${fmt(s.suggestedBudget, currency)}/mo`}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span>Avg: {fmt(s.currentAvgMonthly, currency)}</span>
                    <span>·</span>
                    <span className="truncate">{s.reasoning}</span>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  )
}
