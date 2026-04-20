import Anthropic from "@anthropic-ai/sdk"
import { db } from "@expensable/db"
import { CATEGORY_COLOR_MAP } from "@/lib/categories"

export interface BudgetSuggestion {
  categoryId: string
  categoryName: string
  color: string
  currentAvgMonthly: number
  suggestedBudget: number
  reasoning: string
}

function fallback(avgMonthly: number): number {
  return Math.round(avgMonthly * 0.9)
}

export async function generateBudgetSuggestions(
  householdId: string,
  currency: string
): Promise<BudgetSuggestion[]> {
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const catTotals = await db.transaction.groupBy({
    by: ["categoryId"],
    where: {
      householdId,
      type: "debit",
      date: { gte: threeMonthsAgo },
      categoryId: { not: null },
    },
    _sum: { amount: true },
  })

  if (catTotals.length === 0) return []

  const cats = await db.category.findMany({
    where: { id: { in: catTotals.map((c) => c.categoryId!).filter(Boolean) } },
  })
  const catById = new Map(cats.map((c) => [c.id, c]))

  const spending = catTotals
    .filter((c) => c.categoryId && catById.has(c.categoryId))
    .map((c) => ({
      categoryId: c.categoryId!,
      name: catById.get(c.categoryId!)!.name,
      rawColor: catById.get(c.categoryId!)!.color,
      avgMonthly: Math.round(((c._sum.amount ?? 0) / 3) * 100) / 100,
    }))
    .filter((c) => c.name !== "Income" && c.avgMonthly > 0)

  if (spending.length === 0) return []

  if (!process.env.ANTHROPIC_API_KEY) {
    return spending.map((s) => ({
      categoryId: s.categoryId,
      categoryName: s.name,
      color: CATEGORY_COLOR_MAP[s.rawColor] ?? s.rawColor ?? "#94a3b8",
      currentAvgMonthly: s.avgMonthly,
      suggestedBudget: fallback(s.avgMonthly),
      reasoning: "Suggested 10% below your 3-month average to encourage savings.",
    }))
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const spendingText = spending
    .map((s) => `${s.name}: ${currency} ${s.avgMonthly}/mo (3-month avg)`)
    .join("\n")

  let aiByName = new Map<string, { suggestedBudget: number; reasoning: string }>()

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Based on this household's spending data (currency: ${currency}), suggest realistic monthly budgets. Return JSON array only, no other text:

${spendingText}

Return: [{"categoryName": "...", "suggestedBudget": 123, "reasoning": "one sentence, practical advice"}]

Rules:
- Aim for 5-15% reduction where there is obvious room; match current spending if already lean
- Never suggest 0 or negative
- Keep reasoning under 15 words`,
        },
      ],
    })

    const text = message.content[0].type === "text" ? message.content[0].text : "[]"
    const match = text.match(/\[[\s\S]*\]/)
    if (match) {
      type AIRow = { categoryName: string; suggestedBudget: number; reasoning: string }
      const rows: AIRow[] = JSON.parse(match[0])
      aiByName = new Map(rows.map((r) => [r.categoryName, r]))
    }
  } catch {
    // fall through to default
  }

  return spending.map((s) => {
    const ai = aiByName.get(s.name)
    return {
      categoryId: s.categoryId,
      categoryName: s.name,
      color: CATEGORY_COLOR_MAP[s.rawColor] ?? s.rawColor ?? "#94a3b8",
      currentAvgMonthly: s.avgMonthly,
      suggestedBudget: ai?.suggestedBudget ?? fallback(s.avgMonthly),
      reasoning: ai?.reasoning ?? "Suggested 10% below your 3-month average.",
    }
  })
}
