import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth/config"
import { db } from "@expensable/db"

const SUPPORTED_CURRENCIES = ["USD","EUR","GBP","CHF","CAD","AUD","JPY","NOK","SEK","DKK","NZD","SGD","HKD"] as const

const patchSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  defaultCurrency: z.enum(SUPPORTED_CURRENCIES).optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const membership = await db.householdMember.findFirst({
      where: { userId: session.user.id },
      include: { household: true },
    })
    if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(membership.household)
  } catch {
    return NextResponse.json({ error: "Failed to retrieve household" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

  if (!parsed.data.name && !parsed.data.defaultCurrency) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
  }

  try {
    const membership = await db.householdMember.findFirst({
      where: { userId: session.user.id, role: "owner" },
    })
    if (!membership) {
      return NextResponse.json({ error: "Only the household owner can change settings" }, { status: 403 })
    }

    const updated = await db.household.update({
      where: { id: membership.householdId },
      data: parsed.data,
    })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Failed to update household" }, { status: 500 })
  }
}
