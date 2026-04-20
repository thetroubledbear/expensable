import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth/config"
import { db } from "@expensable/db"
import { resolveHousehold } from "@/lib/auth/household"
import { ensureCategories } from "@/lib/categories"

const SUPPORTED_CURRENCIES = ["USD","EUR","GBP","CHF","CAD","AUD","JPY","NOK","SEK","DKK","NZD","SGD","HKD"] as const

const transferSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((d) => !isNaN(Date.parse(d)), { message: "Invalid date" }),
  description: z.string().min(1).max(500),
  amount: z.number().positive().max(100_000_000),
  currency: z.enum(SUPPORTED_CURRENCIES),
  fromAccountId: z.string().cuid(),
  toAccountId: z.string().cuid(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }) }

  const parsed = transferSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const membership = await resolveHousehold(session.user.id)
  if (!membership) return NextResponse.json({ error: "No household" }, { status: 404 })

  const { date, description, amount, currency, fromAccountId, toAccountId } = parsed.data

  if (fromAccountId === toAccountId) {
    return NextResponse.json({ error: "From and to accounts must be different" }, { status: 400 })
  }

  // Validate both accounts belong to household
  const accounts = await db.financialAccount.findMany({
    where: { id: { in: [fromAccountId, toAccountId] }, householdId: membership.householdId },
    select: { id: true },
  })
  if (accounts.length !== 2) {
    return NextResponse.json({ error: "Invalid account(s)" }, { status: 400 })
  }

  await ensureCategories()
  const transferCategory = await db.category.findFirst({ where: { name: "Bills & Utilities" } })

  const transferPairId = crypto.randomUUID()
  const parsedDate = new Date(date)

  try {
    const [debit, credit] = await db.$transaction([
      db.transaction.create({
        data: {
          householdId: membership.householdId,
          date: parsedDate,
          description: `Transfer: ${description}`,
          amount,
          currency,
          type: "debit",
          financialAccountId: fromAccountId,
          transferPairId,
          categoryId: null,
          needsReview: false,
        },
        include: {
          category: { select: { id: true, name: true, icon: true, color: true } },
          financialAccount: { select: { id: true, name: true, type: true } },
        },
      }),
      db.transaction.create({
        data: {
          householdId: membership.householdId,
          date: parsedDate,
          description: `Transfer: ${description}`,
          amount,
          currency,
          type: "credit",
          financialAccountId: toAccountId,
          transferPairId,
          categoryId: null,
          needsReview: false,
        },
        include: {
          category: { select: { id: true, name: true, icon: true, color: true } },
          financialAccount: { select: { id: true, name: true, type: true } },
        },
      }),
    ])

    void transferCategory // used for future category linking
    return NextResponse.json({ debit, credit, transferPairId }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to create transfer" }, { status: 500 })
  }
}
