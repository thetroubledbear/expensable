import Link from "next/link"
import { Repeat2 } from "lucide-react"

interface Props {
  count: number
  totalMonthly: number
  currency: string
}

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function SubscriptionsSummaryWidget({ count, totalMonthly, currency }: Props) {
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
    <div className="flex flex-col h-full justify-between">
      <div>
        <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
          <Repeat2 className="w-4 h-4 text-emerald-600" />
        </div>
        <p className="text-xl font-bold text-slate-900 tabular-nums">
          {fmt(totalMonthly, currency)}
          <span className="text-sm font-normal text-slate-400 ml-1">/mo</span>
        </p>
        <p className="text-sm text-slate-500 mt-0.5">
          {count} subscription{count !== 1 ? "s" : ""}
        </p>
        <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
          {fmt(totalMonthly * 12, currency)}/yr
        </p>
      </div>
      <Link href="/subscriptions" className="text-xs text-emerald-600 hover:underline">
        View all
      </Link>
    </div>
  )
}
