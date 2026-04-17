"use client"

import { useState } from "react"
import { Settings, Loader2, CheckCircle2 } from "lucide-react"

const CURRENCIES = [
  { code: "USD", label: "USD — US Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "CHF", label: "CHF — Swiss Franc" },
  { code: "CAD", label: "CAD — Canadian Dollar" },
  { code: "AUD", label: "AUD — Australian Dollar" },
  { code: "JPY", label: "JPY — Japanese Yen" },
  { code: "NOK", label: "NOK — Norwegian Krone" },
  { code: "SEK", label: "SEK — Swedish Krona" },
  { code: "DKK", label: "DKK — Danish Krone" },
  { code: "NZD", label: "NZD — New Zealand Dollar" },
  { code: "SGD", label: "SGD — Singapore Dollar" },
  { code: "HKD", label: "HKD — Hong Kong Dollar" },
]

interface Props {
  initialName: string
  initialCurrency: string
}

export function SettingsForm({ initialName, initialCurrency }: Props) {
  const [name, setName] = useState(initialName)
  const [currency, setCurrency] = useState(initialCurrency)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError("")

    const res = await fetch("/api/household", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() || initialName, defaultCurrency: currency }),
    })

    setSaving(false)

    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } else {
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? "Save failed")
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
          <Settings className="w-4 h-4 text-slate-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">Household</p>
          <p className="text-xs text-slate-400">Name and default currency</p>
        </div>
      </div>

      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            Household name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={128}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            Default currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition bg-white"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
          <p className="text-xs text-slate-400 mt-1.5">
            Used for displaying amounts across the dashboard
          </p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save changes"}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600">
              <CheckCircle2 className="w-4 h-4" /> Saved
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
