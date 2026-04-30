import { db } from "@expensable/db"

export const CATEGORY_COLOR_MAP: Record<string, string> = {
  amber:  "#f59e0b",
  slate:  "#64748b",
  indigo: "#6366f1",
  orange: "#f97316",
  pink:   "#ec4899",
  emerald:"#10b981",
  rose:   "#f43f5e",
  green:  "#22c55e",
  zinc:   "#71717a",
  violet: "#8b5cf6",
  blue:   "#3b82f6",
  sky:    "#0ea5e9",
  teal:   "#14b8a6",
  purple: "#a855f7",
}

export const HINT_TO_CATEGORY: Record<string, string> = {
  food: "Food & Drink",
  transport: "Transport",
  utilities: "Bills & Utilities",
  entertainment: "Entertainment",
  health: "Health",
  housing: "Housing",
  shopping: "Shopping",
  travel: "Travel",
  subscription: "Bills & Utilities",
  income: "Income",
  savings: "Savings",
  transfer: "Other",
  other: "Other",
}

export const SYSTEM_CATEGORIES = [
  { name: "Bills & Utilities", icon: "🏠", color: "amber" },
  { name: "Business", icon: "💼", color: "slate" },
  { name: "Education", icon: "🎓", color: "indigo" },
  { name: "Entertainment", icon: "🎬", color: "pink" },
  { name: "Food & Drink", icon: "🍽️", color: "emerald" },
  { name: "Health", icon: "💊", color: "rose" },
  { name: "Housing", icon: "🏡", color: "orange" },
  { name: "Income", icon: "💰", color: "green" },
  { name: "Other", icon: "📦", color: "zinc" },
  { name: "Savings", icon: "🐷", color: "teal" },
  { name: "Shopping", icon: "🛍️", color: "violet" },
  { name: "Transport", icon: "🚗", color: "blue" },
  { name: "Travel", icon: "✈️", color: "sky" },
]

export async function ensureCategories() {
  const existing = await db.category.findMany({
    where: { isSystem: true },
    select: { id: true, name: true },
    orderBy: { id: "asc" },
  })

  // Build name → first-id map; collect duplicate ids
  const keepMap = new Map<string, string>()
  const deleteIds: string[] = []
  for (const cat of existing) {
    if (!keepMap.has(cat.name)) keepMap.set(cat.name, cat.id)
    else deleteIds.push(cat.id)
  }

  // Migrate FK refs on duplicates, then delete them
  if (deleteIds.length > 0) {
    for (const dupId of deleteIds) {
      const dup = existing.find((c) => c.id === dupId)!
      const keepId = keepMap.get(dup.name)!
      await db.transaction.updateMany({ where: { categoryId: dupId }, data: { categoryId: keepId } }).catch(() => {})
    }
    await db.category.deleteMany({ where: { id: { in: deleteIds } } }).catch(() => {})
  }

  // Create any system categories that don't exist yet
  const toCreate = SYSTEM_CATEGORIES
    .filter((c) => !keepMap.has(c.name))
    .map((c) => ({ ...c, isSystem: true }))
  if (toCreate.length > 0) {
    await db.category.createMany({ data: toCreate })
  }
}
