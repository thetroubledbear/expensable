import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@expensable/db"
import { resolveHousehold } from "@/lib/auth/household"
import { CATEGORY_COLOR_MAP } from "@/lib/categories"

export interface CategoryComparison {
  name: string
  color: string
  thisMonth: number
  lastMonth: number
  changePct: number | null
  direction: "up" | "down" | "new" | "gone"
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const membership = await resolveHousehold(session.user.id)
  if (!membership) return NextResponse.json({ error: "No household" }, { status: 404 })
  const hid = membership.householdId

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

  const [thisMonthCats, lastMonthCats] = await Promise.all([
    db.transaction.groupBy({
      by: ["categoryId"],
      where: { householdId: hid, type: "debit", date: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    db.transaction.groupBy({
      by: ["categoryId"],
      where: { householdId: hid, type: "debit", date: { gte: startOfLastMonth, lte: endOfLastMonth } },
      _sum: { amount: true },
    }),
  ])

  // Resolve category names
  const allCatIds = Array.from(new Set([
    ...thisMonthCats.flatMap((c) => (c.categoryId ? [c.categoryId] : [])),
    ...lastMonthCats.flatMap((c) => (c.categoryId ? [c.categoryId] : [])),
  ]))
  const cats = allCatIds.length > 0
    ? await db.category.findMany({ where: { id: { in: allCatIds } } })
    : []
  const catById = new Map(cats.map((c) => [c.id, c]))

  const thisMap = new Map(thisMonthCats.map((c) => [c.categoryId ?? "__none__", c._sum.amount ?? 0]))
  const lastMap = new Map(lastMonthCats.map((c) => [c.categoryId ?? "__none__", c._sum.amount ?? 0]))

  const allKeys = new Set([...thisMap.keys(), ...lastMap.keys()])
  const comparisons: CategoryComparison[] = []

  for (const key of allKeys) {
    const thisAmt = thisMap.get(key) ?? 0
    const lastAmt = lastMap.get(key) ?? 0
    const cat = key !== "__none__" ? catById.get(key) : null
    const name = cat?.name ?? "Uncategorized"
    const color = cat ? (CATEGORY_COLOR_MAP[cat.color] ?? "#94a3b8") : "#94a3b8"

    let changePct: number | null = null
    let direction: CategoryComparison["direction"] = "up"

    if (lastAmt === 0 && thisAmt > 0) {
      direction = "new"
    } else if (lastAmt > 0 && thisAmt === 0) {
      direction = "gone"
    } else if (lastAmt > 0) {
      changePct = Math.round(((thisAmt - lastAmt) / lastAmt) * 100)
      direction = changePct >= 0 ? "up" : "down"
    }

    if (thisAmt > 0 || lastAmt > 0) {
      comparisons.push({ name, color, thisMonth: thisAmt, lastMonth: lastAmt, changePct, direction })
    }
  }

  // Sort by absolute % change desc, put "new" last
  comparisons.sort((a, b) => {
    const absA = a.changePct !== null ? Math.abs(a.changePct) : (a.direction === "new" ? -1 : 50)
    const absB = b.changePct !== null ? Math.abs(b.changePct) : (b.direction === "new" ? -1 : 50)
    return absB - absA
  })

  return NextResponse.json(comparisons.slice(0, 8))
}
