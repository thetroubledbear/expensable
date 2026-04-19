import { NextRequest, NextResponse } from "next/server"
import { db } from "@expensable/db"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { auth } from "@/lib/auth/config"
import { PLANS, type PlanTier } from "@expensable/types"

// GET /api/invite/[token] — public, returns invite info
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const invite = await db.householdInvite.findUnique({
    where: { token },
    include: { household: { select: { name: true } } },
  })

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 })
  }

  if (invite.usedAt) {
    return NextResponse.json({ error: "Invite already used" }, { status: 410 })
  }

  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invite expired" }, { status: 410 })
  }

  return NextResponse.json({
    householdName: invite.household.name,
    expiresAt: invite.expiresAt,
  })
}

// POST /api/invite/[token] — accept (logged-in user) or register+accept (new user)
const acceptSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("accept") }),
  z.object({
    mode: z.literal("register"),
    name: z.string().min(1).max(128),
    email: z.string().email().max(254),
    password: z.string().min(8).max(128),
  }),
])

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = acceptSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const invite = await db.householdInvite.findUnique({
    where: { token },
    include: {
      household: {
        include: { billing: true, members: true },
      },
    },
  })

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 })
  }
  if (invite.usedAt) {
    return NextResponse.json({ error: "Invite already used" }, { status: 410 })
  }
  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invite expired" }, { status: 410 })
  }

  const tier = (invite.household.billing?.tier ?? "free") as PlanTier
  const plan = PLANS[tier]
  if (invite.household.members.length >= plan.maxHouseholdMembers) {
    return NextResponse.json({ error: "Household is full" }, { status: 400 })
  }

  if (parsed.data.mode === "accept") {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const userId = session.user.id

    // Already a member?
    const existing = await db.householdMember.findUnique({
      where: { householdId_userId: { householdId: invite.householdId, userId } },
    })
    if (existing) {
      return NextResponse.json({ error: "Already a member" }, { status: 400 })
    }

    await db.$transaction([
      db.householdMember.create({
        data: { householdId: invite.householdId, userId, role: "member" },
      }),
      db.householdInvite.update({
        where: { token },
        data: { usedAt: new Date(), usedBy: userId },
      }),
    ])

    return NextResponse.json({ success: true })
  }

  // mode === "register"
  const { name, email, password } = parsed.data

  const existingUser = await db.user.findUnique({ where: { email } })
  if (existingUser) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name, email, passwordHash },
    })
    await tx.householdMember.create({
      data: { householdId: invite.householdId, userId: user.id, role: "member" },
    })
    await tx.householdInvite.update({
      where: { token },
      data: { usedAt: new Date(), usedBy: user.id },
    })
    return user
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
