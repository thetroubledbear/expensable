import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { resolveHousehold } from "@/lib/auth/household"
import { generateBudgetSuggestions } from "@/lib/ai/budget-suggestions"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const membership = await resolveHousehold(session.user.id)
  if (!membership) return NextResponse.json([])

  const currency = membership.household.defaultCurrency

  try {
    const suggestions = await generateBudgetSuggestions(membership.householdId, currency)
    return NextResponse.json(suggestions)
  } catch {
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 })
  }
}
