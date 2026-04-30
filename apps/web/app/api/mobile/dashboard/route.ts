import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@expensable/db"
import { resolveHousehold } from "@/lib/auth/household"

function estimateMonthly(amount: number, frequency: string): number {
  if (frequency === "monthly") return amount
  if (frequency === "weekly") return (amount * 52) / 12
  if (frequency === "annual") return amount / 12
  return amount
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const membership = await resolveHousehold(session.user.id)
  if (!membership) {
    return NextResponse.json({ error: "No household" }, { status: 404 })
  }

  try {
  const hid = membership.householdId
  const currency = membership.household.defaultCurrency ?? "USD"
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthName = now.toLocaleString("en", { month: "long" })
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

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
        select: { id: true, merchantName: true, description: true, type: true, amount: true, date: true },
      }),
      db.transaction.groupBy({
        by: ["merchantName"],
        where: { householdId: hid, type: "debit", date: { gte: startOfMonth }, merchantName: { not: null } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
        take: 5,
      }),
      db.detectedSubscription.findMany({ where: { householdId: hid } }),
      db.transaction.aggregate({
        where: { householdId: hid, type: "debit", date: { gte: startOfLastMonth, lte: endOfLastMonth } },
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
  const totalMonthlySubscriptions = subs.reduce((acc, s) => acc + estimateMonthly(s.amount, s.frequency), 0)

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

  // Categories
  const categoryIds = catTotals.flatMap((c) => (c.categoryId ? [c.categoryId] : []))
  const cats = categoryIds.length > 0 ? await db.category.findMany({ where: { id: { in: categoryIds } } }) : []
  const catById = new Map(cats.map((c) => [c.id, c]))
  const categories = catTotals
    .map((c) => ({
      id: c.categoryId ?? null,
      name: c.categoryId ? (catById.get(c.categoryId)?.name ?? "Other") : "Uncategorized",
      color: c.categoryId ? (catById.get(c.categoryId)?.color ?? "#94a3b8") : "#94a3b8",
      total: Math.round((c._sum.amount ?? 0) * 100) / 100,
    }))
    .sort((a, b) => b.total - a.total)

  // Account balances
  const creditByAcct = new Map(acctCredits.map((r) => [r.financialAccountId, r._sum.amount ?? 0]))
  const debitByAcct = new Map(acctDebits.map((r) => [r.financialAccountId, r._sum.amount ?? 0]))
  const accountBalances = financialAccounts.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    currency: a.currency,
    balance: Math.round(((creditByAcct.get(a.id) ?? 0) - (debitByAcct.get(a.id) ?? 0)) * 100) / 100,
  }))

  return NextResponse.json({
    spent: Math.round(spent * 100) / 100,
    received: Math.round(received * 100) / 100,
    net: Math.round((received - spent) * 100) / 100,
    currency,
    monthName,
    momPct,
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
    subscriptionsCount: subs.length,
    totalMonthlySubscriptions: Math.round(totalMonthlySubscriptions * 100) / 100,
    subscriptions: subs.map((s) => ({
      id: s.id,
      merchantName: s.merchantName,
      amount: s.amount,
      frequency: s.frequency,
      currency: s.currency,
    })),
    trend,
    categories,
    accountBalances,
  })
  } catch (error) {
    console.error("Mobile dashboard error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
