import { db } from "@expensable/db"

const MIN_SPAN_DAYS = 28 // must span at least 28 days to be considered recurring

export async function detectSubscriptions(householdId: string): Promise<void> {
  const transactions = await db.transaction.findMany({
    where: { householdId, type: "debit", merchantName: { not: null } },
    select: { merchantName: true, amount: true, date: true, categoryId: true, currency: true },
    orderBy: { date: "asc" },
  })

  const byMerchant = new Map<
    string,
    { amounts: number[]; dates: Date[]; categoryId: string | null; currencies: string[] }
  >()

  for (const tx of transactions) {
    const name = tx.merchantName!
    const entry = byMerchant.get(name)
    if (entry) {
      entry.amounts.push(tx.amount)
      entry.dates.push(tx.date)
      entry.currencies.push(tx.currency)
    } else {
      byMerchant.set(name, {
        amounts: [tx.amount],
        dates: [tx.date],
        categoryId: tx.categoryId,
        currencies: [tx.currency],
      })
    }
  }

  const now = new Date()

  for (const [merchantName, { amounts, dates, categoryId, currencies }] of byMerchant) {
    if (amounts.length < 2) continue

    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length
    const stdDev = Math.sqrt(
      amounts.reduce((a, b) => a + (b - mean) ** 2, 0) / amounts.length
    )
    if (stdDev / mean > 0.15) continue

    const monthSet = new Set(dates.map((d) => `${d.getFullYear()}-${d.getMonth()}`))
    if (monthSet.size < 2) continue

    const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime())

    // Require at least MIN_SPAN_DAYS between first and last occurrence
    const spanDays = (sortedDates[sortedDates.length - 1].getTime() - sortedDates[0].getTime()) / 86400000
    if (spanDays < MIN_SPAN_DAYS) continue

    const lastSeenAt = sortedDates[sortedDates.length - 1]
    const daysSinceLast = (now.getTime() - lastSeenAt.getTime()) / 86400000
    if (daysSinceLast > 90) continue

    const frequency = detectFrequency(sortedDates)

    // Use the most common currency across this merchant's transactions
    const currencyCount = new Map<string, number>()
    for (const c of currencies) currencyCount.set(c, (currencyCount.get(c) ?? 0) + 1)
    const currency = [...currencyCount.entries()].sort((a, b) => b[1] - a[1])[0][0]

    await db.detectedSubscription.upsert({
      where: { householdId_merchantName: { householdId, merchantName } },
      update: { amount: mean, currency, frequency, lastSeenAt },
      create: {
        householdId,
        merchantName,
        amount: mean,
        currency,
        frequency,
        categoryId,
        firstSeenAt: sortedDates[0],
        lastSeenAt,
      },
    })
  }
}

function detectFrequency(sortedDates: Date[]): "monthly" | "annual" | "weekly" {
  if (sortedDates.length < 2) return "monthly"
  let total = 0
  for (let i = 1; i < sortedDates.length; i++) {
    total += (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) / 86400000
  }
  const avg = total / (sortedDates.length - 1)
  if (avg <= 10) return "weekly"
  if (avg >= 300) return "annual"
  return "monthly"
}
