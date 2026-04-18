import { NextRequest, NextResponse } from "next/server"
import { db } from "@expensable/db"
import { getStripe } from "@/lib/stripe"
import type Stripe from "stripe"

function tierFromPriceId(priceId: string): "pro" | "family" | null {
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return "pro"
  if (priceId === process.env.STRIPE_FAMILY_PRICE_ID) return "family"
  return null
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
  }

  const stripe = getStripe()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session
        const householdId = checkoutSession.metadata?.householdId
        if (!householdId || !checkoutSession.subscription || !checkoutSession.customer) break

        const subscriptionId =
          typeof checkoutSession.subscription === "string"
            ? checkoutSession.subscription
            : checkoutSession.subscription.id
        const customerId =
          typeof checkoutSession.customer === "string"
            ? checkoutSession.customer
            : checkoutSession.customer.id

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0]?.price.id ?? ""
        const tier = tierFromPriceId(priceId)

        if (tier) {
          await db.householdBilling.upsert({
            where: { householdId },
            create: {
              householdId,
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
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const priceId = subscription.items.data[0]?.price.id ?? ""
        const tier = tierFromPriceId(priceId)

        if (tier) {
          await db.householdBilling.updateMany({
            where: { stripeSubscriptionId: subscription.id },
            data: { tier },
          })
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        await db.householdBilling.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: { tier: "free", stripeSubscriptionId: null },
        })
        break
      }
    }
  } catch {
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
