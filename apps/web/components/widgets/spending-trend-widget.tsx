"use client"

import { SpendingTrendChart } from "@/components/spending-trend-chart"

interface TrendPoint {
  month: string
  spent: number
  received: number
}

interface Props {
  trend: TrendPoint[]
  currency: string
}

export function SpendingTrendWidget({ trend, currency }: Props) {
  return (
    <div className="h-full flex flex-col">
      <SpendingTrendChart data={trend} currency={currency} />
    </div>
  )
}
