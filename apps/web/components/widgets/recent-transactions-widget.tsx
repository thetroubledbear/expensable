import Link from "next/link"

interface Tx {
  id: string
  merchantName: string | null
  description: string
  type: string
  amount: number
  date: string
}

interface Props {
  transactions: Tx[]
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

export function RecentTransactionsWidget({ transactions, currency }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-slate-400">No transactions yet</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <Link href="/transactions" className="text-xs text-emerald-600 hover:underline ml-auto">
          View all
        </Link>
      </div>
      <div className="space-y-1 flex-1 overflow-auto">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate max-w-[220px]">
                {tx.merchantName ?? tx.description}
              </p>
              <p className="text-xs text-slate-400">
                {new Date(tx.date).toLocaleDateString("en", { month: "short", day: "numeric" })}
              </p>
            </div>
            <span
              className={`text-sm font-semibold tabular-nums shrink-0 ml-4 ${
                tx.type === "credit" ? "text-emerald-600" : "text-slate-700"
              }`}
            >
              {tx.type === "credit" ? "+" : "−"}
              {fmt(tx.amount, currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
