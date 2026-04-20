"use client"

import { useState } from "react"
import { Send, Sparkles } from "lucide-react"

const EXAMPLE_QUESTIONS = [
  "How much did I spend on food last month?",
  "What's my biggest expense category?",
  "Do I have any unusual subscriptions?",
]

export function NLQueryWidget() {
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function ask(q?: string) {
    const text = (q ?? question).trim()
    if (!text) return
    setLoading(true)
    setAnswer(null)
    setError(null)
    try {
      const res = await fetch("/api/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error ?? "Failed")
      else setAnswer(data.answer)
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !loading) ask() }}
          placeholder="Ask about your spending…"
          className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-300"
        />
        <button
          onClick={() => ask()}
          disabled={loading || !question.trim()}
          className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {!answer && !loading && !error && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Try asking</p>
          {EXAMPLE_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => { setQuestion(q); ask(q) }}
              className="block w-full text-left text-xs text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded-lg transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          Thinking…
        </div>
      )}

      {answer && (
        <div className="flex-1 overflow-auto bg-slate-50 rounded-xl p-3">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-700 leading-relaxed">{answer}</p>
          </div>
          <button
            onClick={() => { setAnswer(null); setQuestion("") }}
            className="mt-2 text-xs text-slate-400 hover:text-slate-600"
          >
            Ask another question
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs text-rose-500">{error}</p>
      )}
    </div>
  )
}
