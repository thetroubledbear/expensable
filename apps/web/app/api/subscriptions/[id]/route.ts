import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@expensable/db"
import { resolveHousehold } from "@/lib/auth/household"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const membership = await resolveHousehold(session.user.id)
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (membership.role !== "owner") {
    return NextResponse.json({ error: "Only household owners can dismiss subscriptions" }, { status: 403 })
  }

  try {
    // IDOR: verify subscription belongs to user's household
    const sub = await db.detectedSubscription.findFirst({
      where: { id, householdId: membership.householdId },
    })
    if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await db.detectedSubscription.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete subscription" }, { status: 500 })
  }
}
