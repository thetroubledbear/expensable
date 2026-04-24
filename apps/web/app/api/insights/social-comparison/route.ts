import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@expensable/db"
import { resolveHousehold } from "@/lib/auth/household"
import { CATEGORY_COLOR_MAP } from "@/lib/categories"
import { getBenchmarks } from "@/lib/benchmarks"

export interface SocialComparison {
  category: string
  color: string
  userMonthly: number
  benchmark: number
  currency: string
  diffPct: number
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const membership = await resolveHousehold(session.user.id)
  if (!membership) return NextResponse.json({ error: "No household" }, { status: 404 })

  const household = membership.household as typeof membership.household & { socialComparison: boolean }
  if (!household.socialComparison) {
    return NextResponse.json({ optIn: false })
  }

  const hid = membership.householdId
  const currency = household.defaultCurrency ?? "USD"
  const benchmarks = getBenchmarks(currency)

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const catTotals = await db.transaction.groupBy({
    by: ["categoryId"],
    where: { householdId: hid, type: "debit", date: { gte: startOfMonth } },
    _sum: { amount: true },
  })

  if (catTotals.length === 0 || !benchmarks) return NextResponse.json({ optIn: true, comparisons: [] })

  const catIds = catTotals.flatMap((c) => (c.categoryId ? [c.categoryId] : []))
  const cats = catIds.length > 0
    ? await db.category.findMany({ where: { id: { in: catIds } } })
    : []
  const catById = new Map(cats.map((c) => [c.id, c]))

  const comparisons: SocialComparison[] = []

  for (const row of catTotals) {
    const cat = row.categoryId ? catById.get(row.categoryId) : null
    const name = cat?.name ?? "Other"
    const benchmark = benchmarks[name]
    if (!benchmark) continue // no benchmark for this category (Income, Other, etc.)

    const userMonthly = Math.round((row._sum.amount ?? 0) * 100) / 100
    const diffPct = Math.round(((userMonthly - benchmark) / benchmark) * 100)
    const color = cat ? (CATEGORY_COLOR_MAP[cat.color] ?? "#94a3b8") : "#94a3b8"

    comparisons.push({ category: name, color, userMonthly, benchmark, currency, diffPct })
  }

  comparisons.sort((a, b) => Math.abs(b.diffPct) - Math.abs(a.diffPct))

  return NextResponse.json({ optIn: true, comparisons })
}
