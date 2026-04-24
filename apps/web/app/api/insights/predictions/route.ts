import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@expensable/db"
import { resolveHousehold } from "@/lib/auth/household"
import { CATEGORY_COLOR_MAP } from "@/lib/categories"

export interface SpendingPrediction {
  category: string
  color: string
  currentSpend: number
  projected: number
  lastMonth: number
  overagePct: number
  daysLeft: number
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const membership = await resolveHousehold(session.user.id)
  if (!membership) return NextResponse.json({ error: "No household" }, { status: 404 })
  const hid = membership.householdId

  const now = new Date()
  const dayOfMonth = now.getDate()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysLeft = daysInMonth - dayOfMonth
  const dayRatio = dayOfMonth / daysInMonth

  // Need at least 5 days of data before predictions make sense
  if (dayOfMonth < 5) return NextResponse.json([])

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

  const [thisMonthCats, lastMonthCats] = await Promise.all([
    db.transaction.groupBy({
      by: ["categoryId"],
      where: { householdId: hid, type: "debit", date: { gte: startOfMonth } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 6,
    }),
    db.transaction.groupBy({
      by: ["categoryId"],
      where: { householdId: hid, type: "debit", date: { gte: startOfLastMonth, lte: endOfLastMonth } },
      _sum: { amount: true },
    }),
  ])

  const allCatIds = Array.from(new Set([
    ...thisMonthCats.flatMap((c) => (c.categoryId ? [c.categoryId] : [])),
    ...lastMonthCats.flatMap((c) => (c.categoryId ? [c.categoryId] : [])),
  ]))
  const cats = allCatIds.length > 0
    ? await db.category.findMany({ where: { id: { in: allCatIds } } })
    : []
  const catById = new Map(cats.map((c) => [c.id, c]))
  const lastMap = new Map(lastMonthCats.map((c) => [c.categoryId ?? "__none__", c._sum.amount ?? 0]))

  const predictions: SpendingPrediction[] = []

  for (const row of thisMonthCats) {
    const currentSpend = row._sum.amount ?? 0
    const projected = currentSpend / dayRatio
    const lastMonth = lastMap.get(row.categoryId ?? "__none__") ?? 0

    // Only alert if last month had data AND projection is 15%+ over
    if (lastMonth === 0) continue
    const overagePct = Math.round(((projected - lastMonth) / lastMonth) * 100)
    if (overagePct < 15) continue

    const cat = row.categoryId ? catById.get(row.categoryId) : null
    const color = cat ? (CATEGORY_COLOR_MAP[cat.color] ?? "#94a3b8") : "#94a3b8"

    predictions.push({
      category: cat?.name ?? "Uncategorized",
      color,
      currentSpend: Math.round(currentSpend * 100) / 100,
      projected: Math.round(projected * 100) / 100,
      lastMonth: Math.round(lastMonth * 100) / 100,
      overagePct,
      daysLeft,
    })
  }

  predictions.sort((a, b) => b.overagePct - a.overagePct)
  return NextResponse.json(predictions.slice(0, 4))
}
