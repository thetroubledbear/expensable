import { NextResponse } from "next/server"
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
