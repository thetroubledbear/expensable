import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth/config"
import { db } from "@expensable/db"
import { resolveHousehold } from "@/lib/auth/household"

const createSchema = z.object({
  categoryId: z.string().cuid().nullable().optional(),
  amount: z.number().positive(),
  period: z.enum(["monthly", "annual"]).default("monthly"),
  aiSuggested: z.boolean().default(false),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const membership = await resolveHousehold(session.user.id)
  if (!membership) return NextResponse.json([])

  const budgets = await db.budget.findMany({
    where: { householdId: membership.householdId },
    include: { category: { select: { id: true, name: true, icon: true, color: true } } },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(budgets)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }) }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const membership = await resolveHousehold(session.user.id)
  if (!membership) return NextResponse.json({ error: "No household" }, { status: 404 })

  try {
    const categoryId = parsed.data.categoryId ?? null
    const existing = await db.budget.findFirst({
      where: { householdId: membership.householdId, categoryId },
    })

    const budget = existing
      ? await db.budget.update({
          where: { id: existing.id },
          data: { amount: parsed.data.amount, period: parsed.data.period, aiSuggested: parsed.data.aiSuggested ?? false },
          include: { category: { select: { id: true, name: true, icon: true, color: true } } },
        })
      : await db.budget.create({
          data: { householdId: membership.householdId, categoryId, amount: parsed.data.amount, period: parsed.data.period, aiSuggested: parsed.data.aiSuggested ?? false },
          include: { category: { select: { id: true, name: true, icon: true, color: true } } },
        })
    return NextResponse.json(budget, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to save budget" }, { status: 500 })
  }
}
