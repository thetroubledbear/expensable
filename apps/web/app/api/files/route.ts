import { NextRequest, NextResponse } from "next/server"
import { after } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@expensable/db"
import { resolveHousehold } from "@/lib/auth/household"
import { uploadFile, getFileBuffer, buildStorageKey } from "@/lib/storage"
import { parseFileContent, type ParseResult } from "@/lib/ai/parser"
import { PLANS, type FileType } from "@expensable/types"
import { ensureCategories, HINT_TO_CATEGORY } from "@/lib/categories"
import { detectSubscriptions } from "@/lib/subscriptions"

const MIME_TO_TYPE: Record<string, FileType> = {
  "text/csv": "csv",
  "application/csv": "csv",
  "text/plain": "csv",
  "application/pdf": "pdf",
  "image/jpeg": "image",
  "image/jpg": "image",
  "image/png": "image",
  "image/webp": "image",
  "image/heic": "image",
}

const MAX_BYTES = 20 * 1024 * 1024

const MAX_FILENAME_LENGTH = 255

// Rate limiter: max 10 uploads per minute per user (in-memory)
const uploadTimestamps = new Map<string, number[]>()
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 10

function isRateLimited(userId: string): boolean {
  const now = Date.now()
  const timestamps = (uploadTimestamps.get(userId) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  )
  if (timestamps.length >= RATE_LIMIT_MAX) return true
  timestamps.push(now)
  uploadTimestamps.set(userId, timestamps)
  return false
}

