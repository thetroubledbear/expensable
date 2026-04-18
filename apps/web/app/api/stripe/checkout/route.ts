import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@expensable/db"
import { getStripe, getPriceId } from "@/lib/stripe"
import { z } from "zod"

const schema = z.object({
  tier: z.enum(["pro", "family"]),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const { tier } = parsed.data
  const priceId = getPriceId(tier)
  if (!priceId) {
    return NextResponse.json(
      { error: `STRIPE_${tier.toUpperCase()}_PRICE_ID is not set in env` },
      { status: 500 }
    )
  }

  const membership = await db.householdMember.findFirst({
    where: { userId: session.user.id },
    include: { household: { include: { billing: true } } },
  })
  if (!membership) {
    return NextResponse.json({ error: "No household found" }, { status: 400 })
  }

  const { household } = membership
  const user = session.user as { id: string; email?: string | null; name?: string | null }
  const stripe = getStripe()

  try {
    let customerId = household.billing?.stripeCustomerId ?? undefined
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: user.name ?? undefined,
        metadata: { householdId: household.id },
      })
      customerId = customer.id
      await db.householdBilling.upsert({
        where: { householdId: household.id },
        create: { householdId: household.id, stripeCustomerId: customerId },
        update: { stripeCustomerId: customerId },
      })
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXTAUTH_URL}/api/stripe/session-complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/settings`,
      metadata: { householdId: household.id },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create checkout session"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
