import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@expensable/db"
import { resolveHousehold } from "@/lib/auth/household"

export interface RewindScenario {
  label: string
  savedAmount: number
  currency: string
  period: string
  type: "cut" | "daily" | "savings"
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const membership = await resolveHousehold(session.user.id)
    if (!membership) return NextResponse.json({ error: "No household" }, { status: 404 })

    const currency = membership.household.defaultCurrency ?? "USD"
    const hid = membership.householdId
    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())

    const [catTotals6m, totalDebit6m, totalCredit6m] = await Promise.all([
      db.transaction.groupBy({
        by: ["categoryId"],
        where: { householdId: hid, type: "debit", date: { gte: sixMonthsAgo } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
        take: 3,
      }),
      db.transaction.aggregate({
        where: { householdId: hid, type: "debit", date: { gte: oneYearAgo } },
        _sum: { amount: true },
      }),
      db.transaction.aggregate({
        where: { householdId: hid, type: "credit", date: { gte: oneYearAgo } },
        _sum: { amount: true },
      }),
    ])

    const scenarios: RewindScenario[] = []

    // Scenario 1: Cut top spending category by 20% over 6 months
    if (catTotals6m.length > 0) {
      const topCat = catTotals6m[0]
      const topTotal = topCat._sum.amount ?? 0
      if (topTotal > 0) {
        const catIds = catTotals6m.flatMap((c) => (c.categoryId ? [c.categoryId] : []))
        const cats = catIds.length > 0 ? await db.category.findMany({ where: { id: { in: catIds } } }) : []
        const catById = new Map(cats.map((c) => [c.id, c]))
        const topName = topCat.categoryId ? (catById.get(topCat.categoryId)?.name ?? "your top category") : "your top category"

        scenarios.push({
          label: `Cut ${topName} by 20%`,
          savedAmount: Math.round(topTotal * 0.2 * 100) / 100,
          currency,
          period: "over 6 months",
          type: "cut",
        })

        // Scenario 2: Cut top category entirely → what you'd have
        if (cats.length > 1) {
          const second = catTotals6m[1]
          const secondTotal = second._sum.amount ?? 0
          const secondName = second.categoryId ? (catById.get(second.categoryId)?.name ?? "other spending") : "other spending"
          if (secondTotal > 0) {
            scenarios.push({
              label: `Cut ${secondName} by 20%`,
              savedAmount: Math.round(secondTotal * 0.2 * 100) / 100,
              currency,
              period: "over 6 months",
              type: "cut",
            })
          }
        }
      }
    }

    // Scenario 3: Classic €5/day savings for a year
    const dailyRate = currency === "JPY" ? 500 : currency === "GBP" ? 4 : 5
    scenarios.push({
      label: `Saving ${currency === "JPY" ? "¥" : currency === "GBP" ? "£" : "€"}${dailyRate}/day`,
      savedAmount: dailyRate * 365,
      currency,
      period: "over a year",
      type: "daily",
    })

    // Scenario 4: 10% of annual income saved
    const annualIncome = totalCredit6m._sum.amount ?? 0
    if (annualIncome > 0) {
      const tenPctSavings = Math.round(annualIncome * 0.1 * 100) / 100
      scenarios.push({
        label: "Saved 10% of your income",
        savedAmount: tenPctSavings,
        currency,
        period: "this year",
        type: "savings",
      })
    }

    // Scenario 5: Reduced total spend by 10%
    const annualSpend = totalDebit6m._sum.amount ?? 0
    if (annualSpend > 0) {
      scenarios.push({
        label: "Spent 10% less overall",
        savedAmount: Math.round(annualSpend * 0.1 * 100) / 100,
        currency,
        period: "this year",
        type: "cut",
      })
    }

    return NextResponse.json(scenarios.filter((s) => s.savedAmount > 0))
  } catch (err) {
    console.error("[rewind]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
