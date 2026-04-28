import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { z } from "zod"
import { auth } from "@/lib/auth/config"
import { db } from "@expensable/db"
import { resolveHousehold } from "@/lib/auth/household"
import { PLANS } from "@expensable/types"

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash"

const bodySchema = z.object({
  question: z.string().min(1).max(500),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }) }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const membership = await resolveHousehold(session.user.id)
  if (!membership) return NextResponse.json({ error: "No household" }, { status: 404 })

  const { householdId } = membership
  const currency = membership.household.defaultCurrency
  const billing = membership.household.billing
  const tier = (billing?.tier ?? "free") as keyof typeof PLANS
  const plan = PLANS[tier]

  const now = new Date()
  if (billing) {
    const c = billing.billingCycleStart
    if (c.getMonth() !== now.getMonth() || c.getFullYear() !== now.getFullYear()) {
      await db.householdBilling.update({
        where: { id: billing.id },
        data: { aiQueriesThisMonth: 0, filesUploadedThisMonth: 0, billingCycleStart: now },
      })
      billing.aiQueriesThisMonth = 0
    }
  }

  const queryLimit = plan.monthlyAIQueryLimit
  const usedQueries = billing?.aiQueriesThisMonth ?? 0

  if (queryLimit !== null && usedQueries >= queryLimit) {
    return NextResponse.json(
      {
        error: `Monthly AI query limit reached (${queryLimit} queries on ${tier} plan). Upgrade to ask more questions.`,
        limitReached: true,
        used: usedQueries,
        limit: queryLimit,
      },
      { status: 429 }
    )
  }

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [catTotals, catTotalsMonth, topMerchants, topMerchantsMonth, recentTx, subscriptions] = await Promise.all([
    db.transaction.groupBy({
      by: ["categoryId"],
      where: { householdId, type: "debit" },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 10,
    }),
    db.transaction.groupBy({
      by: ["categoryId"],
      where: { householdId, type: "debit", date: { gte: monthStart } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 10,
    }),
    db.transaction.groupBy({
      by: ["merchantName"],
      where: { householdId, type: "debit", merchantName: { not: null } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 10,
    }),
    db.transaction.groupBy({
      by: ["merchantName"],
      where: { householdId, type: "debit", merchantName: { not: null }, date: { gte: monthStart } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 10,
    }),
    db.transaction.findMany({
      where: { householdId },
      orderBy: { date: "desc" },
      take: 20,
      select: { date: true, description: true, amount: true, type: true, merchantName: true, currency: true },
    }),
    db.detectedSubscription.findMany({
      where: { householdId },
      select: { merchantName: true, amount: true, currency: true, frequency: true },
    }),
  ])

  const allCatIds = [
    ...catTotals.map((c) => c.categoryId),
    ...catTotalsMonth.map((c) => c.categoryId),
  ].filter(Boolean) as string[]
  const uniqueCatIds = [...new Set(allCatIds)]
  const cats = uniqueCatIds.length > 0
    ? await db.category.findMany({ where: { id: { in: uniqueCatIds } }, select: { id: true, name: true } })
    : []
  const catById = new Map(cats.map((c) => [c.id, c.name]))

  const spendingByCategory = catTotals
    .map((c) => `${catById.get(c.categoryId ?? "") ?? "Uncategorized"}: ${currency} ${(c._sum.amount ?? 0).toFixed(2)}`)
    .join("\n")

  const spendingByCategoryMonth = catTotalsMonth
    .map((c) => `${catById.get(c.categoryId ?? "") ?? "Uncategorized"}: ${currency} ${(c._sum.amount ?? 0).toFixed(2)}`)
    .join("\n")

  const topMerchantsText = topMerchants
    .map((m) => `${m.merchantName}: ${currency} ${(m._sum.amount ?? 0).toFixed(2)}`)
    .join("\n")

  const topMerchantsMonthText = topMerchantsMonth
    .map((m) => `${m.merchantName}: ${currency} ${(m._sum.amount ?? 0).toFixed(2)}`)
    .join("\n")

  const recentTxText = recentTx
    .map((t) => `${t.date.toISOString().slice(0, 10)} | ${t.type} | ${t.merchantName ?? t.description} | ${t.currency} ${t.amount.toFixed(2)}`)
    .join("\n")

  const subsText = subscriptions
    .map((s) => `${s.merchantName}: ${s.currency} ${s.amount.toFixed(2)}/${s.frequency}`)
    .join("\n")

  const monthLabel = now.toLocaleString("en", { month: "long", year: "numeric" })

  const context = `Today's date: ${now.toISOString().slice(0, 10)}
Current month: ${monthLabel} (starts ${monthStart.toISOString().slice(0, 10)})
Household currency: ${currency}

SPENDING BY CATEGORY — ${monthLabel}:
${spendingByCategoryMonth || "No data this month"}

TOP MERCHANTS — ${monthLabel}:
${topMerchantsMonthText || "No data this month"}

ALL-TIME SPENDING BY CATEGORY:
${spendingByCategory || "No data"}

TOP MERCHANTS ALL-TIME:
${topMerchantsText || "No data"}

RECENT TRANSACTIONS (last 20, most recent first):
${recentTxText || "No data"}

DETECTED SUBSCRIPTIONS:
${subsText || "None"}
`

  const systemPrompt = `You are a personal finance assistant. Answer questions about the user's spending based on the data provided.
Rules:
- Reply with a direct answer only — 2-4 sentences max
- Never show reasoning, bullet analysis, or intermediate steps
- Use the currency shown in the data
- If data is missing or insufficient, say so in one sentence and give your best estimate`

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: MODEL, systemInstruction: systemPrompt })
    const result = await model.generateContent(`${context}\n\nQuestion: ${parsed.data.question}`)
    const answer = result.response.text()

    if (billing) {
      db.householdBilling.update({
        where: { id: billing.id },
        data: { aiQueriesThisMonth: { increment: 1 } },
      }).catch(() => null)
    }

    const remaining = queryLimit === null ? null : queryLimit - usedQueries - 1
    return NextResponse.json({ answer, remaining, limit: queryLimit })
  } catch (err) {
    console.error("AI query error:", err)
    return NextResponse.json({ error: "Failed to process query" }, { status: 500 })
  }
}
