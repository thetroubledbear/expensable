import Link from "next/link"

interface Merchant {
  merchantName: string | null
  amount: number
  pct: number
}

interface Props {
  merchants: Merchant[]
  currency: string
  monthName: string
}

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function TopSpendingWidget({ merchants, currency, monthName }: Props) {
  if (merchants.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-slate-400">No data yet</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <p className="text-xs text-slate-400 mb-3">{monthName}</p>
      <div className="space-y-3 flex-1 overflow-auto">
        {merchants.map((m, i) => (
          <Link
            key={i}
            href={`/transactions?search=${encodeURIComponent(m.merchantName ?? "")}&type=debit`}
            className="block group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-600 truncate max-w-[110px] group-hover:text-emerald-600 transition-colors">
                {m.merchantName}
              </span>
              <span className="text-xs font-medium text-slate-700 tabular-nums">
                {fmt(m.amount, currency)}
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full"
                style={{ width: `${m.pct}%` }}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
