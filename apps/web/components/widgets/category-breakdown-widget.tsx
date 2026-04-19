interface CategoryData {
  name: string
  color: string
  total: number
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
          const pct = total > 0 ? Math.round((cat.total / total) * 100) : 0
          return (
            <div key={cat.name}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-xs text-slate-600 truncate">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-xs text-slate-400">{pct}%</span>
                  <span className="text-xs font-medium text-slate-700 tabular-nums">
                    {fmt(cat.total, currency)}
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: cat.color }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
