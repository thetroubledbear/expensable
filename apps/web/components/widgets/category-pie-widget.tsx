"use client"

import { CategoryPieChart } from "@/components/category-pie-chart"

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

export function CategoryPieWidget({ categories, currency, monthName }: Props) {
  return (
    <div className="h-full flex flex-col">
      <p className="text-xs text-slate-400 mb-3">{monthName}</p>
      <CategoryPieChart data={categories} currency={currency} />
    </div>
  )
}
