import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth/config"
import { db } from "@expensable/db"

const patchSchema = z.object({
  categoryId: z.string().cuid().nullable().optional(),
  needsReview: z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  if (typeof id !== "string" || id.length === 0 || id.length > 128) {
    return NextResponse.json({ error: "Invalid transaction ID" }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  if (parsed.data.categoryId === undefined && parsed.data.needsReview === undefined) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
  }

  try {
    const tx = await db.transaction.findUnique({ where: { id } })
    if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const membership = await db.householdMember.findFirst({
      where: { userId: session.user.id, householdId: tx.householdId },
    })
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    // Validate category exists if provided (non-null)
    if (parsed.data.categoryId) {
      const cat = await db.category.findUnique({ where: { id: parsed.data.categoryId } })
      if (!cat) return NextResponse.json({ error: "Category not found" }, { status: 400 })
    }

    const updated = await db.transaction.update({
      where: { id },
      data: {
        ...(parsed.data.categoryId !== undefined ? { categoryId: parsed.data.categoryId } : {}),
        ...(parsed.data.needsReview !== undefined ? { needsReview: parsed.data.needsReview } : {}),
      },
      include: {
        category: { select: { id: true, name: true, icon: true, color: true } },
      },
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 })
  }
}
