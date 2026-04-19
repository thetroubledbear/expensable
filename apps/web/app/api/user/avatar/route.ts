import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@expensable/db"
import { uploadFile, deleteFile, getPresignedUrl } from "@/lib/storage"

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_MIME = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

function avatarKey(userId: string) {
  return `users/${userId}/avatar`
}

function validateMagicBytes(buf: Buffer, mime: string): boolean {
  if (mime === "image/jpeg" || mime === "image/jpg")
    return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff
  if (mime === "image/png")
    return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47
  if (mime === "image/webp")
    return buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46
  return false
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 413 })
  if (!ALLOWED_MIME.includes(file.type))
    return NextResponse.json({ error: "Only JPEG, PNG, or WebP allowed" }, { status: 415 })

  const buffer = Buffer.from(await file.arrayBuffer())
  if (!validateMagicBytes(buffer, file.type))
    return NextResponse.json({ error: "File content does not match declared type" }, { status: 415 })

  const key = avatarKey(session.user.id)

  try {
    await uploadFile(key, buffer, file.type)
    await db.user.update({ where: { id: session.user.id }, data: { image: key } })
    const url = await getPresignedUrl(key, 3600)
    return NextResponse.json({ url })
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const key = avatarKey(session.user.id)
  try {
    await deleteFile(key).catch(() => null)
    await db.user.update({ where: { id: session.user.id }, data: { image: null } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Failed to remove avatar" }, { status: 500 })
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { image: true } })
  if (!user?.image) return NextResponse.json({ url: null })

  if (user.image.startsWith("http")) return NextResponse.json({ url: user.image })

  try {
    const url = await getPresignedUrl(user.image, 3600)
    return NextResponse.json({ url })
  } catch {
    return NextResponse.json({ url: null })
  }
}
