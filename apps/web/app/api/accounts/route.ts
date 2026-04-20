import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth/config"
import { db } from "@expensable/db"
import { resolveHousehold } from "@/lib/auth/household"

const ACCOUNT_TYPES = ["checking", "savings", "credit", "cash", "investment"] as const
const SUPPORTED_CURRENCIES = ["USD","EUR","GBP","CHF","CAD","AUD","JPY","NOK","SEK","DKK","NZD","SGD","HKD"] as const

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const membership = await resolveHousehold(session.user.id)
    if (!membership) return NextResponse.json([])

    let accounts = await db.financialAccount.findMany({
      where: { householdId: membership.householdId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      include: { _count: { select: { transactions: true } } },
    })

    if (accounts.length === 0) {
      const defaultAccount = await db.financialAccount.create({
        data: {
          householdId: membership.householdId,
          name: "Checking",
          type: "checking",
          isDefault: true,
          currency: membership.household.defaultCurrency,
        },
        include: { _count: { select: { transactions: true } } },
      })
      accounts = [defaultAccount]
    }

    return NextResponse.json(accounts)
  } catch {
    return NextResponse.json({ error: "Failed to retrieve accounts" }, { status: 500 })
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(64),
  type: z.enum(ACCOUNT_TYPES),
  currency: z.enum(SUPPORTED_CURRENCIES),
  isDefault: z.boolean().default(false),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }) }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const membership = await resolveHousehold(session.user.id)
  if (!membership) return NextResponse.json({ error: "No household" }, { status: 404 })

  const { name, type, currency, isDefault } = parsed.data

  try {
    const account = await db.$transaction(async (tx) => {
      if (isDefault) {
        await tx.financialAccount.updateMany({
          where: { householdId: membership.householdId },
          data: { isDefault: false },
        })
      }
      return tx.financialAccount.create({
        data: { householdId: membership.householdId, name, type, currency, isDefault },
        include: { _count: { select: { transactions: true } } },
      })
    })
    return NextResponse.json(account, { status: 201 })
  } catch (e) {
    if ((e as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "Account name already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
  }
}
