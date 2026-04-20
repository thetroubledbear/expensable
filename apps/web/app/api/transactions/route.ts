import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth/config"
import { db, Prisma } from "@expensable/db"
import { resolveHousehold } from "@/lib/auth/household"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const sp = req.nextUrl.searchParams
  const page = Math.max(1, parseInt(sp.get("page") ?? "1"))
  const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") ?? "25")))
  const search = sp.get("search")?.trim().slice(0, 100) ?? ""
  const type = sp.get("type")
  const categoryId = sp.get("categoryId")
  const needsReview = sp.get("needsReview") === "true"
  const accountId = sp.get("accountId")

  try {
    const membership = await resolveHousehold(session.user.id)
    if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const where: Prisma.TransactionWhereInput = {
      householdId: membership.householdId,
    }

    if (type === "debit" || type === "credit") where.type = type
    if (needsReview) where.needsReview = true
    if (categoryId === "uncategorized") where.categoryId = null
    else if (categoryId) where.categoryId = categoryId
    if (accountId === "none") where.financialAccountId = null
    else if (accountId) where.financialAccountId = accountId
    if (search) {
      where.OR = [
        { merchantName: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    const [data, total] = await Promise.all([
      db.transaction.findMany({
        where,
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { id: true, name: true, icon: true, color: true } },
          financialAccount: { select: { id: true, name: true, type: true } },
        },
      }),
      db.transaction.count({ where }),
    ])

    return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
  } catch {
    return NextResponse.json({ error: "Failed to retrieve transactions" }, { status: 500 })
  }
}

const SUPPORTED_CURRENCIES = ["USD","EUR","GBP","CHF","CAD","AUD","JPY","NOK","SEK","DKK","NZD","SGD","HKD"] as const

const createSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().min(1).max(500),
  merchantName: z.string().max(200).optional().nullable(),
  amount: z.number().positive().max(100_000_000),
  type: z.enum(["debit", "credit"]),
  currency: z.enum(SUPPORTED_CURRENCIES),
  categoryId: z.string().cuid().optional().nullable(),
  financialAccountId: z.string().cuid().optional().nullable(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const membership = await resolveHousehold(session.user.id)
  if (!membership) return NextResponse.json({ error: "No household" }, { status: 404 })

  const { date, description, merchantName, amount, type, currency, categoryId, financialAccountId } = parsed.data

  // Validate account belongs to household if provided
  if (financialAccountId) {
    const acct = await db.financialAccount.findFirst({
      where: { id: financialAccountId, householdId: membership.householdId },
    })
    if (!acct) return NextResponse.json({ error: "Invalid account" }, { status: 400 })
  }

  try {
    const tx = await db.transaction.create({
      data: {
        householdId: membership.householdId,
        date: new Date(date),
        description,
        merchantName: merchantName ?? null,
        amount,
        type,
        currency,
        categoryId: categoryId ?? null,
        financialAccountId: financialAccountId ?? null,
        needsReview: false,
      },
      include: { category: { select: { id: true, name: true, icon: true, color: true } } },
    })
    return NextResponse.json(tx, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 })
  }
}

const deleteSchema = z.object({ ids: z.array(z.string()).min(1).max(200) })

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = deleteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  try {
    const membership = await resolveHousehold(session.user.id)
    if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (membership.role !== "owner") {
      return NextResponse.json({ error: "Only household owners can delete transactions" }, { status: 403 })
    }

    await db.transaction.deleteMany({
      where: { id: { in: parsed.data.ids }, householdId: membership.householdId },
    })

    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: "Failed to delete transactions" }, { status: 500 })
  }
}