// Magic-byte validation
function validateMagicBytes(buffer: Buffer, fileType: FileType, mimeType: string): boolean {
  if (fileType === "pdf") {
    return buffer.slice(0, 4).toString("ascii") === "%PDF"
  }

  if (fileType === "image") {
    if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
    }
    if (mimeType === "image/png") {
      return (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47
      )
    }
    if (mimeType === "image/webp") {
      return (
        buffer[0] === 0x52 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x46
      )
    }
    // HEIC: ftyp box at offset 4
    if (mimeType === "image/heic") {
      return buffer.slice(4, 8).toString("ascii") === "ftyp"
    }
    return false
  }

  if (fileType === "csv") {
    // Must be valid UTF-8 text; reject if it looks like a binary file
    try {
      const sample = buffer.slice(0, 4096).toString("utf-8")
      // Reject if more than 5% non-printable (excluding common whitespace)
      const nonPrintable = sample.split("").filter((c) => {
        const code = c.charCodeAt(0)
        return code < 9 || (code > 13 && code < 32) || code === 127
      }).length
      return nonPrintable / sample.length < 0.05
    } catch {
      return false
    }
  }

  return false
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const membership = await resolveHousehold(session.user.id)

    if (!membership) return NextResponse.json([])

    const files = await db.uploadedFile.findMany({
      where: { householdId: membership.householdId },
      orderBy: { uploadedAt: "desc" },
      include: { _count: { select: { transactions: true } } },
    })

    return NextResponse.json(files)
  } catch {
    return NextResponse.json({ error: "Failed to retrieve files" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (isRateLimited(session.user.id)) {
    return NextResponse.json(
      { error: "Too many uploads. Please wait before uploading again." },
      { status: 429 }
    )
  }

  const membership = await resolveHousehold(session.user.id)

  if (!membership) {
    return NextResponse.json({ error: "No household found" }, { status: 400 })
  }

  const { household } = membership
  const billing = household.billing
  const tier = (billing?.tier ?? "free") as keyof typeof PLANS
  const plan = PLANS[tier]

  // Reset monthly counter if calendar month has rolled over
  const now = new Date()
  let monthlyCount = billing?.filesUploadedThisMonth ?? 0
  if (billing) {
    const c = billing.billingCycleStart
    if (c.getMonth() !== now.getMonth() || c.getFullYear() !== now.getFullYear()) {
      await db.householdBilling.update({
        where: { id: billing.id },
        data: { filesUploadedThisMonth: 0, billingCycleStart: now },
      })
      monthlyCount = 0
    }
  }

  if (monthlyCount >= plan.monthlyFileLimit) {
    return NextResponse.json(
      { error: `Monthly limit reached (${plan.monthlyFileLimit} files on ${tier} plan)` },
      { status: 429 }
    )
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file = formData.get("file") as File | null
  const accountId = (formData.get("accountId") as string | null)?.trim() || null

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File too large (max 20 MB)" }, { status: 413 })
  if (file.size === 0) return NextResponse.json({ error: "File is empty" }, { status: 400 })

  if (typeof file.name !== "string" || file.name.length === 0 || file.name.length > MAX_FILENAME_LENGTH) {
    return NextResponse.json({ error: "Invalid file name" }, { status: 400 })
  }

  const mimeType = file.type
  const fileType = MIME_TO_TYPE[mimeType]

  if (!fileType) {
    return NextResponse.json(
      { error: "Unsupported file type. Use CSV, PDF, or image." },
      { status: 415 }
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  if (!validateMagicBytes(buffer, fileType, mimeType)) {
    return NextResponse.json(
      { error: "File content does not match the declared type." },
      { status: 415 }
    )
  }

  // Validate accountId belongs to this household if provided
  if (accountId) {
    const acct = await db.financialAccount.findFirst({
      where: { id: accountId, householdId: household.id },
    })
    if (!acct) {
      return NextResponse.json({ error: "Invalid account" }, { status: 400 })
    }
  }

  let record: { id: string }
  try {
    record = await db.uploadedFile.create({
      data: {
        householdId: household.id,
        uploadedBy: session.user.id,
        name: file.name,
        type: fileType,
        status: "pending",
        storageKey: "",
        financialAccountId: accountId,
      },
    })
  } catch {
    return NextResponse.json({ error: "Failed to create upload record" }, { status: 500 })
  }

  const storageKey = buildStorageKey(household.id, record.id, file.name)

  try {
    await uploadFile(storageKey, buffer, mimeType)
  } catch {
    await db.uploadedFile.delete({ where: { id: record.id } }).catch(() => null)
    return NextResponse.json(
      { error: "Storage error — make sure MinIO bucket 'expensable' exists at localhost:9001" },
      { status: 500 }
    )
  }

  let updated: unknown
  try {
    ;[updated] = await Promise.all([
      db.uploadedFile.update({ where: { id: record.id }, data: { storageKey } }),
      billing
        ? db.householdBilling.update({
            where: { id: billing.id },
            data: { filesUploadedThisMonth: { increment: 1 } },
          })
        : Promise.resolve(null),
    ])
  } catch {
    return NextResponse.json({ error: "Failed to update upload record" }, { status: 500 })
  }

  after(async () => {
    await processFile(record.id, storageKey, fileType, mimeType, household.id, accountId)
  })

  return NextResponse.json(updated, { status: 201 })
}

async function processFile(
  fileId: string,
  storageKey: string,
  fileType: FileType,
  mimeType: string,
  householdId: string,
  financialAccountId: string | null = null
) {
  try {
    await db.uploadedFile.update({ where: { id: fileId }, data: { status: "processing" } })

    const buffer = await getFileBuffer(storageKey)
    let result: ParseResult

    if (fileType === "csv") {
      result = await parseFileContent(buffer.toString("utf-8"), "csv")
    } else if (fileType === "pdf") {
      result = await parseFileContent({ type: "pdf", data: buffer.toString("base64") }, "pdf")
    } else {
      result = await parseFileContent(
        { type: "image", mediaType: mimeType, data: buffer.toString("base64") },
        "image"
      )
    }

    if (result.transactions.length > 0) {
      await ensureCategories()
      const categories = await db.category.findMany({ select: { id: true, name: true } })
      const catByName = new Map(categories.map((c) => [c.name, c.id]))

      // Re-verify account still exists (may have been deleted since upload)
      if (financialAccountId) {
        const acct = await db.financialAccount.findFirst({
          where: { id: financialAccountId, householdId },
        })
        if (!acct) financialAccountId = null
      }

      await db.transaction.createMany({
        data: result.transactions.map((t) => {
          const hint = t.categoryHint?.toLowerCase()
          const catName = hint ? HINT_TO_CATEGORY[hint] : null
          const categoryId = catName ? (catByName.get(catName) ?? null) : null
          const uncertain = !hint || hint === "other" || hint === "transfer" || !categoryId
          return {
            householdId,
            fileId,
            date: t.date ? new Date(t.date) : new Date(),
            description: t.description ?? "",
            amount: t.amount ?? 0,
            currency: t.currency ?? "USD",
            type: (t.type === "credit" ? "credit" : "debit") as "debit" | "credit",
            merchantName: t.merchantName ?? null,
            categoryId,
            financialAccountId,
            needsReview: Boolean(uncertain || t.needsReview || !t.date || !t.currency),
          }
        }),
      })
    }

    await db.uploadedFile.update({
      where: { id: fileId },
      data: { status: "done", processedAt: new Date() },
    })

    // Re-run subscription detection with updated transaction set
    await detectSubscriptions(householdId)
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    await db.uploadedFile.update({
      where: { id: fileId },
      data: { status: "failed", errorMsg: errorMsg.slice(0, 500) },
    })
  }
}
