import { db } from "@expensable/db"

type NotificationInput = {
  householdId: string
  type: string
  title: string
  body: string
  metadata: string
}

export async function detectAnomalies(householdId: string, newTxIds: string[]): Promise<void> {
  if (newTxIds.length === 0) return

  const newTxs = await db.transaction.findMany({
    where: { id: { in: newTxIds } },
    select: {
      id: true,
      merchantName: true,
      description: true,
      amount: true,
      type: true,
      date: true,
      currency: true,
    },
  })

  const notifications: NotificationInput[] = []

  for (const tx of newTxs) {
    // 1. Duplicate: same merchant + amount + type within 48h
    if (tx.merchantName) {
      const window48h = new Date(tx.date.getTime() - 48 * 60 * 60 * 1000)
      const dup = await db.transaction.findFirst({
        where: {
          householdId,
          merchantName: tx.merchantName,
          amount: tx.amount,
          type: tx.type,
          date: { gte: window48h, lte: tx.date },
          id: { not: tx.id },
        },
        select: { id: true },
      })
      if (dup) {
        notifications.push({
          householdId,
          type: "duplicate",
          title: "Possible duplicate charge",
          body: `${tx.merchantName} charged ${tx.currency} ${tx.amount.toFixed(2)} twice within 48 hours.`,
          metadata: JSON.stringify({ txId: tx.id, dupId: dup.id }),
        })
      }
    }

    // 2. Amount spike: >2.5x the 90-day average (min 3 prior transactions)
    if (tx.merchantName && tx.type === "debit") {
      const since90 = new Date(tx.date.getTime() - 90 * 24 * 60 * 60 * 1000)
      const history = await db.transaction.findMany({
        where: {
          householdId,
          merchantName: tx.merchantName,
          type: "debit",
          date: { gte: since90 },
          id: { not: tx.id },
        },
        select: { amount: true },
      })
      if (history.length >= 3) {
        const avg = history.reduce((a, b) => a + b.amount, 0) / history.length
        if (tx.amount > avg * 2.5) {
          const multiplier = Math.round(tx.amount / avg)
          notifications.push({
            householdId,
            type: "amount_spike",
            title: "Unusual charge detected",
            body: `${tx.merchantName} charged ${tx.currency} ${tx.amount.toFixed(2)} — ${multiplier}× your usual amount (avg ${tx.currency} ${avg.toFixed(2)}).`,
            metadata: JSON.stringify({ txId: tx.id, avg: Math.round(avg) }),
          })
        }
      }
    }

    // 3. Odd timing: midnight to 5am UTC
    const hour = tx.date.getUTCHours()
    if (hour < 5 && tx.type === "debit") {
      const label = tx.merchantName ?? tx.description ?? "A transaction"
      const time = `${String(hour).padStart(2, "0")}:${String(tx.date.getUTCMinutes()).padStart(2, "0")} UTC`
      notifications.push({
        householdId,
        type: "odd_timing",
        title: "Late-night transaction",
        body: `${label} (${tx.currency} ${tx.amount.toFixed(2)}) occurred at ${time}.`,
        metadata: JSON.stringify({ txId: tx.id }),
      })
    }
  }

  if (notifications.length > 0) {
    await db.notification.createMany({ data: notifications })
  }
}
