import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/session"
import { db } from "@expensable/db"
import { resolveHousehold } from "@/lib/auth/household"
import { PLANS, type PlanTier } from "@expensable/types"

export async function POST() {
  const session = await requireAuth()

  const baseMembership = await resolveHousehold(session.user?.id!)
  const membership = baseMembership
    ? await db.householdMember.findFirst({
        where: { id: baseMembership.id },
        include: { household: { include: { billing: true, members: true } } },
      })
    : null

  if (!membership || membership.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const tier = (membership.household.billing?.tier ?? "free") as PlanTier
  if (tier !== "family") {
    return NextResponse.json(
      { error: "Invites require a Family plan" },
      { status: 403 }
    )
  }

  const plan = PLANS[tier]
  const currentCount = membership.household.members.length
  if (currentCount >= plan.maxHouseholdMembers) {
    return NextResponse.json(
      { error: `Household is full (max ${plan.maxHouseholdMembers} members)` },
      { status: 400 }
    )
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const invite = await db.householdInvite.create({
    data: {
      householdId: membership.householdId,
      createdBy: session.user?.id!,
      expiresAt,
    },
  })

  return NextResponse.json({ token: invite.token, expiresAt: invite.expiresAt })
}
