import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@expensable/db"
import { resolveHousehold } from "@/lib/auth/household"
import { computeTradeoffs } from "@/lib/tradeoffs"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const amount = parseFloat(req.nextUrl.searchParams.get("amount") ?? "")
    if (isNaN(amount) || amount <= 0) return NextResponse.json({ tradeoffs: [] })

    const membership = await resolveHousehold(session.user.id)
    if (!membership) return NextResponse.json({ error: "No household" }, { status: 404 })

    const currency = membership.household.defaultCurrency ?? "USD"
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const catTotals = await db.transaction.groupBy({
      by: ["categoryId"],
      where: { householdId: membership.householdId, type: "debit", date: { gte: threeMonthsAgo } },
      _sum: { amount: true },
    })

    const catIds = catTotals.flatMap((c) => (c.categoryId ? [c.categoryId] : []))
    const cats = catIds.length > 0 ? await db.category.findMany({ where: { id: { in: catIds } } }) : []
    const catById = new Map(cats.map((c) => [c.id, c]))

    // Monthly average (divide 3-month total by 3)
    const categoryAverages: Record<string, number> = {}
    for (const row of catTotals) {
      const name = row.categoryId ? (catById.get(row.categoryId)?.name ?? null) : null
      if (name) categoryAverages[name] = (row._sum.amount ?? 0) / 3
    }

    const tradeoffs = computeTradeoffs(amount, currency, categoryAverages)
    return NextResponse.json({ tradeoffs, currency })
  } catch (err) {
    console.error("[tradeoffs]", err)
    return NextResponse.json({ tradeoffs: [] })
  }
}
