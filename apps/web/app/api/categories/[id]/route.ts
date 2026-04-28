import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@expensable/db"
import { resolveHousehold } from "@/lib/auth/household"

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const membership = await resolveHousehold(session.user.id)
  if (!membership) return NextResponse.json({ error: "No household" }, { status: 404 })
  if (membership.role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params

  const category = await db.category.findUnique({ where: { id } })
  if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (category.isSystem || category.householdId !== membership.householdId) {
    return NextResponse.json({ error: "Cannot delete system categories" }, { status: 403 })
  }

  await db.category.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
