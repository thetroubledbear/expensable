import { Landmark, TrendingUp, TrendingDown, Minus } from "lucide-react"

type AccountType = "checking" | "savings" | "credit" | "cash" | "investment"

export interface AccountBalance {
  id: string
  name: string
  type: string
  balance: number
  currency: string
}

interface Props {
  accounts: AccountBalance[]
  currency: string
}

const TYPE_COLORS: Record<AccountType, string> = {
  checking:   "bg-blue-100 text-blue-700",
  savings:    "bg-emerald-100 text-emerald-700",
  credit:     "bg-violet-100 text-violet-700",
  cash:       "bg-amber-100 text-amber-700",
  investment: "bg-rose-100 text-rose-700",
}

const TYPE_LABELS: Record<AccountType, string> = {
  checking:   "Checking",
  savings:    "Savings",
  credit:     "Credit",
  cash:       "Cash",
  investment: "Investment",
}

function fmt(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount))
  } catch {
    return `${currency} ${Math.abs(amount).toFixed(2)}`
  }
}

export function AccountBalancesWidget({ accounts, currency }: Props) {
  if (accounts.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center">
        <Landmark className="w-8 h-8 text-slate-200 mb-2" />
        <p className="text-sm text-slate-400">No accounts yet</p>
        <p className="text-xs text-slate-300 mt-0.5">Add accounts in the Accounts page</p>
      </div>
    )
  }

  const netWorth = accounts.reduce((sum, a) => sum + a.balance, 0)
  const hasNegative = accounts.some((a) => a.balance < 0)

  return (
    <div className="h-full flex flex-col gap-2 min-h-0">
      {/* Account rows */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
        {accounts.map((acct) => {
          const type = acct.type as AccountType
          const typeColor = TYPE_COLORS[type] ?? "bg-slate-100 text-slate-600"
          const typeLabel = TYPE_LABELS[type] ?? acct.type
          const isNeg = acct.balance < 0

          return (
            <div
              key={acct.id}
              className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shrink-0">
                <Landmark className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-sm font-semibold text-slate-700 truncate">{acct.name}</p>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${typeColor}`}>
                    {typeLabel}
                  </span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className={`text-sm font-bold tabular-nums ${isNeg ? "text-red-600" : "text-slate-800"}`}>
                  {isNeg ? "−" : ""}{fmt(acct.balance, acct.currency || currency)}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Net worth total */}
      {accounts.length > 1 && (
        <div className="shrink-0 flex items-center justify-between border-t border-slate-100 pt-2 mt-1">
          <div className="flex items-center gap-1.5">
            {netWorth > 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            ) : netWorth < 0 ? (
              <TrendingDown className="w-3.5 h-3.5 text-red-500" />
            ) : (
              <Minus className="w-3.5 h-3.5 text-slate-400" />
            )}
            <p className="text-xs font-medium text-slate-500">Net worth</p>
            {hasNegative && (
              <span className="text-[10px] text-slate-300">(credits included)</span>
            )}
          </div>
          <p className={`text-sm font-bold tabular-nums ${netWorth >= 0 ? "text-emerald-700" : "text-red-600"}`}>
            {netWorth < 0 ? "−" : ""}{fmt(netWorth, currency)}
          </p>
        </div>
      )}
    </div>
  )
}
