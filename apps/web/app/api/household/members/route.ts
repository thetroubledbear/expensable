import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/session"
import { db } from "@expensable/db"
import { resolveHousehold } from "@/lib/auth/household"

export async function GET() {
  const session = await requireAuth()

  const membership = await resolveHousehold(session.user?.id!)

  if (!membership) {
    return NextResponse.json({ error: "No household" }, { status: 404 })
  }

  const members = await db.householdMember.findMany({
    where: { householdId: membership.householdId },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: { joinedAt: "asc" },
  })

  return NextResponse.json({
    members: members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      joinedAt: m.joinedAt,
      name: m.user.name,
      email: m.user.email,
      image: m.user.image,
    })),
    tier: membership.household.billing?.tier ?? "free",
    isOwner: membership.role === "owner",
  })
}
