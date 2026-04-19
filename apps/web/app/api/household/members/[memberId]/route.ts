import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/session"
import { db } from "@expensable/db"
import { resolveHousehold } from "@/lib/auth/household"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const session = await requireAuth()
  const { memberId } = await params

  const callerMembership = await resolveHousehold(session.user?.id!)

  if (!callerMembership || callerMembership.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const target = await db.householdMember.findFirst({
    where: { id: memberId, householdId: callerMembership.householdId },
  })

  if (!target) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 })
  }

  if (target.userId === session.user?.id!) {
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { role } = body as { role?: string }
  if (role !== "owner" && role !== "member") {
    return NextResponse.json({ error: "Role must be owner or member" }, { status: 400 })
  }

  await db.householdMember.update({ where: { id: memberId }, data: { role } })

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const session = await requireAuth()
  const { memberId } = await params

  const callerMembership = await resolveHousehold(session.user?.id!)

  if (!callerMembership || callerMembership.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const target = await db.householdMember.findFirst({
    where: { id: memberId, householdId: callerMembership.householdId },
  })

  if (!target) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 })
  }

  if (target.userId === session.user?.id!) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 })
  }

  await db.householdMember.delete({ where: { id: memberId } })

  return NextResponse.json({ success: true })
}
