"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Check } from "lucide-react"

export type Category = { id: string; name: string; icon: string; color: string }

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

interface Props {
  transactionId: string
  current: Category | null
  categories: Category[]
  onUpdate: (txId: string, category: Category | null) => void
}

export function CategoryPicker({ transactionId, current, categories, onUpdate }: Props) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onMouseDown)
    return () => document.removeEventListener("mousedown", onMouseDown)
  }, [])

  async function pick(cat: Category | null) {
    if (cat?.id === current?.id) { setOpen(false); return }
    setOpen(false)
    setSaving(true)
    const res = await fetch(`/api/transactions/${transactionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId: cat?.id ?? null }),
    })
    setSaving(false)
    if (res.ok) onUpdate(transactionId, cat)
  }

  const pillClass = current
    ? (COLOR_CLASSES[current.color] ?? "bg-slate-100 text-slate-600")
    : "bg-slate-100 text-slate-400"

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={saving}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${pillClass} ${
          saving ? "opacity-50 cursor-wait" : "hover:opacity-80 cursor-pointer"
        }`}
      >
        {current ? (
          <>
            <span>{current.icon}</span>
            <span className="max-w-[100px] truncate">{current.name}</span>
          </>
        ) : (
          <span>Uncategorized</span>
        )}
        <ChevronDown className={`w-3 h-3 opacity-50 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1.5 left-0 w-52 bg-white rounded-xl border border-slate-200 shadow-xl py-1 max-h-72 overflow-y-auto">
          <button
            onClick={() => pick(null)}
            className="w-full text-left px-3 py-2 flex items-center justify-between text-xs text-slate-400 hover:bg-slate-50 transition-colors"
          >
            <span>Uncategorized</span>
            {!current && <Check className="w-3 h-3" />}
          </button>
          <div className="h-px bg-slate-100 mx-2 my-1" />
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => pick(cat)}
              className="w-full text-left px-3 py-2 flex items-center justify-between gap-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </span>
              {current?.id === cat.id && <Check className="w-3 h-3 text-emerald-500 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
