"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, Loader2, Plus } from "lucide-react"

interface Category {
  id: string
  name: string
  icon: string
  color: string
}

interface Props {
  categories: Category[]
  defaultCurrency: string
}

const CURRENCIES = ["USD","EUR","GBP","CHF","CAD","AUD","JPY","NOK","SEK","DKK","NZD","SGD","HKD"]

const inputCls =
  "w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition bg-white"

function todayStr() {
  return new Date().toISOString().split("T")[0]
}

export function AddTransactionModal({ categories, defaultCurrency }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [type, setType] = useState<"debit" | "credit">("debit")
  const router = useRouter()
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const body = {
      date: form.get("date") as string,
      description: (form.get("description") as string).trim(),
      merchantName: (form.get("merchantName") as string).trim() || null,
      amount: parseFloat(form.get("amount") as string),
      type,
      currency: form.get("currency") as string,
      categoryId: (form.get("categoryId") as string) || null,
    }

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? "Failed to save transaction")
      setLoading(false)
      return
    }

    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add transaction
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

          {/* Modal */}
          <div
            ref={dialogRef}
            className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">Add transaction</h2>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Type toggle */}
              <div className="flex rounded-xl overflow-hidden border border-slate-200">
                <button
                  type="button"
                  onClick={() => setType("debit")}
                  className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                    type === "debit"
                      ? "bg-red-50 text-red-600 border-r border-slate-200"
                      : "text-slate-400 hover:text-slate-600 border-r border-slate-200"
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setType("credit")}
                  className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                    type === "credit"
                      ? "bg-emerald-50 text-emerald-600"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Income
                </button>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Date</label>
                <input
                  name="date"
                  type="date"
                  required
                  defaultValue={todayStr()}
                  className={inputCls}
                />
              </div>

              {/* Merchant */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  Merchant <span className="text-slate-300">(optional)</span>
                </label>
                <input
                  name="merchantName"
                  type="text"
                  placeholder="e.g. Netflix, Whole Foods"
                  maxLength={200}
                  className={inputCls}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Description</label>
                <input
                  name="description"
                  type="text"
                  required
                  placeholder="What was this for?"
                  maxLength={500}
                  className={inputCls}
                />
              </div>

              {/* Amount + Currency */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Amount</label>
                  <input
                    name="amount"
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    className={inputCls}
                  />
                </div>
                <div className="w-28">
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Currency</label>
                  <select name="currency" defaultValue={defaultCurrency} className={inputCls}>
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category */}
              {categories.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">
                    Category <span className="text-slate-300">(optional)</span>
                  </label>
                  <select name="categoryId" className={inputCls}>
                    <option value="">No category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
