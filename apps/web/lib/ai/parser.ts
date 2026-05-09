import type { FileType } from "@expensable/types"
import { sanitizeForAI } from "./sanitize"

export interface ParsedTransaction {
  date: string
  description: string
  amount: number
  currency: string
  type: "debit" | "credit"
  merchantName?: string
  categoryHint?: string
  needsReview: boolean
}

export interface ParseResult {
  transactions: ParsedTransaction[]
  rawText?: string
  confidence: "high" | "medium" | "low"
}

type ParseInput =
  | string
  | { type: "image"; mediaType: string; data: string }
  | { type: "pdf"; data: string }

const BASE_URL = "https://ollama.com/api"
const MODEL = process.env.OLLAMA_MODEL ?? "gemma4:31b-cloud"

const SYSTEM_PROMPT = `You are a financial data extraction expert. Extract all transactions from the provided document.
Return a JSON object with this exact structure:
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "original description from document",
      "amount": 12.50,
      "currency": "USD",
      "type": "debit" | "credit",
      "merchantName": "cleaned merchant name or null",
      "categoryHint": "one of: food, transport, utilities, entertainment, health, housing, shopping, travel, subscription, income, transfer, other",
      "needsReview": true | false
    }
  ],
  "confidence": "high" | "medium" | "low"
}
Rules:
- Set needsReview=true when date, amount, or merchant is ambiguous
- Amounts are always positive numbers regardless of debit/credit
- Use ISO 8601 date format (YYYY-MM-DD)
- Return only the JSON object, no other text
- CRITICAL for categoryHint: Use your world knowledge of real businesses, brands, and services to assign the most accurate category. Examples: "STARBUCKS", "BARKBOY", "EXKI", "PAIN QUOTIDIEN" → food; "UBER", "SNCB", "DE LIJN", "VILLO" → transport; "NETFLIX", "SPOTIFY", "AMAZON PRIME" → subscription; "IKEA", "ZARA", "H&M" → shopping; "BOOKING.COM", "AIRBNB" → travel; "DELHAIZE", "LIDL", "CARREFOUR" → food; "AMAZON" → shopping; "APPLE", "GOOGLE" charges → subscription or shopping based on context. For merchant names with city/location context (e.g. a bar name in a European city), use that context to identify the business type. Use "housing" for rent payments, mortgage payments, landlord transfers, property management fees, or any description containing words like "rent", "mortgage", "huur", "hypotheek", "landlord", or "half mortgage and bills". Only use "other" when the merchant is truly unidentifiable (random alphanumeric codes like "REF 48291", internal bank transfers, or codes with no recognizable pattern).`

function extractJson(text: string): ParseResult {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error("No parseable JSON in response")
  const cleaned = match[0].replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
  return JSON.parse(cleaned) as ParseResult
}

export async function parseFileContent(
  content: ParseInput,
  fileType: FileType
): Promise<ParseResult> {
  if (typeof content === "object" && content.type === "pdf") {
    throw new Error("PDF parsing is not supported with Ollama cloud. Use a provider that accepts PDF input.")
  }

  const messages: Array<{ role: string; content: string; images?: string[] }> = [
    { role: "system", content: SYSTEM_PROMPT },
  ]

  if (typeof content === "string") {
    const safe = sanitizeForAI(content)
    messages.push({
      role: "user",
      content: `Parse all transactions from this ${fileType.toUpperCase()} content:\n\n${safe}`,
    })
  } else {
    messages.push({
      role: "user",
      content: "Parse all transactions from this receipt/document image.",
      images: [content.data],
    })
  }

  const res = await fetch(`${BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: false,
      format: "json",
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Ollama cloud error ${res.status}: ${body}`)
  }

  const data = await res.json() as { message?: { content?: string } }
  const text = data.message?.content ?? ""
  return extractJson(text)
}
