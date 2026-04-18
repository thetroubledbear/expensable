import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@expensable/db"
import { getStripe } from "@/lib/stripe"

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const membership = await db.householdMember.findFirst({
    where: { userId: session.user.id },
    include: { household: { include: { billing: true } } },
  })
  if (!membership?.household.billing?.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account found" }, { status: 400 })
  }

  const stripe = getStripe()

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: membership.household.billing.stripeCustomerId,
      return_url: `${process.env.NEXTAUTH_URL}/settings`,
    })
    return NextResponse.json({ url: portalSession.url })
  } catch {
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 })
  }
}
