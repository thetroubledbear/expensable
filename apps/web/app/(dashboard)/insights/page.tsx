import { requireAuth } from "@/lib/auth/session"
import { db } from "@expensable/db"
import { SpendingTrendChart } from "@/components/spending-trend-chart"
import { CategoryPieChart } from "@/components/category-pie-chart"
import { ArrowDown, ArrowUp } from "lucide-react"

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default async function InsightsPage() {
  const session = await requireAuth()

  const membership = await db.householdMember.findFirst({
    where: { userId: session.user?.id! },
    include: { household: true },
  })

  const hid = membership?.householdId
  const currency = membership?.household.defaultCurrency ?? "USD"
  const now = new Date()

  if (!hid) {
    return (
      <div className="p-8 max-w-5xl mx-auto w-full">
        <h1 className="text-2xl font-semibold text-slate-900">Insights</h1>
      </div>
    )
  }

  // Monthly trend — last 6 months
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const trendTx = await db.transaction.findMany({
    where: { householdId: hid, date: { gte: sixMonthsAgo } },
    select: { amount: true, type: true, date: true },
  })

  const monthMap = new Map<string, { spent: number; received: number }>()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    monthMap.set(key, { spent: 0, received: 0 })
  }
  for (const tx of trendTx) {
    const key = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, "0")}`
    const bucket = monthMap.get(key)
    if (!bucket) continue
    if (tx.type === "debit") bucket.spent += tx.amount
    else bucket.received += tx.amount
  }
  const trend = Array.from(monthMap.entries()).map(([month, v]) => ({
    month,
    spent: Math.round(v.spent * 100) / 100,
    received: Math.round(v.received * 100) / 100,
  }))

  // Category breakdown — current month, debit only
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const catTotals = await db.transaction.groupBy({
    by: ["categoryId"],
    where: { householdId: hid, type: "debit", date: { gte: startOfMonth } },
    _sum: { amount: true },
  })
  const categoryIds = catTotals.flatMap((c) => (c.categoryId ? [c.categoryId] : []))
  const cats =
    categoryIds.length > 0
      ? await db.category.findMany({ where: { id: { in: categoryIds } } })
      : []
  const catById = new Map(cats.map((c) => [c.id, c]))
  const categories = catTotals
    .map((c) => ({
      name: c.categoryId ? (catById.get(c.categoryId)?.name ?? "Other") : "Uncategorized",
      color: c.categoryId ? (catById.get(c.categoryId)?.color ?? "#94a3b8") : "#94a3b8",
      total: Math.round((c._sum.amount ?? 0) * 100) / 100,
    }))
    .sort((a, b) => b.total - a.total)

  // Month-over-month delta
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
  const [curAgg, prevAgg] = await Promise.all([
    db.transaction.aggregate({
      where: { householdId: hid, type: "debit", date: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: {
        householdId: hid,
        type: "debit",
        date: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
      _sum: { amount: true },
    }),
  ])
  const current = curAgg._sum.amount ?? 0
  const previous = prevAgg._sum.amount ?? 0
  const momPct = previous > 0 ? Math.round(((current - previous) / previous) * 100) : null
  const monthName = now.toLocaleString("en", { month: "long" })
  const lastMonthName = new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleString("en", {
    month: "long",
  })
  const totalThisMonth = categories.reduce((a, c) => a + c.total, 0)

  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Insights</h1>
        <p className="text-slate-500 mt-1 text-sm">Spending patterns and trends</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs text-slate-500 mb-1">{monthName} spending</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{fmt(current, currency)}</p>
          {momPct !== null && (
            <div
              className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${
                momPct > 0 ? "text-red-500" : "text-emerald-600"
              }`}
            >
              {momPct > 0 ? (
                <ArrowUp className="w-3 h-3" />
              ) : (
                <ArrowDown className="w-3 h-3" />
              )}
              {Math.abs(momPct)}% vs last month
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs text-slate-500 mb-1">Last month</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">
            {fmt(previous, currency)}
          </p>
          <p className="text-xs text-slate-400 mt-1.5">{lastMonthName}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs text-slate-500 mb-1">Top category</p>
          <p className="text-lg font-bold text-slate-900 truncate">
            {categories[0]?.name ?? "—"}
          </p>
          {categories[0] && (
            <p className="text-xs text-slate-400 mt-1.5 tabular-nums">
              {fmt(categories[0].total, currency)}
            </p>
          )}
        </div>
      </div>

      {/* Trend chart */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">6-month spending trend</h2>
        <SpendingTrendChart data={trend} currency={currency} />
      </div>

      {/* Category breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-1">Spending by category</h2>
          <p className="text-xs text-slate-400 mb-4">{monthName}</p>
          <CategoryPieChart data={categories} currency={currency} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-1">Category breakdown</h2>
          <p className="text-xs text-slate-400 mb-4">{monthName}</p>
          {categories.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No data this month</p>
          ) : (
            <div className="space-y-3">
              {categories.slice(0, 8).map((cat) => {
                const pct = totalThisMonth > 0 ? Math.round((cat.total / totalThisMonth) * 100) : 0
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-xs text-slate-600 truncate">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-xs text-slate-400">{pct}%</span>
                        <span className="text-xs font-medium text-slate-700 tabular-nums">
                          {fmt(cat.total, currency)}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
