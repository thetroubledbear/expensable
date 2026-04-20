import { db } from "@expensable/db"

export const CATEGORY_COLOR_MAP: Record<string, string> = {
  amber:  "#f59e0b",
  slate:  "#64748b",
  indigo: "#6366f1",
  pink:   "#ec4899",
  emerald:"#10b981",
  rose:   "#f43f5e",
  green:  "#22c55e",
  zinc:   "#71717a",
  violet: "#8b5cf6",
  blue:   "#3b82f6",
  sky:    "#0ea5e9",
}

export const HINT_TO_CATEGORY: Record<string, string> = {
  food: "Food & Drink",
  transport: "Transport",
  utilities: "Bills & Utilities",
  entertainment: "Entertainment",
  health: "Health",
  shopping: "Shopping",
  travel: "Travel",
  subscription: "Bills & Utilities",
  income: "Income",
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
  { name: "Income", icon: "💰", color: "green" },
  { name: "Other", icon: "📦", color: "zinc" },
  { name: "Shopping", icon: "🛍️", color: "violet" },
  { name: "Transport", icon: "🚗", color: "blue" },
  { name: "Travel", icon: "✈️", color: "sky" },
]

export async function ensureCategories() {
  const count = await db.category.count()
  if (count === 0) {
    await db.category.createMany({ data: SYSTEM_CATEGORIES, skipDuplicates: true })
  }
}
