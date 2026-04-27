"use client"

import { useState } from "react"
import { X, Loader2, Check } from "lucide-react"
import type { Category } from "./category-picker"

const CURRENCIES = [
  "USD","EUR","GBP","CHF","CAD","AUD","JPY","NOK","SEK","DKK","NZD","SGD","HKD","PLN",
]

const COLOR_CLASSES: Record<string, string> = {
  amber: "bg-amber-100 text-amber-700",
  blue: "bg-blue-100 text-blue-700",
  emerald: "bg-emerald-100 text-emerald-700",
  green: "bg-green-100 text-green-700",
  indigo: "bg-indigo-100 text-indigo-700",
  pink: "bg-pink-100 text-pink-700",
  rose: "bg-rose-100 text-rose-700",
  sky: "bg-sky-100 text-sky-700",
  slate: "bg-slate-100 text-slate-600",
  violet: "bg-violet-100 text-violet-700",
  zinc: "bg-zinc-100 text-zinc-600",
}

export interface EditableTransaction {
  id: string
  date: string | Date
  description: string
  merchantName: string | null
  amount: number
  currency: string
  type: string
  categoryId: string | null
  category: Category | null
  needsReview: boolean
  isDuplicate: boolean
}

interface Props {
  tx: EditableTransaction
  categories: Category[]
  onSave: (updated: EditableTransaction) => void
  onClose: () => void
}

export function EditTransactionModal({ tx, categories, onSave, onClose }: Props) {
  const [date, setDate] = useState(() =>
    new Date(tx.date instanceof Date ? tx.date : new Date(tx.date)).toISOString().slice(0, 10)
  )
  const [merchantName, setMerchantName] = useState(tx.merchantName ?? "")
  const [description, setDescription] = useState(tx.description)
  const [amount, setAmount] = useState(String(tx.amount))
  const [type, setType] = useState<"debit" | "credit">(tx.type as "debit" | "credit")
  const [currency, setCurrency] = useState(tx.currency)
  const [categoryId, setCategoryId] = useState<string | null>(tx.categoryId)
  const [needsReview, setNeedsReview] = useState(tx.needsReview)
  const [isDuplicate, setIsDuplicate] = useState(tx.isDuplicate)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const selectedCategory = categories.find((c) => c.id === categoryId) ?? null

  async function save() {
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be a positive number")
      return
    }
    if (!date) {
      setError("Date is required")
      return
    }
    if (!description.trim()) {
      setError("Description is required")
      return
    }

    setSaving(true)
    setError("")

    const res = await fetch(`/api/transactions/${tx.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        merchantName: merchantName.trim() || null,
        description: description.trim(),
        amount: parsedAmount,
        type,
        currency,
        categoryId,
        needsReview,
        isDuplicate,
      }),
    })

    setSaving(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError((data as { error?: string }).error ?? "Failed to save")
      return
    }

    onSave({
      ...tx,
      date,
      merchantName: merchantName.trim() || null,
      description: description.trim(),
      amount: parsedAmount,
      type,
      currency,
      categoryId,
      category: selectedCategory,
      needsReview,
      isDuplicate,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800">Edit Transaction</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* Type toggle */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Type</label>
            <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5 w-fit">
              {(["debit", "credit"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    type === t
                      ? t === "debit"
                        ? "bg-white text-slate-800 shadow-sm"
                        : "bg-white text-emerald-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {t === "debit" ? "Expense" : "Income"}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>

          {/* Merchant */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Merchant name</label>
            <input
              type="text"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              placeholder="e.g. Starbucks"
              maxLength={200}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Original bank description"
              maxLength={500}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>

          {/* Amount + Currency */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Amount</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>
            <div className="w-28">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Category</label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setCategoryId(null)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                  categoryId === null
                    ? "bg-slate-200 text-slate-700 border-slate-300"
                    : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                }`}
              >
                Uncategorized
              </button>
              {categories.map((cat) => {
                const pillClass = COLOR_CLASSES[cat.color] ?? "bg-slate-100 text-slate-600"
                const active = categoryId === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                      active
                        ? `${pillClass} border-transparent ring-2 ring-offset-1 ring-emerald-400`
                        : `${pillClass} border-transparent opacity-60 hover:opacity-100`
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Flags */}
          <div className="flex items-center gap-5 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={needsReview}
                onChange={(e) => setNeedsReview(e.target.checked)}
                className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
              />
              <span className="text-xs font-medium text-slate-600">Needs review</span>
            </label>
            {tx.isDuplicate && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isDuplicate}
                  onChange={(e) => setIsDuplicate(e.target.checked)}
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-600">Possible duplicate</span>
              </label>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-60 transition-colors"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Save changes
          </button>
        </div>
      </div>
    </div>
  )
}
