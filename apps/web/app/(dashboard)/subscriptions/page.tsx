import { requireAuth } from "@/lib/auth/session"
import { db } from "@expensable/db"
import { SubscriptionCard } from "@/components/subscription-card"
import { Repeat2 } from "lucide-react"

function estimateAnnual(amount: number, frequency: string): number {
  if (frequency === "monthly") return amount * 12
  if (frequency === "weekly") return amount * 52
  return amount
}

function estimateMonthly(amount: number, frequency: string): number {
  if (frequency === "monthly") return amount
  if (frequency === "weekly") return (amount * 52) / 12
  if (frequency === "annual") return amount / 12
  return amount
}

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export default async function SubscriptionsPage() {
  const session = await requireAuth()

  const membership = await db.householdMember.findFirst({
    where: { userId: session.user?.id! },
    include: { household: true },
  })

  const hid = membership?.householdId
  const currency = membership?.household.defaultCurrency ?? "USD"

  const subs = hid
    ? await db.detectedSubscription.findMany({
        where: { householdId: hid },
        orderBy: { amount: "desc" },
      })
    : []

  const totalMonthly = subs.reduce((acc, s) => acc + estimateMonthly(s.amount, s.frequency), 0)

  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Subscriptions</h1>
        <p className="text-slate-500 mt-1 text-sm">Auto-detected recurring charges</p>
      </div>

      {subs.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Repeat2 className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-slate-600 font-medium mb-1">No subscriptions detected yet</p>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            Upload a few months of statements and recurring charges will appear here automatically.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
            <p className="text-xs text-slate-500">Estimated monthly spend</p>
            <p className="text-2xl font-bold text-slate-900 tabular-nums mt-0.5">
              {fmt(totalMonthly, currency)}
              <span className="text-sm font-normal text-slate-400 ml-1">/mo</span>
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {fmt(totalMonthly * 12, currency)}/yr · {subs.length} subscription
              {subs.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {subs.map((sub) => (
              <SubscriptionCard
                key={sub.id}
                id={sub.id}
                merchantName={sub.merchantName}
                amount={sub.amount}
                currency={currency}
                frequency={sub.frequency as "monthly" | "weekly" | "annual"}
                lastSeenAt={sub.lastSeenAt.toISOString()}
                estimatedAnnual={estimateAnnual(sub.amount, sub.frequency)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
