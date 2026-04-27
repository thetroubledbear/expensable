"use client"

import { useState, useEffect, useRef } from "react"
import { Search, AlertTriangle, ChevronLeft, ChevronRight, Loader2, X, Receipt, Trash2, Pencil } from "lucide-react"
import { CategoryPicker, type Category } from "./category-picker"
import { EditTransactionModal, type EditableTransaction } from "./edit-transaction-modal"

type FinancialAccount = {
  id: string
  name: string
  type: string
}

type Transaction = {
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
  financialAccountId: string | null
  financialAccount: FinancialAccount | null
}

interface InitialData {
  data: Transaction[]
  total: number
  page: number
  totalPages: number
}

interface Props {
  initialData: InitialData
  categories: Category[]
  accounts: FinancialAccount[]
  defaultCurrency: string
  isOwner: boolean
}

function fmt(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(amount)
  } catch {
    return `${currency} ${amount}`
  }
}

export function TransactionsTable({ initialData, categories, accounts, defaultCurrency, isOwner }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialData.data)
  const [total, setTotal] = useState(initialData.total)
  const [totalPages, setTotalPages] = useState(initialData.totalPages)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<"" | "debit" | "credit">("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [accountFilter, setAccountFilter] = useState("")
  const [reviewOnly, setReviewOnly] = useState(false)

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)

  const isMounted = useRef(false)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  // Fetch on filter/page change, skip initial render
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true
      return
    }
    let alive = true
    setLoading(true)

    const p = new URLSearchParams({ page: String(page), limit: "25" })
    if (debouncedSearch) p.set("search", debouncedSearch)
    if (typeFilter) p.set("type", typeFilter)
    if (categoryFilter) p.set("categoryId", categoryFilter)
    if (accountFilter) p.set("accountId", accountFilter)
    if (reviewOnly) p.set("needsReview", "true")

    fetch(`/api/transactions?${p}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d) {
          setTransactions(d.data)
          setTotal(d.total)
          setTotalPages(d.totalPages)
          setSelected(new Set())
        }
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false) })

    return () => { alive = false }
  }, [page, debouncedSearch, typeFilter, categoryFilter, accountFilter, reviewOnly])

  function setInstantFilter(
    updates: Partial<{ typeFilter: "" | "debit" | "credit"; categoryFilter: string; accountFilter: string; reviewOnly: boolean }>
  ) {
    if ("typeFilter" in updates) setTypeFilter(updates.typeFilter!)
    if ("categoryFilter" in updates) setCategoryFilter(updates.categoryFilter!)
    if ("accountFilter" in updates) setAccountFilter(updates.accountFilter!)
    if ("reviewOnly" in updates) setReviewOnly(updates.reviewOnly!)
    setPage(1)
  }

  function handleCategoryUpdate(txId: string, category: Category | null) {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === txId ? { ...tx, category, categoryId: category?.id ?? null } : tx))
    )
  }

  function handleEditSave(updated: EditableTransaction) {
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === updated.id
          ? {
              ...t,
              date: updated.date,
              merchantName: updated.merchantName,
              description: updated.description,
              amount: updated.amount,
              type: updated.type,
              currency: updated.currency,
              categoryId: updated.categoryId,
              category: updated.category,
              needsReview: updated.needsReview,
              isDuplicate: updated.isDuplicate,
            }
          : t
      )
    )
    setEditingTx(null)
  }

  async function toggleReview(tx: Transaction) {
    const next = !tx.needsReview
    setTransactions((prev) => prev.map((t) => (t.id === tx.id ? { ...t, needsReview: next } : t)))
    const res = await fetch(`/api/transactions/${tx.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ needsReview: next }),
    })
    if (!res.ok) {
      setTransactions((prev) => prev.map((t) => (t.id === tx.id ? { ...t, needsReview: tx.needsReview } : t)))
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === transactions.length && transactions.length > 0) {
      setSelected(new Set())
    } else {
      setSelected(new Set(transactions.map((t) => t.id)))
    }
  }

  async function deleteSelected() {
    if (selected.size === 0 || deleting) return
    setDeleting(true)
    const ids = [...selected]
    const res = await fetch("/api/transactions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })
    setDeleting(false)
    if (res.ok) {
      setTransactions((prev) => prev.filter((t) => !selected.has(t.id)))
      setTotal((prev) => Math.max(0, prev - selected.size))
      setSelected(new Set())
    }
  }

  const allSelected = transactions.length > 0 && selected.size === transactions.length
  const reviewCount = transactions.filter((t) => t.needsReview).length

  if (initialData.total === 0 && !debouncedSearch && !typeFilter && !categoryFilter && !reviewOnly) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <Receipt className="w-7 h-7 text-slate-400" />
        </div>
        <p className="text-slate-600 font-medium mb-1">No transactions yet</p>
        <p className="text-slate-400 text-sm">Upload bank statements or receipts to extract transactions.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative min-w-[200px] max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="w-full pl-9 pr-8 py-2 text-sm rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition bg-white"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center bg-slate-100 rounded-xl p-1 text-xs font-medium gap-0.5">
          {(
            [
              ["", "All"],
              ["credit", "Income"],
              ["debit", "Expenses"],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setInstantFilter({ typeFilter: val })}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                typeFilter === val
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setInstantFilter({ categoryFilter: e.target.value })}
          className="text-sm rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
        >
          <option value="">All categories</option>
          <option value="uncategorized">Uncategorized</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>

        {accounts.length > 1 && (
          <select
            value={accountFilter}
            onChange={(e) => setInstantFilter({ accountFilter: e.target.value })}
            className="text-sm rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="">All accounts</option>
            <option value="none">No account</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        )}

        <button
          onClick={() => setInstantFilter({ reviewOnly: !reviewOnly })}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
            reviewOnly
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Needs review
          {reviewCount > 0 && !reviewOnly && (
            <span className="ml-0.5 bg-amber-100 text-amber-700 px-1.5 rounded-full text-[10px] font-semibold">
              {reviewCount}
            </span>
          )}
        </button>

        <div className="ml-auto flex items-center gap-3">
          {isOwner && selected.size > 0 ? (
            <>
              <span className="text-xs text-slate-500">{selected.size} selected</span>
              <button
                onClick={deleteSelected}
                disabled={deleting}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 disabled:opacity-50 transition-colors"
              >
                {deleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Delete {selected.size}
              </button>
            </>
          ) : (
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {total} transaction{total !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      {transactions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <p className="text-slate-500 font-medium">No transactions match your filters</p>
          <p className="text-slate-400 text-sm mt-1">Try adjusting the search or filters above</p>
        </div>
      ) : (
        <div
          className={`bg-white rounded-2xl border border-slate-100 shadow-sm transition-opacity duration-150 ${
            loading ? "opacity-60 pointer-events-none" : ""
          }`}
        >
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {isOwner && (
                  <th className="px-4 py-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </th>
                )}
                <th className="text-left px-4 py-3.5 text-xs font-medium text-slate-400 uppercase tracking-wide w-28">
                  Date
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Merchant
                </th>
                <th className="text-right px-4 py-3.5 text-xs font-medium text-slate-400 uppercase tracking-wide w-36">
                  Amount
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-medium text-slate-400 uppercase tracking-wide w-44">
                  Category
                </th>
                {accounts.length > 1 && (
                  <th className="text-left px-4 py-3.5 text-xs font-medium text-slate-400 uppercase tracking-wide w-32">
                    Account
                  </th>
                )}
                <th className="px-4 py-3.5 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.map((tx) => {
                const isSelected = selected.has(tx.id)
                return (
                  <tr
                    key={tx.id}
                    className={`hover:bg-slate-50/70 transition-colors group ${isSelected ? "bg-emerald-50/40" : ""}`}
                  >
                    {isOwner && (
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(tx.id)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3.5 text-xs text-slate-400 tabular-nums whitespace-nowrap">
                      {new Date(tx.date).toLocaleDateString("en", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3.5 min-w-0">
                      <p className="font-medium text-slate-800 truncate max-w-xs">
                        {tx.merchantName ?? tx.description}
                      </p>
                      {tx.merchantName && tx.description !== tx.merchantName && (
                        <p className="text-xs text-slate-400 truncate max-w-xs">{tx.description}</p>
                      )}
                      {tx.isDuplicate && (
                        <span className="inline-flex items-center mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-100">
                          Possible duplicate
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums whitespace-nowrap">
                      <span
                        className={`font-semibold ${
                          tx.type === "credit" ? "text-emerald-600" : "text-slate-700"
                        }`}
                      >
                        {tx.type === "credit" ? "+" : "−"}
                        {fmt(tx.amount, defaultCurrency)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <CategoryPicker
                        transactionId={tx.id}
                        current={tx.category}
                        categories={categories}
                        onUpdate={handleCategoryUpdate}
                      />
                    </td>
                    {accounts.length > 1 && (
                      <td className="px-4 py-3.5">
                        {tx.financialAccount ? (
                          <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium truncate max-w-[120px] block">
                            {tx.financialAccount.name}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingTx(tx)}
                          title="Edit transaction"
                          className="p-1.5 rounded-lg text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleReview(tx)}
                          title={tx.needsReview ? "Mark as reviewed" : "Flag for review"}
                          className={`p-1.5 rounded-lg transition-all ${
                            tx.needsReview
                              ? "text-amber-500 bg-amber-50 hover:bg-amber-100"
                              : "text-slate-200 hover:text-amber-400 opacity-0 group-hover:opacity-100"
                          }`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="text-xs text-slate-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {editingTx && (
        <EditTransactionModal
          tx={editingTx}
          categories={categories}
          onSave={handleEditSave}
          onClose={() => setEditingTx(null)}
        />
      )}
    </div>
  )
}
