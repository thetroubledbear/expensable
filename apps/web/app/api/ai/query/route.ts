import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth/config"
import { db } from "@expensable/db"
import { resolveHousehold } from "@/lib/auth/household"
import { PLANS } from "@expensable/types"
import Anthropic from "@anthropic-ai/sdk"

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

  // Reset monthly counter if calendar month has rolled over
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

  // Build a spending summary for context
  const [catTotals, topMerchants, recentTx, subscriptions] = await Promise.all([
    db.transaction.groupBy({
      by: ["categoryId"],
      where: { householdId, type: "debit" },
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

  const catIds = catTotals.map((c) => c.categoryId).filter(Boolean) as string[]
  const cats = catIds.length > 0
    ? await db.category.findMany({ where: { id: { in: catIds } }, select: { id: true, name: true } })
    : []
  const catById = new Map(cats.map((c) => [c.id, c.name]))

  const spendingByCategory = catTotals
    .map((c) => `${catById.get(c.categoryId ?? "") ?? "Uncategorized"}: ${currency} ${(c._sum.amount ?? 0).toFixed(2)}`)
    .join("\n")

  const topMerchantsText = topMerchants
    .map((m) => `${m.merchantName}: ${currency} ${(m._sum.amount ?? 0).toFixed(2)}`)
    .join("\n")

  const recentTxText = recentTx
    .map((t) => `${t.date.toISOString().slice(0, 10)} | ${t.type} | ${t.merchantName ?? t.description} | ${t.currency} ${t.amount.toFixed(2)}`)
    .join("\n")

  const subsText = subscriptions
    .map((s) => `${s.merchantName}: ${s.currency} ${s.amount.toFixed(2)}/${s.frequency}`)
    .join("\n")

  const context = `Household financial data (currency: ${currency}):

ALL-TIME SPENDING BY CATEGORY:
${spendingByCategory || "No data"}

TOP MERCHANTS ALL-TIME:
${topMerchantsText || "No data"}

RECENT TRANSACTIONS (last 20):
${recentTxText || "No data"}

DETECTED SUBSCRIPTIONS:
${subsText || "None"}
`

  const systemPrompt = `You are a personal finance assistant. Answer questions about the user's spending based on the data provided. Be concise (2-4 sentences max). Use the same currency shown in the data. If the data doesn't support a precise answer, give your best estimate and say so.`
  const userContent = `${context}\n\nQuestion: ${parsed.data.question}`

  try {
    let answer: string

    if (process.env.ANTHROPIC_API_KEY) {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 512,
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }],
      })
      answer = message.content[0].type === "text" ? message.content[0].text : "Unable to generate answer."
    } else {
      const ollamaBase = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434"
      const ollamaModel = process.env.OLLAMA_MODEL ?? "gemma4:e4b"
      const res = await fetch(`${ollamaBase}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: ollamaModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          stream: false,
        }),
      })
      if (!res.ok) throw new Error(`Ollama error ${res.status}`)
      const data = await res.json()
      answer = data.message?.content ?? "Unable to generate answer."
    }

    // Increment usage counter (fire-and-forget, don't block response)
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
