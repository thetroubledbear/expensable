import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@expensable/db"

const MAX_LAYOUT_BYTES = 65_536 // 64 KB cap

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { dashboardLayout: true },
    })

    if (!user?.dashboardLayout) return NextResponse.json(null)

    const parsed = JSON.parse(user.dashboardLayout)
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json(null)
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }) }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid layout" }, { status: 400 })
  }

  const json = JSON.stringify(body)
  if (json.length > MAX_LAYOUT_BYTES) {
    return NextResponse.json({ error: "Layout too large" }, { status: 413 })
  }

  try {
    await db.user.update({
      where: { id: session.user.id },
      data: { dashboardLayout: json },
    })
    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: "Failed to save layout" }, { status: 500 })
  }
}
