import { requireAuth } from "@/lib/auth/session"
import { db } from "@expensable/db"
import Link from "next/link"
import { UploadCloud } from "lucide-react"
import { DashboardGrid, type DashboardData } from "@/components/dashboard-grid"

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

function estimateMonthly(amount: number, frequency: string): number {
  if (frequency === "monthly") return amount
  if (frequency === "weekly") return (amount * 52) / 12
  if (frequency === "annual") return amount / 12
  return amount
}

export default async function DashboardPage() {
  const session = await requireAuth()

  const membership = await db.householdMember.findFirst({
    where: { userId: session.user?.id! },
    include: { household: true },
  })

  const hid = membership?.householdId
  const currency = membership?.household.defaultCurrency ?? "USD"
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthName = now.toLocaleString("en", { month: "long" })
  const firstName = (session.user as { name?: string | null })?.name?.split(" ")[0] ?? "there"

  if (!hid) {
    return (
      <div className="p-8 max-w-5xl mx-auto w-full">
        <p className="text-slate-500">No household found.</p>
      </div>
    )
  }

  const fileCount = await db.uploadedFile.count({ where: { householdId: hid } })

  if (fileCount === 0) {
    return (
      <div className="p-8 max-w-5xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">
            {greeting()}, {firstName}
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            {membership?.household.name ?? "Your workspace"} · {monthName} overview
          </p>
        </div>
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5">
            <UploadCloud className="w-7 h-7 text-emerald-600" />
          </div>
          <h2 className="text-slate-900 font-semibold text-xl mb-2">Upload your first file</h2>
          <p className="text-slate-500 text-sm mb-7 max-w-md mx-auto leading-relaxed">
            Import a bank statement, CSV export, PDF, or a receipt photo.
            Your AI assistant will extract all transactions automatically.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            Upload a file
          </Link>
        </div>
      </div>
    )
  }

  const [moneyOut, moneyIn, recentTxRaw, topMerchantsRaw, subs] = await Promise.all([
    db.transaction.aggregate({
      where: { householdId: hid, type: "debit", date: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: { householdId: hid, type: "credit", date: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    db.transaction.findMany({
      where: { householdId: hid },
      orderBy: { date: "desc" },
      take: 8,
    }),
    db.transaction.groupBy({
      by: ["merchantName"],
      where: {
        householdId: hid,
        type: "debit",
        date: { gte: startOfMonth },
        merchantName: { not: null },
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 5,
    }),
    db.detectedSubscription.findMany({
      where: { householdId: hid },
    }),
  ])

  const spent = moneyOut._sum.amount ?? 0
  const received = moneyIn._sum.amount ?? 0
  const totalMonthlySubscriptions = subs.reduce(
    (acc, s) => acc + estimateMonthly(s.amount, s.frequency),
    0
  )

  const data: DashboardData = {
    spent,
    received,
    net: received - spent,
    currency,
    monthName,
    recentTx: recentTxRaw.map((tx) => ({
      id: tx.id,
      merchantName: tx.merchantName,
      description: tx.description,
      type: tx.type,
      amount: tx.amount,
      date: tx.date.toISOString(),
    })),
    topMerchants: topMerchantsRaw.map((m) => ({
      merchantName: m.merchantName,
      amount: m._sum.amount ?? 0,
      pct: spent > 0 ? Math.round(((m._sum.amount ?? 0) / spent) * 100) : 0,
    })),
    fileCount,
    subscriptionsCount: subs.length,
    totalMonthlySubscriptions,
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          {greeting()}, {firstName}
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          {membership?.household.name ?? "Your workspace"} · {monthName} overview
        </p>
      </div>
      <DashboardGrid data={data} />
    </div>
  )
}
