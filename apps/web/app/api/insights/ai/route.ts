import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@expensable/db"
import { resolveHousehold } from "@/lib/auth/household"
import { ollamaChat } from "@/lib/ai/ollama"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const force = req.nextUrl.searchParams.get("force") === "true"

  const membership = await resolveHousehold(session.user.id)
  if (!membership) {
    return NextResponse.json({ insights: [], available: false })
  }

  const hid = membership.householdId
  const currency = membership.household.defaultCurrency ?? "USD"
  const now = new Date()
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  // Count files successfully processed this month (stable proxy for "new data")
  const doneFileCount = await db.uploadedFile.count({
    where: { householdId: hid, status: "done" },
  })

  // Return cached insights if file count hasn't changed
  if (!force) {
    const cached = await db.aIInsightCache.findUnique({
      where: { householdId_month: { householdId: hid, month: monthKey } },
    })
    if (cached && cached.fileCount === doneFileCount && cached.insights) {
      const insights = JSON.parse(cached.insights) as string[]
      return NextResponse.json({ insights, available: true, cached: true })
    }
  }

  // Gather spending data for prompt
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

  const [catTotals, moneyOut, moneyIn, prevOut, topMerchants] = await Promise.all([
    db.transaction.groupBy({
      by: ["categoryId"],
      where: { householdId: hid, type: "debit", date: { gte: startOfMonth } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 5,
    }),
    db.transaction.aggregate({
      where: { householdId: hid, type: "debit", date: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: { householdId: hid, type: "credit", date: { gte: startOfMonth } },
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
  ])

  const categoryIds = catTotals.flatMap((c) => (c.categoryId ? [c.categoryId] : []))
  const cats =
    categoryIds.length > 0
      ? await db.category.findMany({ where: { id: { in: categoryIds } } })
      : []
  const catById = new Map(cats.map((c) => [c.id, c]))

  const spent = moneyOut._sum.amount ?? 0
  const received = moneyIn._sum.amount ?? 0
  const prevSpent = prevOut._sum.amount ?? 0
  const momPct =
    prevSpent > 0 ? Math.round(((spent - prevSpent) / prevSpent) * 100) : null
  const monthName = now.toLocaleString("en", { month: "long", year: "numeric" })

  if (spent === 0 && received === 0) {
    return NextResponse.json({ insights: [], available: true, empty: true })
  }

  const catLines = catTotals
    .map((c) => {
      const name = c.categoryId
        ? (catById.get(c.categoryId)?.name ?? "Other")
        : "Uncategorized"
      const amt = c._sum.amount ?? 0
      const pct = spent > 0 ? Math.round((amt / spent) * 100) : 0
      return `  - ${name}: ${currency} ${amt.toFixed(2)} (${pct}%)`
    })
    .join("\n")

  const merchantLines = topMerchants
    .map((m) => `  - ${m.merchantName}: ${currency} ${(m._sum.amount ?? 0).toFixed(2)}`)
    .join("\n")

  const summary = `Spending summary for ${monthName}:
- Total spent: ${currency} ${spent.toFixed(2)}
- Total received: ${currency} ${received.toFixed(2)}
- Net: ${currency} ${(received - spent).toFixed(2)}${momPct !== null ? `\n- vs last month: ${momPct > 0 ? "+" : ""}${momPct}%` : ""}

Top categories:
${catLines || "  - No data"}

Top merchants:
${merchantLines || "  - No data"}`

  try {
    const raw = await ollamaChat(
      "You are a concise personal finance assistant. Return ONLY valid JSON with no markdown fences.",
      `Analyze this spending data and return 4 short, specific insights (1-2 sentences each).

${summary}

Return this exact JSON shape: {"insights":["insight 1","insight 2","insight 3","insight 4"]}`
    )

    const match = raw.match(/\{[\s\S]*\}/)
    const parsed = match ? (JSON.parse(match[0]) as { insights?: unknown }) : {}
    const insights = Array.isArray(parsed.insights)
      ? (parsed.insights as string[]).slice(0, 5)
      : []

    // Persist to cache
    await db.aIInsightCache.upsert({
      where: { householdId_month: { householdId: hid, month: monthKey } },
      create: {
        householdId: hid,
        month: monthKey,
        insights: JSON.stringify(insights),
        fileCount: doneFileCount,
      },
      update: {
        insights: JSON.stringify(insights),
        fileCount: doneFileCount,
        generatedAt: new Date(),
      },
    })

    return NextResponse.json({ insights, available: true, cached: false })
  } catch {
    return NextResponse.json({ insights: [], available: false, error: "Ollama not reachable" })
  }
}
