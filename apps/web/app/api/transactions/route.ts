import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth/config"
import { db, Prisma } from "@expensable/db"

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

  try {
    const membership = await db.householdMember.findFirst({
      where: { userId: session.user.id },
    })
    if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const where: Prisma.TransactionWhereInput = {
      householdId: membership.householdId,
    }

    if (type === "debit" || type === "credit") where.type = type
    if (needsReview) where.needsReview = true
    if (categoryId === "uncategorized") where.categoryId = null
    else if (categoryId) where.categoryId = categoryId
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
        },
      }),
      db.transaction.count({ where }),
    ])

    return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
  } catch {
    return NextResponse.json({ error: "Failed to retrieve transactions" }, { status: 500 })
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
    const membership = await db.householdMember.findFirst({
      where: { userId: session.user.id },
    })
    if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await db.transaction.deleteMany({
      where: { id: { in: parsed.data.ids }, householdId: membership.householdId },
    })

    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: "Failed to delete transactions" }, { status: 500 })
  }
}
