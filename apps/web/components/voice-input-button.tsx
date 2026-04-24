"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Mic, MicOff, Loader2, X, CheckCircle } from "lucide-react"

type State = "idle" | "listening" | "processing" | "success" | "error" | "unsupported"

interface Result {
  merchantName: string | null
  description: string
  amount: number
  currency: string
  type: "debit" | "credit"
}

interface Tradeoff {
  label: string
  emoji: string
}

type SpeechRecognitionEvent = Event & {
  results: { [key: number]: { [key: number]: { transcript: string } } }
}
type SpeechRecognitionErrorEvent = Event & { error: string }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySpeechRecognition = any

export function VoiceInputButton() {
  const [state, setState] = useState<State>("idle")
  const [transcript, setTranscript] = useState("")
  const [result, setResult] = useState<Result | null>(null)
  const [tradeoffs, setTradeoffs] = useState<Tradeoff[]>([])
  const [errorMsg, setErrorMsg] = useState("")
  const [open, setOpen] = useState(false)
  const recognitionRef = useRef<AnySpeechRecognition>(null)
  const router = useRouter()

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!SR) setState("unsupported")
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
  }, [])

  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!SR) return

    const recognition = new SR()
    recognition.lang = "en-US"
    recognition.continuous = false
    recognition.interimResults = true
    recognitionRef.current = recognition

    recognition.onstart = () => setState("listening")
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const t = Array.from({ length: Object.keys(e.results).length })
        .map((_, i) => e.results[i][0].transcript)
        .join("")
      setTranscript(t)
    }
    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === "no-speech") {
        setErrorMsg("No speech detected. Try again.")
      } else {
        setErrorMsg(`Mic error: ${e.error}`)
      }
      setState("error")
    }
    recognition.onend = () => {
      if (state === "listening") setState("idle")
    }

    recognition.start()
  }, [state])

  const submit = useCallback(async () => {
    if (!transcript.trim()) return
    stopListening()
    setState("processing")

    let res: Response
    try {
      res = await fetch("/api/transactions/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: transcript.trim() }),
      })
    } catch {
      setErrorMsg("Could not reach server. Check your connection.")
      setState("error")
      return
    }

    let data: Record<string, unknown>
    try {
      data = await res.json()
    } catch {
      setErrorMsg(`Server error (${res.status}). Check console for details.`)
      setState("error")
      return
    }

    if (!res.ok) {
      setErrorMsg((data.error as string) ?? "Failed to log transaction")
      setState("error")
      return
    }

    const tx = data.transaction as Result
    setResult(tx)
    setState("success")
    router.refresh()
    // Fire-and-forget tradeoffs fetch
    fetch(`/api/insights/tradeoffs?amount=${tx.amount}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.tradeoffs)) setTradeoffs(d.tradeoffs) })
      .catch(() => {})
  }, [transcript, stopListening, router])

  const reset = useCallback(() => {
    stopListening()
    setState("idle")
    setTranscript("")
    setResult(null)
    setTradeoffs([])
    setErrorMsg("")
  }, [stopListening])

  const close = useCallback(() => {
    reset()
    setOpen(false)
  }, [reset])

  if (state === "unsupported") return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition"
        title="Log transaction by voice"
      >
        <Mic className="w-4 h-4 text-emerald-600" />
        Voice
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-slate-900">Voice log</h2>
              <button onClick={close} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {state === "idle" && (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500 mb-6">
                  Say something like{" "}
                  <span className="italic text-slate-700">"I spent 12 euros on lunch"</span>
                </p>
                <button
                  onClick={startListening}
                  className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg transition"
                >
                  <Mic className="w-7 h-7" />
                </button>
                <p className="text-xs text-slate-400 mt-3">Tap to start</p>
              </div>
            )}

            {state === "listening" && (
              <div className="text-center py-4">
                <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-red-500 text-white shadow-lg animate-pulse mb-4">
                  <MicOff className="w-7 h-7" />
                </div>
                <p className="text-xs text-slate-400 mb-3 uppercase tracking-wide font-medium">Listening…</p>
                <p className="text-slate-700 text-sm min-h-[40px] italic px-2">
                  {transcript || "Speak now…"}
                </p>
                <div className="flex gap-2 mt-5 justify-center">
                  <button
                    onClick={reset}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submit}
                    disabled={!transcript.trim()}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-40 transition"
                  >
                    Log it
                  </button>
                </div>
              </div>
            )}

            {state === "processing" && (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Logging transaction…</p>
                <p className="text-xs text-slate-400 mt-1 italic">&ldquo;{transcript}&rdquo;</p>
              </div>
            )}

            {state === "success" && result && (
              <div className="py-2">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">Transaction logged</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount</span>
                    <span className="font-semibold text-slate-800">
                      {result.type === "debit" ? "-" : "+"}
                      {new Intl.NumberFormat(undefined, {
                        style: "currency",
                        currency: result.currency,
                      }).format(result.amount)}
                    </span>
                  </div>
                  {result.merchantName && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Merchant</span>
                      <span className="text-slate-800">{result.merchantName}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Description</span>
                    <span className="text-slate-800 text-right max-w-[60%]">{result.description}</span>
                  </div>
                </div>
                {tradeoffs.length > 0 && (
                  <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-xs text-slate-400 mb-1.5">That&apos;s about…</p>
                    <div className="flex flex-wrap gap-1.5">
                      {tradeoffs.map((t) => (
                        <span key={t.label} className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-600">
                          {t.emoji} {t.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={reset}
                    className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    Log another
                  </button>
                  <button
                    onClick={close}
                    className="flex-1 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {state === "error" && (
              <div className="py-4 text-center">
                <p className="text-sm text-red-600 mb-4">{errorMsg}</p>
                <button
                  onClick={reset}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm hover:bg-slate-200"
                >
                  Try again
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
