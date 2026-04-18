import Stripe from "stripe"

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error("STRIPE_SECRET_KEY not configured")
    _stripe = new Stripe(key)
  }
  return _stripe
}

export const PRICE_IDS: Record<"pro" | "family", string> = {
  pro: process.env.STRIPE_PRO_PRICE_ID ?? "",
  family: process.env.STRIPE_FAMILY_PRICE_ID ?? "",
}
