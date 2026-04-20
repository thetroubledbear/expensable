"use client"

import { useState } from "react"
import {
  Landmark,
  Plus,
  Star,
  Pencil,
  Trash2,
  Loader2,
  Check,
  X,
  ArrowLeftRight,
} from "lucide-react"

export type AccountType = "checking" | "savings" | "credit" | "cash" | "investment"

interface FinancialAccount {
  id: string
  name: string
  type: AccountType
  isDefault: boolean
  currency: string
  _count: { transactions: number }
}

interface Props {
  initialAccounts: FinancialAccount[]
  defaultCurrency: string
  isOwner: boolean
}

const TYPE_LABELS: Record<AccountType, string> = {
  checking: "Checking",
  savings: "Savings",
  credit: "Credit Card",
  cash: "Cash",
  investment: "Investment",
}

const TYPE_COLORS: Record<AccountType, string> = {
  checking: "bg-blue-100 text-blue-700",
  savings: "bg-emerald-100 text-emerald-700",
  credit: "bg-violet-100 text-violet-700",
  cash: "bg-amber-100 text-amber-700",
  investment: "bg-rose-100 text-rose-700",
}

const SUPPORTED_CURRENCIES = ["USD","EUR","GBP","CHF","CAD","AUD","JPY","NOK","SEK","DKK","NZD","SGD","HKD"]
const ACCOUNT_TYPES: AccountType[] = ["checking", "savings", "credit", "cash", "investment"]

interface AccountFormState {
  name: string
  type: AccountType
  currency: string
  isDefault: boolean
}

function emptyForm(defaultCurrency: string): AccountFormState {
  return { name: "", type: "checking", currency: defaultCurrency, isDefault: false }
}

export function AccountsManager({ initialAccounts, defaultCurrency, isOwner }: Props) {
  const [accounts, setAccounts] = useState<FinancialAccount[]>(initialAccounts)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<AccountFormState>(emptyForm(defaultCurrency))
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<AccountFormState>(emptyForm(defaultCurrency))
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState("")

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<Record<string, string>>({})

  async function createAccount() {
    if (!createForm.name.trim()) return
    setCreating(true)
    setCreateError("")
    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    })
    const data = await res.json()
    setCreating(false)
    if (!res.ok) { setCreateError(data.error ?? "Failed to create"); return }

    if (data.isDefault) {
      setAccounts((prev) => [{ ...data }, ...prev.map((a) => ({ ...a, isDefault: false }))])
    } else {
      setAccounts((prev) => [...prev, data])
    }
    setShowCreate(false)
    setCreateForm(emptyForm(defaultCurrency))
  }

  function startEdit(account: FinancialAccount) {
    setEditingId(account.id)
    setEditForm({ name: account.name, type: account.type, currency: account.currency, isDefault: account.isDefault })
    setEditError("")
  }

  async function saveEdit(id: string) {
    setSaving(true)
    setEditError("")
    const res = await fetch(`/api/accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setEditError(data.error ?? "Failed to save"); return }

    setAccounts((prev) =>
      prev.map((a) => {
        if (data.isDefault && a.id !== id) return { ...a, isDefault: false }
        if (a.id === id) return { ...data }
        return a
      })
    )
    setEditingId(null)
  }

  async function deleteAccount(id: string) {
    setDeletingId(id)
    setDeleteError((prev) => ({ ...prev, [id]: "" }))
    const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" })
    setDeletingId(null)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setDeleteError((prev) => ({ ...prev, [id]: data.error ?? "Failed to delete" }))
      return
    }
    setAccounts((prev) => prev.filter((a) => a.id !== id))
  }

  async function setDefault(id: string) {
    const res = await fetch(`/api/accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    })
    if (!res.ok) return
    setAccounts((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })))
  }

  return (
    <div className="space-y-4">
      {/* Account list */}
      {accounts.map((account) => {
        const isEditing = editingId === account.id
        return (
          <div
            key={account.id}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4"
          >
            {isEditing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Name</label>
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Type</label>
                    <select
                      value={editForm.type}
                      onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value as AccountType }))}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      {ACCOUNT_TYPES.map((t) => (
                        <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Currency</label>
                    <select
                      value={editForm.currency}
                      onChange={(e) => setEditForm((f) => ({ ...f, currency: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      {SUPPORTED_CURRENCIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.isDefault}
                        onChange={(e) => setEditForm((f) => ({ ...f, isDefault: e.target.checked }))}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-slate-600">Set as default</span>
                    </label>
                  </div>
                </div>
                {editError && <p className="text-xs text-red-500">{editError}</p>}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => saveEdit(account.id)}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <Landmark className="w-5 h-5 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800">{account.name}</span>
                    {account.isDefault && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                        <Star className="w-2.5 h-2.5" />
                        Default
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${TYPE_COLORS[account.type]}`}>
                      {TYPE_LABELS[account.type]}
                    </span>
                    <span className="text-xs text-slate-400">{account.currency}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {account._count.transactions} transaction{account._count.transactions !== 1 ? "s" : ""}
                  </p>
                  {deleteError[account.id] && (
                    <p className="text-xs text-red-500 mt-1">{deleteError[account.id]}</p>
                  )}
                </div>
                {isOwner && (
                  <div className="flex items-center gap-1 shrink-0">
                    {!account.isDefault && (
                      <button
                        onClick={() => setDefault(account.id)}
                        title="Set as default"
                        className="p-2 rounded-lg text-slate-300 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => startEdit(account)}
                      className="p-2 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteAccount(account.id)}
                      disabled={deletingId === account.id || accounts.length <= 1}
                      title={accounts.length <= 1 ? "Cannot delete the last account" : "Delete account"}
                      className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      {deletingId === account.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Transfer info banner */}
      {accounts.length >= 2 && (
        <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
          <ArrowLeftRight className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-500">
            Transfers between accounts are detected automatically when AI parses your files. They appear in Transactions with a <span className="font-medium text-slate-600">Transfer</span> category and are flagged for review so you can link both sides.
          </p>
        </div>
      )}

      {/* Create new account */}
      {isOwner && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          {showCreate ? (
            <div className="px-5 py-4 space-y-3">
              <p className="text-sm font-semibold text-slate-700">New account</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Name</label>
                  <input
                    value={createForm.name}
                    onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Savings, Chase Checking"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && createAccount()}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Type</label>
                  <select
                    value={createForm.type}
                    onChange={(e) => setCreateForm((f) => ({ ...f, type: e.target.value as AccountType }))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {ACCOUNT_TYPES.map((t) => (
                      <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Currency</label>
                  <select
                    value={createForm.currency}
                    onChange={(e) => setCreateForm((f) => ({ ...f, currency: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createForm.isDefault}
                      onChange={(e) => setCreateForm((f) => ({ ...f, isDefault: e.target.checked }))}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-slate-600">Set as default</span>
                  </label>
                </div>
              </div>
              {createError && <p className="text-xs text-red-500">{createError}</p>}
              <div className="flex items-center gap-2">
                <button
                  onClick={createAccount}
                  disabled={creating || !createForm.name.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Create account
                </button>
                <button
                  onClick={() => { setShowCreate(false); setCreateForm(emptyForm(defaultCurrency)); setCreateError("") }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 w-full px-5 py-4 text-sm font-medium text-slate-400 hover:text-emerald-600 hover:bg-emerald-50/50 rounded-2xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add account
            </button>
          )}
        </div>
      )}
    </div>
  )
}
