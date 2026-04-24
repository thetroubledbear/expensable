import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@expensable/db"
import { resolveHousehold } from "@/lib/auth/household"

export interface HealthScoreData {
  score: number
  grade: "A" | "B" | "C" | "D" | "F"
  breakdown: {
    savings: { pts: number; max: number; label: string }
    stability: { pts: number; max: number; label: string }
    subscriptions: { pts: number; max: number; label: string }
    hygiene: { pts: number; max: number; label: string }
  }
}

function grade(score: number): HealthScoreData["grade"] {
  if (score >= 85) return "A"
  if (score >= 70) return "B"
  if (score >= 55) return "C"
  if (score >= 40) return "D"
  return "F"
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const membership = await resolveHousehold(session.user.id)
  if (!membership) return NextResponse.json({ error: "No household" }, { status: 404 })
  const hid = membership.householdId

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)

  const [monthlyAgg, trendTx, subs, monthTx] = await Promise.all([
    // Current month totals
    db.transaction.aggregate({
      where: { householdId: hid, date: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    // Last 3 months of spend for stability
    db.transaction.findMany({
      where: { householdId: hid, type: "debit", date: { gte: threeMonthsAgo, lt: startOfMonth } },
      select: { amount: true, date: true },
    }),
    // Subscriptions
    db.detectedSubscription.findMany({ where: { householdId: hid } }),
    // Current month transactions for hygiene
    db.transaction.findMany({
      where: { householdId: hid, date: { gte: startOfMonth } },
      select: { categoryId: true, type: true, amount: true },
    }),
  ])

  // ── Savings rate pts (0-40) ──────────────────────────────────────────────────
  const income = monthTx.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0)
  const spent = monthTx.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0)
  let savingsPts = 0
  if (income > 0) {
    const rate = Math.max(0, (income - spent) / income) // 0.0 – 1.0
    savingsPts = Math.min(40, Math.round(rate * 200)) // 20% savings → 40 pts
  }

  // ── Stability pts (0-30) — CoV of last 3 months ──────────────────────────────
  const monthlySpend = new Map<string, number>()
  for (const tx of trendTx) {
    const key = `${tx.date.getFullYear()}-${tx.date.getMonth()}`
    monthlySpend.set(key, (monthlySpend.get(key) ?? 0) + tx.amount)
  }
  const spendArr = Array.from(monthlySpend.values())
  let stabilityPts = 15 // default middle if insufficient data
  if (spendArr.length >= 2) {
    const mean = spendArr.reduce((s, v) => s + v, 0) / spendArr.length
    const variance = spendArr.reduce((s, v) => s + (v - mean) ** 2, 0) / spendArr.length
    const cov = mean > 0 ? Math.sqrt(variance) / mean : 0 // coefficient of variation
    // cov=0 → 30 pts, cov>=0.5 → 0 pts
    stabilityPts = Math.round(Math.max(0, (1 - cov / 0.5) * 30))
  }

  // ── Subscription burden pts (0-15) ───────────────────────────────────────────
  function estimateMonthly(amount: number, frequency: string) {
    if (frequency === "monthly") return amount
    if (frequency === "weekly") return (amount * 52) / 12
    if (frequency === "annual") return amount / 12
    return amount
  }
  const monthlySubTotal = subs.reduce((s, sub) => s + estimateMonthly(sub.amount, sub.frequency), 0)
  const subBurden = spent > 0 ? monthlySubTotal / spent : 0
  // < 10% → 15 pts, 10-30% → linear 15→5, > 30% → 0
  let subscriptionPts = 15
  if (subBurden >= 0.3) subscriptionPts = 0
  else if (subBurden > 0.1) subscriptionPts = Math.round(15 - ((subBurden - 0.1) / 0.2) * 10)

  // ── Data hygiene pts (0-15) ───────────────────────────────────────────────────
  const totalTx = monthTx.length
  const categorized = monthTx.filter((t) => t.categoryId !== null).length
  const hygienePts = totalTx > 0 ? Math.round((categorized / totalTx) * 15) : 15

  const score = savingsPts + stabilityPts + subscriptionPts + hygienePts

  const data: HealthScoreData = {
    score,
    grade: grade(score),
    breakdown: {
      savings:       { pts: savingsPts,       max: 40, label: "Savings rate" },
      stability:     { pts: stabilityPts,     max: 30, label: "Spending stability" },
      subscriptions: { pts: subscriptionPts,  max: 15, label: "Subscription burden" },
      hygiene:       { pts: hygienePts,       max: 15, label: "Data hygiene" },
    },
  }

  return NextResponse.json(data)
}
