const BASE = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434"
const MODEL = process.env.OLLAMA_MODEL ?? "gemma4:e4b"

interface OllamaMessage {
  role: "system" | "user" | "assistant"
  content: string
  images?: string[]
}

export async function ollamaChat(
  system: string,
  userText: string,
  imageBase64?: string
): Promise<string> {
  const userMessage: OllamaMessage = { role: "user", content: userText }
  if (imageBase64) userMessage.images = [imageBase64]

  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        userMessage,
      ],
      stream: false,
      format: "json",
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Ollama error ${res.status}: ${text}`)
  }

  const data = await res.json()
  return data.message?.content ?? ""
}
