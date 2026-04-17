import Anthropic from "@anthropic-ai/sdk"
import type { FileType } from "@expensable/types"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export interface ParsedTransaction {
  date: string        // ISO date string
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

const SYSTEM_PROMPT = `You are a financial data extraction expert. Extract all transactions from the provided document.
Return a JSON object with this structure:
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
      "needsReview": true/false
    }
  ],
  "confidence": "high" | "medium" | "low"
}
Set needsReview=true when date, amount, or merchant is ambiguous. Amounts should be positive numbers regardless of debit/credit.`

export async function parseFileContent(
  content: string | { type: "base64"; mediaType: string; data: string },
  fileType: FileType
): Promise<ParseResult> {
  const userContent =
    typeof content === "string"
      ? `Parse all transactions from this ${fileType.toUpperCase()} content:\n\n${content}`
      : `Parse all transactions from this receipt/document image.`

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content:
          typeof content === "string"
            ? userContent
            : [
                {
                  type: "image",
                  source: { type: "base64", media_type: content.mediaType as "image/jpeg" | "image/png" | "image/webp", data: content.data },
                },
                { type: "text", text: "Parse all transactions from this receipt/document image." },
              ],
      },
    ],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : ""
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error("Claude returned no parseable JSON")

  return JSON.parse(jsonMatch[0]) as ParseResult
}
