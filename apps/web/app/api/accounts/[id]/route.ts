import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth/config"
import { db } from "@expensable/db"
import { resolveHousehold } from "@/lib/auth/household"

const ACCOUNT_TYPES = ["checking", "savings", "credit", "cash", "investment"] as const
const SUPPORTED_CURRENCIES = ["USD","EUR","GBP","CHF","CAD","AUD","JPY","NOK","SEK","DKK","NZD","SGD","HKD"] as const

const updateSchema = z.object({
  name: z.string().min(1).max(64).optional(),
  type: z.enum(ACCOUNT_TYPES).optional(),
  currency: z.enum(SUPPORTED_CURRENCIES).optional(),
  isDefault: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }) }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const membership = await resolveHousehold(session.user.id)
  if (!membership) return NextResponse.json({ error: "No household" }, { status: 404 })

  const existing = await db.financialAccount.findFirst({
    where: { id, householdId: membership.householdId },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { isDefault, ...rest } = parsed.data

  try {
    const account = await db.$transaction(async (tx) => {
      if (isDefault) {
        await tx.financialAccount.updateMany({
          where: { householdId: membership.householdId },
          data: { isDefault: false },
        })
      }
      return tx.financialAccount.update({
        where: { id },
        data: { ...rest, ...(isDefault !== undefined ? { isDefault } : {}) },
        include: { _count: { select: { transactions: true } } },
      })
    })
    return NextResponse.json(account)
  } catch (e) {
    if ((e as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "Account name already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const membership = await resolveHousehold(session.user.id)
  if (!membership) return NextResponse.json({ error: "No household" }, { status: 404 })
  if (membership.role !== "owner") {
    return NextResponse.json({ error: "Only owners can delete accounts" }, { status: 403 })
  }

  const account = await db.financialAccount.findFirst({
    where: { id, householdId: membership.householdId },
  })
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const total = await db.financialAccount.count({ where: { householdId: membership.householdId } })
  if (total <= 1) {
    return NextResponse.json({ error: "Cannot delete the last account" }, { status: 409 })
  }

  try {
    await db.$transaction(async (tx) => {
      // Promote next account to default before deleting
      if (account.isDefault) {
        const next = await tx.financialAccount.findFirst({
          where: { householdId: membership.householdId, id: { not: id } },
          orderBy: { createdAt: "asc" },
        })
        if (next) {
          await tx.financialAccount.update({ where: { id: next.id }, data: { isDefault: true } })
        }
      }
      await tx.financialAccount.delete({ where: { id } })
    })
    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
}
