import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@expensable/db"
import { resolveHousehold } from "@/lib/auth/household"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const membership = await resolveHousehold(session.user.id)
  if (!membership) return NextResponse.json({ notifications: [], unreadCount: 0 })

  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { householdId: membership.householdId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.notification.count({
      where: { householdId: membership.householdId, read: false },
    }),
  ])

  return NextResponse.json({ notifications, unreadCount })
}

export async function PATCH() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const membership = await resolveHousehold(session.user.id)
  if (!membership) return NextResponse.json({ error: "No household" }, { status: 404 })

  await db.notification.updateMany({
    where: { householdId: membership.householdId, read: false },
    data: { read: true },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const membership = await resolveHousehold(session.user.id)
  if (!membership) return NextResponse.json({ error: "No household" }, { status: 404 })

  await db.notification.deleteMany({ where: { householdId: membership.householdId } })
  return new NextResponse(null, { status: 204 })
}
