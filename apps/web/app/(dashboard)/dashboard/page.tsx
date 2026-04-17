import { requireAuth } from "@/lib/auth/session"
import { db } from "@expensable/db"
import Link from "next/link"
import { UploadCloud, FileText, ArrowDownLeft, ArrowUpRight, Minus } from "lucide-react"

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
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

  const [fileCount, moneyOut, moneyIn, recentTx, topMerchants] = hid
    ? await Promise.all([
        db.uploadedFile.count({ where: { householdId: hid } }),
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
          take: 6,
        }),
        db.transaction.groupBy({
          by: ["merchantName"],
          where: { householdId: hid, type: "debit", date: { gte: startOfMonth }, merchantName: { not: null } },
          _sum: { amount: true },
          orderBy: { _sum: { amount: "desc" } },
          take: 5,
        }),
      ])
    : [0, { _sum: { amount: null } }, { _sum: { amount: null } }, [], []]

  const spent = moneyOut._sum.amount ?? 0
  const received = moneyIn._sum.amount ?? 0
  const net = received - spent
  const firstName = (session.user as { name?: string | null })?.name?.split(" ")[0] ?? "there"
  const monthName = now.toLocaleString("en", { month: "long" })

  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          {greeting()}, {firstName}
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          {membership?.household.name ?? "Your workspace"} · {monthName} overview
        </p>
      </div>

      {fileCount === 0 ? (
        /* Empty state */
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
      ) : (
        <>
          {/* Money cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <MoneyCard
              label="Money out"
              sublabel={monthName}
              amount={fmt(spent, currency)}
              icon={ArrowUpRight}
              iconBg="bg-red-50"
              iconColor="text-red-500"
              amountColor="text-red-600"
            />
            <MoneyCard
              label="Money in"
              sublabel={monthName}
              amount={fmt(received, currency)}
              icon={ArrowDownLeft}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-500"
              amountColor="text-emerald-600"
            />
            <MoneyCard
              label="Net"
              sublabel={monthName}
              amount={fmt(net, currency)}
              icon={Minus}
              iconBg={net >= 0 ? "bg-emerald-50" : "bg-red-50"}
              iconColor={net >= 0 ? "text-emerald-500" : "text-red-500"}
              amountColor={net >= 0 ? "text-emerald-700" : "text-red-600"}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-700">Recent transactions</h2>
                <Link href="/transactions" className="text-xs text-emerald-600 hover:underline">
                  View all
                </Link>
              </div>
              {recentTx.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">No transactions yet</p>
              ) : (
                <div className="space-y-1">
                  {recentTx.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate max-w-[220px]">
                          {tx.merchantName ?? tx.description}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(tx.date).toLocaleDateString("en", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                      <span className={`text-sm font-semibold tabular-nums shrink-0 ml-4 ${
                        tx.type === "credit" ? "text-emerald-600" : "text-slate-700"
                      }`}>
                        {tx.type === "credit" ? "+" : "−"}{fmt(tx.amount, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-700">Top spending</h2>
                <span className="text-xs text-slate-400">{monthName}</span>
              </div>
              {topMerchants.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {topMerchants.map((m, i) => {
                    const amount = m._sum.amount ?? 0
                    const pct = spent > 0 ? Math.round((amount / spent) * 100) : 0
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-600 truncate max-w-[110px]">
                            {m.merchantName}
                          </span>
                          <span className="text-xs font-medium text-slate-700 tabular-nums">
                            {fmt(amount, currency)}
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-400 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Files stat */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 w-fit">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
              <FileText className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">{fileCount}</p>
              <p className="text-xs text-slate-500">Files processed</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function MoneyCard({
  label, sublabel, amount, icon: Icon, iconBg, iconColor, amountColor,
}: {
  label: string; sublabel: string; amount: string
  icon: React.ElementType; iconBg: string; iconColor: string; amountColor: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center mb-4`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <p className={`text-xl font-bold tabular-nums ${amountColor}`}>{amount}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      <p className="text-xs text-slate-400">{sublabel}</p>
    </div>
  )
}
