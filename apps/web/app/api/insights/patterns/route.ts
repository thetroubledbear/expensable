import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@expensable/db"
import { resolveHousehold } from "@/lib/auth/household"

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const membership = await resolveHousehold(session.user.id)
    if (!membership) return NextResponse.json({ error: "No household" }, { status: 404 })

    const currency = membership.household.defaultCurrency ?? "USD"
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const txs = await db.transaction.findMany({
      where: { householdId: membership.householdId, type: "debit", date: { gte: threeMonthsAgo } },
      select: { amount: true, date: true },
    })

    if (txs.length < 20) {
      return NextResponse.json({ weekendVsWeekday: null, topDay: null, quietDay: null, currency, monthsAnalyzed: 0 })
    }

    // Determine actual month range
    const earliest = txs.reduce((min, t) => t.date < min ? t.date : min, txs[0].date)
    const now = new Date()
    const monthsAnalyzed = Math.max(1,
      (now.getFullYear() - earliest.getFullYear()) * 12 + (now.getMonth() - earliest.getMonth())
    )

    // Spend per day-of-week bucket (sum + count of days)
    const byDow = Array.from({ length: 7 }, () => ({ total: 0, txCount: 0 }))
    for (const tx of txs) {
      const dow = tx.date.getDay()
      byDow[dow].total += tx.amount
      byDow[dow].txCount += 1
    }

    // Count actual calendar days in range per day-of-week for avg daily spend
    const dayCount = Array(7).fill(0)
    const cursor = new Date(threeMonthsAgo)
    cursor.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    while (cursor <= end) {
      dayCount[cursor.getDay()]++
      cursor.setDate(cursor.getDate() + 1)
    }

    const avgByDow = byDow.map((b, i) => ({
      dow: i,
      avg: dayCount[i] > 0 ? b.total / dayCount[i] : 0,
    }))

    const nonZero = avgByDow.filter((d) => d.avg > 0)
    if (nonZero.length < 3) {
      return NextResponse.json({ weekendVsWeekday: null, topDay: null, quietDay: null, currency, monthsAnalyzed })
    }

    const overallAvg = nonZero.reduce((s, d) => s + d.avg, 0) / nonZero.length

    // Top and quiet day
    const sorted = [...nonZero].sort((a, b) => b.avg - a.avg)
    const top = sorted[0]
    const quiet = sorted[sorted.length - 1]

    const topDay = {
      day: DAYS[top.dow],
      avgSpend: Math.round(top.avg * 100) / 100,
      vsAvgPct: Math.round(((top.avg - overallAvg) / overallAvg) * 100),
    }
    const quietDay = {
      day: DAYS[quiet.dow],
      avgSpend: Math.round(quiet.avg * 100) / 100,
      vsAvgPct: Math.round(((quiet.avg - overallAvg) / overallAvg) * 100),
    }

    // Weekend (Sat=6, Sun=0) vs weekday
    const weekendDays = avgByDow.filter((d) => d.dow === 0 || d.dow === 6)
    const weekdayDays = avgByDow.filter((d) => d.dow >= 1 && d.dow <= 5)
    const weekendAvgDaily = weekendDays.reduce((s, d) => s + d.avg, 0) / weekendDays.filter(d => d.avg > 0).length || 0
    const weekdayAvgDaily = weekdayDays.reduce((s, d) => s + d.avg, 0) / weekdayDays.filter(d => d.avg > 0).length || 0

    const weekendVsWeekday = weekendAvgDaily > 0 && weekdayAvgDaily > 0 ? {
      weekendAvgDaily: Math.round(weekendAvgDaily * 100) / 100,
      weekdayAvgDaily: Math.round(weekdayAvgDaily * 100) / 100,
      diffPct: Math.round(((weekendAvgDaily - weekdayAvgDaily) / weekdayAvgDaily) * 100),
    } : null

    return NextResponse.json({ weekendVsWeekday, topDay, quietDay, currency, monthsAnalyzed })
  } catch (err) {
    console.error("[patterns]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
