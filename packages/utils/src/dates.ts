export function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

export function groupByMonth<T extends { date: Date }>(items: T[]): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const key = getMonthKey(item.date)
    ;(acc[key] ??= []).push(item)
    return acc
  }, {})
}
