import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth/config"
import { db } from "@expensable/db"
import { resolveHousehold } from "@/lib/auth/household"
import { ensureCategories, HINT_TO_CATEGORY } from "@/lib/categories"
import { GoogleGenerativeAI } from "@google/generative-ai"

const bodySchema = z.object({
  transcript: z.string().min(1).max(500),
})

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash"
const SUPPORTED_CURRENCIES = ["USD","EUR","GBP","CHF","CAD","AUD","JPY","NOK","SEK","DKK","NZD","SGD","HKD"]

async function parseTranscript(transcript: string, defaultCurrency: string, today: string) {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured")

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({ model: MODEL })

  const prompt = `Parse this spoken expense statement into a single transaction.

Statement: "${transcript}"

Return only a JSON object:
{
  "amount": number,
  "currency": "${defaultCurrency}",
  "type": "debit",
  "merchantName": null,
  "description": "string",
  "date": "${today}",
  "categoryHint": "other"
}

Rules:
- amount: positive number extracted from statement
- currency: 3-letter ISO code if mentioned, otherwise "${defaultCurrency}"
- type: "debit" for spend/paid/bought; "credit" for received/earned/salary/refund
- merchantName: business name if mentioned, otherwise null
- description: short summary
- date: "${today}" unless a specific date is mentioned
- categoryHint: food|transport|utilities|entertainment|health|shopping|travel|subscription|income|other
- Return only valid JSON, no markdown`

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error("No JSON in AI response")
  return JSON.parse(match[0]) as {
    amount: number
    currency: string
    type: string
    merchantName: string | null
    description: string
    date: string
    categoryHint: string
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const membership = await resolveHousehold(session.user.id)
    if (!membership) return NextResponse.json({ error: "No household" }, { status: 404 })

    const defaultCurrency = membership.household.defaultCurrency ?? "USD"
    const today = new Date().toISOString().split("T")[0]

    let parsed_tx: Awaited<ReturnType<typeof parseTranscript>>
    try {
      parsed_tx = await parseTranscript(parsed.data.transcript, defaultCurrency, today)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Parse failed"
      const isConfig = msg.includes("GEMINI_API_KEY")
      return NextResponse.json(
        { error: isConfig ? "AI not configured — check GEMINI_API_KEY" : "Could not understand the transaction" },
        { status: 422 }
      )
    }

    await ensureCategories()
    const categoryName = HINT_TO_CATEGORY[parsed_tx.categoryHint ?? "other"] ?? "Other"
    const category = await db.category.findFirst({ where: { name: categoryName } })

    const currency = SUPPORTED_CURRENCIES.includes(parsed_tx.currency) ? parsed_tx.currency : defaultCurrency
    const amount = typeof parsed_tx.amount === "number" && parsed_tx.amount > 0 ? parsed_tx.amount : null
    if (!amount) return NextResponse.json({ error: "Could not determine amount from transcript" }, { status: 422 })

    const date = /^\d{4}-\d{2}-\d{2}$/.test(parsed_tx.date) ? parsed_tx.date : today

    const tx = await db.transaction.create({
      data: {
        householdId: membership.householdId,
        date: new Date(date),
        description: parsed_tx.description?.slice(0, 500) || parsed.data.transcript.slice(0, 500),
        merchantName: parsed_tx.merchantName?.slice(0, 200) ?? null,
        amount,
        type: parsed_tx.type === "credit" ? "credit" : "debit",
        currency,
        categoryId: category?.id ?? null,
        needsReview: false,
      },
      include: { category: { select: { id: true, name: true, icon: true, color: true } } },
    })

    return NextResponse.json({ transaction: tx, transcript: parsed.data.transcript }, { status: 201 })
  } catch (err) {
    console.error("[voice] unhandled error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
