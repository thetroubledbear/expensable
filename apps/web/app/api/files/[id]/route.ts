import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@expensable/db"
import { deleteFile } from "@/lib/storage"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  if (typeof id !== "string" || id.length === 0 || id.length > 128) {
    return NextResponse.json({ error: "Invalid file ID" }, { status: 400 })
  }

  let file: { householdId: string; _count: { transactions: number } } | null
  try {
    file = await db.uploadedFile.findUnique({
      where: { id },
      include: { _count: { select: { transactions: true } } },
    })
  } catch {
    return NextResponse.json({ error: "Failed to retrieve file" }, { status: 500 })
  }

  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 })

  let membership: unknown
  try {
    membership = await db.householdMember.findFirst({
      where: { userId: session.user.id, householdId: file.householdId },
    })
  } catch {
    return NextResponse.json({ error: "Failed to verify access" }, { status: 500 })
  }

  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  return NextResponse.json(file)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  if (typeof id !== "string" || id.length === 0 || id.length > 128) {
    return NextResponse.json({ error: "Invalid file ID" }, { status: 400 })
  }

  let file: { householdId: string; storageKey: string } | null
  try {
    file = await db.uploadedFile.findUnique({ where: { id } })
  } catch {
    return NextResponse.json({ error: "Failed to retrieve file" }, { status: 500 })
  }

  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 })

  try {
    const membership = await db.householdMember.findFirst({
      where: { userId: session.user.id, householdId: file.householdId },
    })
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    if (membership.role !== "owner") {
      return NextResponse.json({ error: "Only household owners can delete files" }, { status: 403 })
    }
  } catch {
    return NextResponse.json({ error: "Failed to verify access" }, { status: 500 })
  }

  // Delete storage object — don't fail if already gone
  if (file.storageKey) {
    await deleteFile(file.storageKey).catch(() => null)
  }

  try {
    // Transactions cascade-delete via schema onDelete: Cascade
    await db.uploadedFile.delete({ where: { id } })
  } catch {
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
