import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth/config"
import { db } from "@expensable/db"
import { resolveHousehold } from "@/lib/auth/household"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const membership = await resolveHousehold(session.user.id)
  if (!membership) return NextResponse.json([])

  try {
    const subs = await db.detectedSubscription.findMany({
      where: { householdId: membership.householdId },
      orderBy: { amount: "desc" },
    })
    return NextResponse.json(subs)
  } catch {
    return NextResponse.json({ error: "Failed to retrieve subscriptions" }, { status: 500 })
  }
}

const createSchema = z.object({
  merchantName: z.string().min(1).max(200),
  amount: z.number().positive().max(100_000_000),
  currency: z.string().length(3),
  frequency: z.enum(["monthly", "weekly", "annual"]),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const membership = await resolveHousehold(session.user.id)
  if (!membership) return NextResponse.json({ error: "No household" }, { status: 404 })
  if (membership.role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }) }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const now = new Date()
  try {
    const sub = await db.detectedSubscription.upsert({
      where: { householdId_merchantName: { householdId: membership.householdId, merchantName: parsed.data.merchantName } },
      create: {
        householdId: membership.householdId,
        merchantName: parsed.data.merchantName,
        amount: parsed.data.amount,
        currency: parsed.data.currency,
        frequency: parsed.data.frequency,
        firstSeenAt: now,
        lastSeenAt: now,
      },
      update: {
        amount: parsed.data.amount,
        currency: parsed.data.currency,
        frequency: parsed.data.frequency,
        lastSeenAt: now,
      },
    })
    return NextResponse.json(sub, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 })
  }
}
