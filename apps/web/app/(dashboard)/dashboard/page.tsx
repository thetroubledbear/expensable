import { requireAuth } from "@/lib/auth/session"
import { db } from "@expensable/db"
import { resolveHousehold } from "@/lib/auth/household"
import Link from "next/link"
import { UploadCloud } from "lucide-react"
import { DashboardGrid, type DashboardData } from "@/components/dashboard-grid"
import { CATEGORY_COLOR_MAP } from "@/lib/categories"
import { NotificationsBell } from "@/components/notifications-bell"

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

function estimateMonthly(amount: number, frequency: string): number {
  if (frequency === "monthly") return amount
  if (frequency === "weekly") return (amount * 52) / 12
  if (frequency === "annual") return amount / 12
  return amount
}

export default async function DashboardPage() {
  const session = await requireAuth()

  const membership = await resolveHousehold(session.user?.id!)

  const hid = membership?.householdId
  const currency = membership?.household.defaultCurrency ?? "USD"
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthName = now.toLocaleString("en", { month: "long" })
  const firstName = (session.user as { name?: string | null })?.name?.split(" ")[0] ?? "there"

  if (!hid) {
    return (
      <div className="p-8 max-w-5xl mx-auto w-full">
        <p className="text-slate-500">No household found.</p>
      </div>
    )
  }

  const fileCount = await db.uploadedFile.count({ where: { householdId: hid } })

  if (fileCount === 0) {
    return (
      <div className="p-8 max-w-5xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">
            {greeting()}, {firstName}
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            {membership?.household.name ?? "Your workspace"} · {monthName} overview
          </p>
        </div>
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5">
            <UploadCloud className="w-7 h-7 text-emerald-600" />
          </div>
          <h2 className="text-slate-900 font-semibold text-xl mb-2">Upload your first file</h2>
          <p className="text-slate-500 text-sm mb-7 max-w-md mx-auto leading-relaxed">
            Import a bank statement, CSV export, PDF, or a receipt photo.
            Your AI assistant will extract all transactions automatically.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            Upload a file
          </Link>
        </div>
      </div>
    )
  }

  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
  const lastMonthName = new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleString("en", { month: "long" })

  const [moneyOut, moneyIn, recentTxRaw, topMerchantsRaw, subs, prevMonthAgg, trendTx, catTotals, financialAccounts, acctCredits, acctDebits] =
    await Promise.all([
      db.transaction.aggregate({
        where: { householdId: hid, type: "debit", date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      db.transaction.aggregate({
        where: { householdId: hid, type: "credit", date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      db.transaction.findMany({
        where: { householdId: hid },
        orderBy: { date: "desc" },
        take: 8,
      }),
      db.transaction.groupBy({
        by: ["merchantName"],
        where: {
          householdId: hid,
          type: "debit",
          date: { gte: startOfMonth },
          merchantName: { not: null },
        },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
        take: 5,
      }),
      db.detectedSubscription.findMany({
        where: { householdId: hid },
      }),
      db.transaction.aggregate({
        where: {
          householdId: hid,
          type: "debit",
          date: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        _sum: { amount: true },
      }),
      db.transaction.findMany({
        where: { householdId: hid, date: { gte: sixMonthsAgo } },
        select: { amount: true, type: true, date: true },
      }),
      db.transaction.groupBy({
        by: ["categoryId"],
        where: { householdId: hid, type: "debit", date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      db.financialAccount.findMany({
        where: { householdId: hid },
        select: { id: true, name: true, type: true, currency: true },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      }),
      db.transaction.groupBy({
        by: ["financialAccountId"],
        where: { householdId: hid, type: "credit", financialAccountId: { not: null } },
        _sum: { amount: true },
      }),
      db.transaction.groupBy({
        by: ["financialAccountId"],
        where: { householdId: hid, type: "debit", financialAccountId: { not: null } },
        _sum: { amount: true },
      }),
    ])

  const spent = moneyOut._sum.amount ?? 0
  const received = moneyIn._sum.amount ?? 0
  const previousSpent = prevMonthAgg._sum.amount ?? 0
  const momPct = previousSpent > 0 ? Math.round(((spent - previousSpent) / previousSpent) * 100) : null
  const savingsRate = received > 0 ? Math.round(((received - spent) / received) * 100) : null
  const totalMonthlySubscriptions = subs.reduce(
    (acc, s) => acc + estimateMonthly(s.amount, s.frequency),
    0
  )

  // 6-month trend
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

  // Category breakdown
  const categoryIds = catTotals.flatMap((c) => (c.categoryId ? [c.categoryId] : []))
  const cats = categoryIds.length > 0
    ? await db.category.findMany({ where: { id: { in: categoryIds } } })
    : []
  const catById = new Map(cats.map((c) => [c.id, c]))
  const categories = catTotals
    .map((c) => ({
      name: c.categoryId ? (catById.get(c.categoryId)?.name ?? "Other") : "Uncategorized",
      color: (() => {
        const raw = c.categoryId ? (catById.get(c.categoryId)?.color ?? "") : ""
        return CATEGORY_COLOR_MAP[raw] ?? raw ?? "#94a3b8"
      })(),
      total: Math.round((c._sum.amount ?? 0) * 100) / 100,
    }))
    .sort((a, b) => b.total - a.total)

  // Account balances: sum(credits) - sum(debits) per account, all-time
  const creditByAcct = new Map(acctCredits.map((r) => [r.financialAccountId, r._sum.amount ?? 0]))
  const debitByAcct  = new Map(acctDebits.map((r)  => [r.financialAccountId, r._sum.amount ?? 0]))
  const accountBalances = financialAccounts.map((a) => ({
    id:       a.id,
    name:     a.name,
    type:     a.type,
    currency: a.currency,
    balance:  Math.round(((creditByAcct.get(a.id) ?? 0) - (debitByAcct.get(a.id) ?? 0)) * 100) / 100,
  }))

  const data: DashboardData = {
    spent,
    received,
    net: received - spent,
    savingsRate,
    currency,
    monthName,
    momPct,
    lastMonthName,
    recentTx: recentTxRaw.map((tx) => ({
      id: tx.id,
      merchantName: tx.merchantName,
      description: tx.description,
      type: tx.type,
      amount: tx.amount,
      date: tx.date.toISOString(),
    })),
    topMerchants: topMerchantsRaw.map((m) => ({
      merchantName: m.merchantName,
      amount: m._sum.amount ?? 0,
      pct: spent > 0 ? Math.round(((m._sum.amount ?? 0) / spent) * 100) : 0,
    })),
    fileCount,
    subscriptionsCount: subs.length,
    totalMonthlySubscriptions,
    subscriptions: subs
      .sort((a, b) => estimateMonthly(b.amount, b.frequency) - estimateMonthly(a.amount, a.frequency))
      .map((s) => ({
        id: s.id,
        merchantName: s.merchantName,
        amount: s.amount,
        frequency: s.frequency,
        currency: s.currency,
      })),
    trend,
    categories,
    accountBalances,
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {greeting()}, {firstName}
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            {membership?.household.name ?? "Your workspace"} · {monthName} overview
          </p>
        </div>
        <NotificationsBell />
      </div>
      <DashboardGrid data={data} />
    </div>
  )
}
