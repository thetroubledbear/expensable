import Link from "next/link"
import { Repeat2 } from "lucide-react"

interface Subscription {
  id: string
  merchantName: string
  amount: number
  frequency: string
  currency: string
}

interface Props {
  count: number
  totalMonthly: number
  currency: string
  subscriptions: Subscription[]
}

function fmtMonthly(amount: number, frequency: string, currency: string) {
  let monthly = amount
  if (frequency === "weekly") monthly = (amount * 52) / 12
  if (frequency === "annual") monthly = amount / 12
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(monthly)
}

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function SubscriptionsSummaryWidget({ count, totalMonthly, currency, subscriptions }: Props) {
  if (count === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
          <Repeat2 className="w-5 h-5 text-slate-400" />
        </div>
        <p className="text-xs text-slate-400 text-center">
          No subscriptions detected yet
        </p>
        <Link href="/subscriptions" className="text-xs text-emerald-600 hover:underline">
          View subscriptions
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Total */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <p className="text-lg font-bold text-slate-900 tabular-nums leading-none">
            {fmt(totalMonthly, currency)}
            <span className="text-xs font-normal text-slate-400 ml-1">/mo</span>
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {count} subscription{count !== 1 ? "s" : ""} · {fmt(totalMonthly * 12, currency)}/yr
          </p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
          <Repeat2 className="w-4 h-4 text-emerald-600" />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
        {subscriptions.slice(0, 8).map((s) => (
          <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                <Repeat2 className="w-3 h-3 text-emerald-500" />
              </div>
              <p className="text-xs font-medium text-slate-700 truncate">{s.merchantName}</p>
            </div>
            <p className="text-xs font-semibold text-slate-600 tabular-nums shrink-0 ml-2">
              {fmtMonthly(s.amount, s.frequency, s.currency ?? currency)}/mo
            </p>
          </div>
        ))}
      </div>

      <Link href="/subscriptions" className="text-xs text-emerald-600 hover:underline shrink-0">
        View all
      </Link>
    </div>
  )
}
