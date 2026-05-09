const BASE_URL = "https://ollama.com/api"
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "gemma4"

export async function ollamaChat(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const res = await fetch(`${BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: false,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Ollama cloud error ${res.status}: ${body}`)
  }

  const data = await res.json() as { message?: { content?: string } }
  return data.message?.content ?? ""
}
