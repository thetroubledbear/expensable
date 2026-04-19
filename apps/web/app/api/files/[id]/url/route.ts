import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@expensable/db"
import { getPresignedUrl } from "@/lib/storage"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const file = await db.uploadedFile.findUnique({ where: { id } })
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const membership = await db.householdMember.findFirst({
    where: { userId: session.user.id, householdId: file.householdId },
  })
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const url = await getPresignedUrl(file.storageKey, 900) // 15 min
    return NextResponse.json({ url, type: file.type, name: file.name })
  } catch {
    return NextResponse.json({ error: "Failed to generate URL" }, { status: 500 })
  }
}
