import Link from "next/link"
import { ArrowDownLeft, ArrowUpRight, Minus, TrendingUp, TrendingDown } from "lucide-react"

const VARIANT_HREF: Record<string, string> = {
  out: "/transactions?type=debit",
  in: "/transactions?type=credit",
  net: "/transactions",
}

interface Props {
  variant: "out" | "in" | "net"
  amount: number
  currency: string
  monthName: string
  momPct?: number | null
}

const CONFIG = {
  out: {
    label: "Money out",
    icon: ArrowUpRight,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
    amountColor: "text-red-600",
  },
  in: {
    label: "Money in",
    icon: ArrowDownLeft,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-500",
    amountColor: "text-emerald-600",
  },
  net: {
    label: "Net",
    icon: Minus,
    iconBg: (n: number) => (n >= 0 ? "bg-emerald-50" : "bg-red-50"),
    iconColor: (n: number) => (n >= 0 ? "text-emerald-500" : "text-red-500"),
    amountColor: (n: number) => (n >= 0 ? "text-emerald-700" : "text-red-600"),
  },
}

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function MoneyCardWidget({ variant, amount, currency, monthName, momPct }: Props) {
  const cfg = CONFIG[variant]
  const Icon = cfg.icon
  const iconBg =
    variant === "net"
      ? (CONFIG.net.iconBg as (n: number) => string)(amount)
      : (cfg.iconBg as string)
  const iconColor =
    variant === "net"
      ? (CONFIG.net.iconColor as (n: number) => string)(amount)
      : (cfg.iconColor as string)
  const amountColor =
    variant === "net"
      ? (CONFIG.net.amountColor as (n: number) => string)(amount)
      : (cfg.amountColor as string)

  return (
    <Link href={VARIANT_HREF[variant]} className="h-full flex flex-col justify-center group">
      <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center mb-4`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <p className={`text-xl font-bold tabular-nums ${amountColor} group-hover:opacity-80 transition-opacity`}>{fmt(amount, currency)}</p>
      <p className="text-sm text-slate-500 mt-0.5 group-hover:text-emerald-600 transition-colors">{cfg.label}</p>
      <p className="text-xs text-slate-400">{monthName}</p>
      {momPct !== null && momPct !== undefined && (
        <div
          className={`flex items-center gap-1 mt-2 text-xs font-medium ${
            momPct > 0 ? "text-red-500" : "text-emerald-600"
          }`}
        >
          {momPct > 0 ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {Math.abs(momPct)}% vs last month
        </div>
      )}
    </Link>
  )
}
