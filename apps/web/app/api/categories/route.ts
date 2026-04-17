import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@expensable/db"
import { ensureCategories } from "@/lib/categories"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await ensureCategories()
    const categories = await db.category.findMany({ orderBy: { name: "asc" } })
    return NextResponse.json(categories)
  } catch {
    return NextResponse.json({ error: "Failed to retrieve categories" }, { status: 500 })
  }
}
