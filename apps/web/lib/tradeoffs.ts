// Spending trade-off context — pure math, no API needed
// Uses category monthly averages to express an amount in relatable terms

export interface Tradeoff {
  label: string   // "about 3 days of groceries"
  emoji: string
}

export function computeTradeoffs(
  amount: number,
  currency: string,
  categoryAverages: Record<string, number> // category name → monthly avg spend
): Tradeoff[] {
  const results: Tradeoff[] = []
  const daysInMonth = 30

  const food = categoryAverages["Food & Drink"]
  const transport = categoryAverages["Transport"]
  const entertainment = categoryAverages["Entertainment"]
  const shopping = categoryAverages["Shopping"]

  if (food && food > 0) {
    const dailyFood = food / daysInMonth
    const days = amount / dailyFood
    if (days >= 0.5 && days <= 60) {
      const rounded = days < 2 ? Math.round(days * 10) / 10 : Math.round(days)
      results.push({ label: `${rounded} day${rounded !== 1 ? "s" : ""} of groceries`, emoji: "🛒" })
    }
  }

  if (transport && transport > 0) {
    const dailyTransport = transport / daysInMonth
    const days = amount / dailyTransport
    if (days >= 0.5 && days <= 30) {
      const rounded = Math.round(days)
      results.push({ label: `${rounded} day${rounded !== 1 ? "s" : ""} of commuting`, emoji: "🚌" })
    }
  }

  if (entertainment && entertainment > 0) {
    const pct = Math.round((amount / entertainment) * 100)
    if (pct >= 5 && pct <= 200) {
      results.push({ label: `${pct}% of your monthly entertainment`, emoji: "🎬" })
    }
  }

  if (shopping && shopping > 0) {
    const pct = Math.round((amount / shopping) * 100)
    if (pct >= 5 && pct <= 200) {
      results.push({ label: `${pct}% of your monthly shopping`, emoji: "🛍️" })
    }
  }

  // Currency-specific relatable amounts
  const coffeePrice = currency === "JPY" ? 500 : currency === "GBP" ? 3.5 : 4
  const coffees = Math.round(amount / coffeePrice)
  if (coffees >= 1 && coffees <= 50) {
    results.push({ label: `${coffees} coffee${coffees !== 1 ? "s" : ""}`, emoji: "☕" })
  }

  return results.slice(0, 3)
}
