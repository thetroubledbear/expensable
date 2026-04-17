import { db } from "@expensable/db"

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
