import { NextRequest, NextResponse } from "next/server"
import { db } from "@expensable/db"
import { getStripe } from "@/lib/stripe"
import type Stripe from "stripe"

function tierFromPriceId(priceId: string): "pro" | "family" | null {
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return "pro"
  if (priceId === process.env.STRIPE_FAMILY_PRICE_ID) return "family"
  return null
}

export async function GET(req: NextRequest) {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
  const sessionId = req.nextUrl.searchParams.get("session_id")

  if (!sessionId) {
    return NextResponse.redirect(`${base}/settings`)
  }

  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (
      session.payment_status === "paid" &&
      session.subscription &&
      session.metadata?.householdId
    ) {
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : (session.subscription as Stripe.Subscription).id
      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : (session.customer as Stripe.Customer | null)?.id ?? null

      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      const priceId = subscription.items.data[0]?.price.id ?? ""
      const tier = tierFromPriceId(priceId)

      if (tier) {
        await db.householdBilling.upsert({
          where: { householdId: session.metadata.householdId },
          create: {
            householdId: session.metadata.householdId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            tier,
          },
          update: {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            tier,
          },
        })
      }
    }
  } catch {
    // Redirect anyway — webhook will still fire in production
  }

  return NextResponse.redirect(`${base}/settings?upgraded=1`)
}
