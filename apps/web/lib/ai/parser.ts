import { GoogleGenerativeAI } from "@google/generative-ai"
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

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash"

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
      "categoryHint": "one of: food, transport, utilities, entertainment, health, shopping, travel, subscription, income, transfer, other",
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
- CRITICAL for categoryHint: Use your world knowledge of real businesses, brands, and services to assign the most accurate category. Examples: "STARBUCKS", "BARKBOY", "EXKI", "PAIN QUOTIDIEN" → food; "UBER", "SNCB", "DE LIJN", "VILLO" → transport; "NETFLIX", "SPOTIFY", "AMAZON PRIME" → subscription; "IKEA", "ZARA", "H&M" → shopping; "BOOKING.COM", "AIRBNB" → travel; "DELHAIZE", "LIDL", "CARREFOUR" → food; "AMAZON" → shopping; "APPLE", "GOOGLE" charges → subscription or shopping based on context. For merchant names with city/location context (e.g. a bar name in a European city), use that context to identify the business type. Only use "other" when the merchant is truly unidentifiable (random alphanumeric codes like "REF 48291", internal bank transfers, or codes with no recognizable pattern).`

function extractJson(text: string): ParseResult {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error("No parseable JSON in response")
  return JSON.parse(match[0]) as ParseResult
}

export async function parseFileContent(
  content: ParseInput,
  fileType: FileType
): Promise<ParseResult> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: SYSTEM_PROMPT,
  })

  let parts: Parameters<typeof model.generateContent>[0]

  if (typeof content === "string") {
    const safe = sanitizeForAI(content)
    parts = `Parse all transactions from this ${fileType.toUpperCase()} content:\n\n${safe}`
  } else if (content.type === "pdf") {
    parts = [
      { inlineData: { mimeType: "application/pdf", data: content.data } },
      { text: "Parse all transactions from this PDF document." },
    ]
  } else {
    parts = [
      {
        inlineData: {
          mimeType: content.mediaType as string,
          data: content.data,
        },
      },
      { text: "Parse all transactions from this receipt/document image." },
    ]
  }

  const result = await model.generateContent(parts)
  return extractJson(result.response.text())
}
