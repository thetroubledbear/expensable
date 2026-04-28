import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth/config"
import { db } from "@expensable/db"
import { ensureCategories } from "@/lib/categories"
import { resolveHousehold } from "@/lib/auth/household"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const membership = await resolveHousehold(session.user.id)
  if (!membership) return NextResponse.json({ error: "No household" }, { status: 404 })

  try {
    await ensureCategories()
    const categories = await db.category.findMany({
      where: { OR: [{ householdId: null }, { householdId: membership.householdId }] },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    })
    return NextResponse.json(categories)
  } catch {
    return NextResponse.json({ error: "Failed to retrieve categories" }, { status: 500 })
  }
}

const EMOJI_RE = /^\p{Emoji}/u

const createSchema = z.object({
  name: z.string().min(1).max(50),
  icon: z.string().min(1).max(10).refine((v) => EMOJI_RE.test(v), { message: "Must start with an emoji" }),
  color: z.enum(["amber", "slate", "indigo", "orange", "pink", "emerald", "rose", "green", "zinc", "violet", "blue", "sky", "purple", "teal"]),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const membership = await resolveHousehold(session.user.id)
  if (!membership) return NextResponse.json({ error: "No household" }, { status: 404 })
  if (membership.role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }) }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 })

  try {
    const category = await db.category.create({
      data: {
        name: parsed.data.name,
        icon: parsed.data.icon,
        color: parsed.data.color,
        isSystem: false,
        householdId: membership.householdId,
      },
    })
    return NextResponse.json(category, { status: 201 })
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Category name already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
}
