import { PiggyBank } from "lucide-react"

interface Props {
  rate: number | null
  currency: string
  spent: number
  received: number
  monthName: string
}

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount))
}

export function SavingsRateWidget({ rate, currency, spent, received, monthName }: Props) {
  const saved = received - spent
  const hasSaved = received > 0

  const rateColor =
    rate === null ? "text-slate-400"
    : rate >= 20  ? "text-emerald-600"
    : rate > 0    ? "text-amber-500"
    : "text-red-600"

  const iconBg =
    rate === null ? "bg-slate-100"
    : rate >= 20  ? "bg-emerald-50"
    : rate > 0    ? "bg-amber-50"
    : "bg-red-50"

  const iconColor =
    rate === null ? "text-slate-400"
    : rate >= 20  ? "text-emerald-500"
    : rate > 0    ? "text-amber-500"
    : "text-red-500"

  const pct = Math.min(Math.max(rate ?? 0, 0), 100)
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const strokeColor =
    rate === null ? "#e2e8f0"
    : rate >= 20  ? "#34d399"
    : rate > 0    ? "#fbbf24"
    : "#f87171"

  return (
    <div className="h-full flex flex-col justify-center">
      <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center mb-3`}>
        <PiggyBank className={`w-4 h-4 ${iconColor}`} />
      </div>

      <div className="flex items-end gap-3">
        {/* Radial gauge */}
        <svg className="-rotate-90 shrink-0" width="52" height="52" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="9" />
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (pct / 100) * circumference}
          />
        </svg>

        <div>
          <p className={`text-xl font-bold tabular-nums leading-none ${rateColor}`}>
            {rate === null ? "—" : `${rate}%`}
          </p>
          <p className="text-sm text-slate-500 mt-0.5">Savings rate</p>
          <p className="text-xs text-slate-400">{monthName}</p>
        </div>
      </div>

      {hasSaved && (
        <p className={`text-xs font-medium mt-2 tabular-nums ${saved >= 0 ? "text-emerald-600" : "text-red-500"}`}>
          {saved >= 0 ? "+" : "−"}{fmt(saved, currency)} saved
        </p>
      )}
    </div>
  )
}
