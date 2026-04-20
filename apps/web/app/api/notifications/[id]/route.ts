import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@expensable/db"
import { resolveHousehold } from "@/lib/auth/household"

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const membership = await resolveHousehold(session.user.id)
  if (!membership) return NextResponse.json({ error: "No household" }, { status: 404 })

  const notification = await db.notification.findFirst({
    where: { id, householdId: membership.householdId },
  })
  if (!notification) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const updated = await db.notification.update({ where: { id }, data: { read: true } })
  return NextResponse.json(updated)
}
