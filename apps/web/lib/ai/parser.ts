import Anthropic from "@anthropic-ai/sdk"
import { ollamaChat } from "./ollama"
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
- Return only the JSON object, no other text`

function useOllama() {
  return !process.env.ANTHROPIC_API_KEY
}

function extractJson(text: string): ParseResult {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error("No parseable JSON in response")
  return JSON.parse(match[0]) as ParseResult
}

async function parseWithOllama(content: ParseInput, fileType: FileType): Promise<ParseResult> {
  if (content instanceof Object && content.type === "pdf") {
    throw new Error("PDF parsing requires ANTHROPIC_API_KEY — Ollama cannot read PDFs natively")
  }

  if (typeof content === "string") {
    const safe = sanitizeForAI(content)
    const raw = await ollamaChat(
      SYSTEM_PROMPT,
      `Parse all transactions from this ${fileType.toUpperCase()} content:\n\n${safe}`
    )
    return extractJson(raw)
  }

  // image — gemma4 supports vision
  const raw = await ollamaChat(
    SYSTEM_PROMPT,
    "Parse all transactions from this receipt/document image.",
    content.data
  )
  return extractJson(raw)
}

async function parseWithClaude(content: ParseInput, fileType: FileType): Promise<ParseResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  let messageContent: Anthropic.MessageParam["content"]

  if (typeof content === "string") {
    const safe = sanitizeForAI(content)
    messageContent = `Parse all transactions from this ${fileType.toUpperCase()} content:\n\n${safe}`
  } else if (content.type === "pdf") {
    messageContent = [
      {
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: content.data },
      },
      { type: "text", text: "Parse all transactions from this PDF document." },
    ]
  } else {
    messageContent = [
      {
        type: "image",
        source: {
          type: "base64",
          media_type: content.mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
          data: content.data,
        },
      },
      { type: "text", text: "Parse all transactions from this receipt/document image." },
    ]
  }

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: messageContent }],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : ""
  return extractJson(text)
}

export async function parseFileContent(
  content: ParseInput,
  fileType: FileType
): Promise<ParseResult> {
  return useOllama()
    ? parseWithOllama(content, fileType)
    : parseWithClaude(content, fileType)
}
