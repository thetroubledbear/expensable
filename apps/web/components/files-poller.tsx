"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, AlertCircle, X, Loader2 } from "lucide-react"

interface FileStatus {
  id: string
  name: string
  status: string
  processedAt: string | null
}

interface Toast {
  key: string
  name: string
  type: "done" | "failed"
}

export function FilesPoller() {
  const router = useRouter()
  const prevStatuses = useRef<Record<string, string>>({})
  const initialized = useRef(false)
  const [files, setFiles] = useState<FileStatus[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/files")
      if (!res.ok) return
      const data: FileStatus[] = await res.json()
      setFiles(data)

      if (!initialized.current) {
        const map: Record<string, string> = {}
        for (const f of data) map[f.id] = f.status
        prevStatuses.current = map
        initialized.current = true
        // Refresh if any file was recently processed — page may have rendered before it finished
        const fiveMinAgo = Date.now() - 5 * 60 * 1000
        const hasRecentlyDone = data.some(
          (f) =>
            (f.status === "done" || f.status === "failed") &&
            f.processedAt != null &&
            new Date(f.processedAt).getTime() > fiveMinAgo
        )
        if (hasRecentlyDone) router.refresh()
        return
      }

      const next: Toast[] = []
      for (const f of data) {
        const prev = prevStatuses.current[f.id]
        if (prev && prev !== f.status && (f.status === "done" || f.status === "failed")) {
          next.push({ key: `${f.id}-${Date.now()}`, name: f.name, type: f.status as "done" | "failed" })
        }
      }
      if (next.length) {
        setToasts((t) => [...t, ...next])
        router.refresh()
      }

      const map: Record<string, string> = {}
      for (const f of data) map[f.id] = f.status
      prevStatuses.current = map
    } catch {
      // silent — don't spam errors on network issues
    }
  }, [router])

  // Initial fetch
  useEffect(() => {
    poll()
  }, [poll])

  // Polling interval — always active, not gated on hasProcessing
  useEffect(() => {
    const id = setInterval(poll, 3000)
    return () => clearInterval(id)
  }, [poll])

  // Auto-dismiss oldest toast after 5 s
  useEffect(() => {
    if (!toasts.length) return
    const timer = setTimeout(() => setToasts((t) => t.slice(1)), 5000)
    return () => clearTimeout(timer)
  }, [toasts])

  const dismiss = useCallback((key: string) => {
    setToasts((t) => t.filter((toast) => toast.key !== key))
  }, [])

  const processingCount = files.filter(
    (f) => f.status === "pending" || f.status === "processing"
  ).length
  const isProcessing = processingCount > 0
  const visible = isProcessing || toasts.length > 0

  if (!visible) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.key}
          className={`pointer-events-auto flex items-center gap-3 pl-3.5 pr-3 py-2.5 rounded-2xl shadow-lg border text-sm font-medium max-w-xs w-full bg-white ${
            toast.type === "done" ? "border-emerald-200" : "border-red-200"
          }`}
        >
          {toast.type === "done" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          )}
          <span className="flex-1 truncate text-slate-700 text-xs">
            <span className={`font-semibold ${toast.type === "done" ? "text-emerald-600" : "text-red-600"}`}>
              {toast.type === "done" ? "Done" : "Failed"}
            </span>
            {" — "}{toast.name}
          </span>
          <button
            onClick={() => dismiss(toast.key)}
            className="text-slate-300 hover:text-slate-500 transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      {isProcessing && (
        <div className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-lg">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Processing {processingCount} file{processingCount !== 1 ? "s" : ""}…
        </div>
      )}
    </div>
  )
}
