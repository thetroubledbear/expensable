import Link from "next/link"

interface CategoryData {
  name: string
  color: string
  total: number
  id?: string | null
}

interface Props {
  categories: CategoryData[]
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

export function CategoryBreakdownWidget({ categories, currency, monthName }: Props) {
  const total = categories.reduce((a, c) => a + c.total, 0)

  if (categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-slate-400">No data this month</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <p className="text-xs text-slate-400 mb-3">{monthName}</p>
      <div className="space-y-3 flex-1 overflow-auto">
        {categories.slice(0, 10).map((cat) => {
          const rawPct = total > 0 ? (cat.total / total) * 100 : 0
          const displayPct = rawPct < 1 ? rawPct.toFixed(1) : Math.round(rawPct).toString()
          const barWidth = Math.max(2, rawPct)
          const href = cat.id
            ? `/transactions?categoryId=${cat.id}&type=debit`
            : cat.name === "Uncategorized"
            ? `/transactions?categoryId=uncategorized&type=debit`
            : `/transactions?type=debit`
          return (
            <Link key={cat.name} href={href} className="block group/cat">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-xs text-slate-600 truncate group-hover/cat:text-emerald-600 transition-colors">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-xs text-slate-400">{displayPct}%</span>
                  <span className="text-xs font-medium text-slate-700 tabular-nums">
                    {fmt(cat.total, currency)}
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${barWidth}%`, backgroundColor: cat.color }}
                />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
