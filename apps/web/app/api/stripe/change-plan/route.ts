import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@expensable/db"
import { resolveHousehold } from "@/lib/auth/household"
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

  const membership = await resolveHousehold(session.user.id)
  if (!membership || membership.role !== "owner") {
    return NextResponse.json({ error: "Only the owner can manage billing" }, { status: 403 })
  }

  const billing = membership.household.billing
  if (!billing?.stripeSubscriptionId) {
    return NextResponse.json({ error: "No active subscription found" }, { status: 400 })
  }

  if (billing.tier === tier) {
    return NextResponse.json({ error: "Already on this plan" }, { status: 400 })
  }

  const stripe = getStripe()

  try {
    const subscription = await stripe.subscriptions.retrieve(billing.stripeSubscriptionId)
    const itemId = subscription.items.data[0]?.id
    if (!itemId) {
      return NextResponse.json({ error: "Subscription item not found" }, { status: 500 })
    }

    await stripe.subscriptions.update(billing.stripeSubscriptionId, {
      items: [{ id: itemId, price: priceId }],
      proration_behavior: "always_invoice",
    })

    await db.householdBilling.update({
      where: { id: billing.id },
      data: { tier },
    })

    return NextResponse.json({ success: true, tier })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to change plan"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
