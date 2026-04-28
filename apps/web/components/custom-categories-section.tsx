"use client"

import { useState } from "react"
import { Plus, X, Loader2, Tag } from "lucide-react"
import { CATEGORY_COLOR_MAP } from "@/lib/categories"

const COLOR_OPTIONS = [
  { name: "emerald", label: "Green" },
  { name: "blue", label: "Blue" },
  { name: "violet", label: "Purple" },
  { name: "rose", label: "Red" },
  { name: "amber", label: "Amber" },
  { name: "orange", label: "Orange" },
  { name: "pink", label: "Pink" },
  { name: "sky", label: "Sky" },
  { name: "indigo", label: "Indigo" },
  { name: "slate", label: "Slate" },
  { name: "teal", label: "Teal" },
  { name: "purple", label: "Purple 2" },
] as const

type ColorName = (typeof COLOR_OPTIONS)[number]["name"]

interface Category {
  id: string
  name: string
  icon: string
  color: string
  isSystem: boolean
}

interface Props {
  initialCategories: Category[]
  isOwner: boolean
}

export function CustomCategoriesSection({ initialCategories, isOwner }: Props) {
  const [categories, setCategories] = useState(initialCategories.filter((c) => !c.isSystem))
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [form, setForm] = useState({ name: "", icon: "🏷️", color: "blue" as ColorName })

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setLoading(false)
    if (res.ok) {
      const cat = await res.json()
      setCategories((prev) => [...prev, cat])
      setForm({ name: "", icon: "🏷️", color: "blue" })
      setShowForm(false)
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Failed to create category")
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" })
    setDeletingId(null)
    if (res.ok) setCategories((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">Custom Categories</h2>
          <p className="text-xs text-slate-400 mt-0.5">Add your own spending categories</p>
        </div>
        {isOwner && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 border border-emerald-200 hover:border-emerald-300 rounded-xl px-3 py-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        )}
      </div>

      {categories.length === 0 && !showForm && (
        <div className="flex items-center gap-3 py-4 text-slate-400">
          <Tag className="w-4 h-4 shrink-0" />
          <p className="text-sm">No custom categories yet.</p>
        </div>
      )}

      <div className="space-y-2 mb-3">
        {categories.map((cat) => {
          const hexColor = CATEGORY_COLOR_MAP[cat.color] ?? "#94a3b8"
          return (
            <div key={cat.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
                  style={{ backgroundColor: hexColor + "20" }}
                >
                  {cat.icon}
                </span>
                <span className="text-sm font-medium text-slate-700">{cat.name}</span>
              </div>
              {isOwner && (
                <button
                  onClick={() => handleDelete(cat.id)}
                  disabled={deletingId === cat.id}
                  className="text-slate-300 hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  {deletingId === cat.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {showForm && isOwner && (
        <form onSubmit={handleAdd} className="border border-slate-100 rounded-xl p-4 space-y-3 bg-slate-50">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Emoji</label>
              <input
                type="text"
                maxLength={10}
                value={form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="🏷️"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Name</label>
              <input
                type="text"
                required
                maxLength={50}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Pets, Sports…"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1.5">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => {
                const hex = CATEGORY_COLOR_MAP[c.name] ?? "#94a3b8"
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, color: c.name }))}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      form.color === c.name ? "border-slate-700 scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: hex }}
                    title={c.label}
                  />
                )
              })}
            </div>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError("") }}
              className="text-xs font-medium text-slate-500 hover:text-slate-700 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
