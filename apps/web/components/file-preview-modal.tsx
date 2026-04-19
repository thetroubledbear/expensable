"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Loader2, Download, FileText, FileImage, File, ExternalLink, AlertCircle } from "lucide-react"

interface VaultFile {
  id: string
  name: string
  type: string
  status: string
  uploadedAt: string
  txCount: number
  errorMsg: string | null
}

interface Props {
  file: VaultFile
  onClose: () => void
}

const TYPE_CONFIG = {
  pdf:   { label: "PDF",        bg: "bg-red-50",     icon: FileText,  iconColor: "text-red-400" },
  csv:   { label: "CSV",        bg: "bg-emerald-50", icon: File,      iconColor: "text-emerald-400" },
  image: { label: "Image",      bg: "bg-violet-50",  icon: FileImage, iconColor: "text-violet-400" },
}

function formatDate(d: string) {
  return new Intl.DateTimeFormat("en", {
    month: "long", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(d))
}

export function FilePreviewModal({ file, onClose }: Props) {
  const [url, setUrl] = useState<string | null>(null)
  const [csvText, setCsvText] = useState<string | null>(null)
  const [loadingUrl, setLoadingUrl] = useState(true)
  const [urlError, setUrlError] = useState("")

  const fetchUrl = useCallback(async () => {
    setLoadingUrl(true)
    setUrlError("")
    try {
      const res = await fetch(`/api/files/${file.id}/url`)
      if (!res.ok) throw new Error("Failed")
      const data = await res.json()
      setUrl(data.url)
      if (file.type === "csv") {
        const text = await fetch(data.url).then((r) => r.text())
        setCsvText(text)
      }
    } catch {
      setUrlError("Could not load preview")
    } finally {
      setLoadingUrl(false)
    }
  }, [file.id, file.type])

  useEffect(() => {
    fetchUrl()
  }, [fetchUrl])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const typeCfg = TYPE_CONFIG[file.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.pdf
  const TypeIcon = typeCfg.icon

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 shrink-0">
          <div className={`w-9 h-9 rounded-xl ${typeCfg.bg} flex items-center justify-center shrink-0`}>
            <TypeIcon className={`w-4 h-4 ${typeCfg.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 truncate">{file.name}</p>
            <p className="text-xs text-slate-400">{formatDate(file.uploadedAt)}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {url && (
              <a
                href={url}
                download={file.name}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </a>
            )}
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          {/* Preview area */}
          <div className="flex-1 min-w-0 flex items-center justify-center bg-slate-50 rounded-bl-2xl overflow-hidden">
            {loadingUrl && (
              <Loader2 className="w-7 h-7 animate-spin text-slate-300" />
            )}
            {urlError && (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <AlertCircle className="w-8 h-8" />
                <p className="text-sm">{urlError}</p>
              </div>
            )}
            {!loadingUrl && !urlError && url && (
              <>
                {file.type === "image" && (
                  <img
                    src={url}
                    alt={file.name}
                    className="max-w-full max-h-full object-contain p-4"
                  />
                )}
                {file.type === "pdf" && (
                  <iframe
                    src={url}
                    className="w-full h-full border-0"
                    title={file.name}
                  />
                )}
                {file.type === "csv" && (
                  <div className="w-full h-full overflow-auto p-4">
                    <pre className="text-xs text-slate-700 font-mono whitespace-pre leading-relaxed">
                      {csvText ?? "Loading…"}
                    </pre>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Metadata sidebar */}
          <div className="w-56 shrink-0 border-l border-slate-100 p-5 space-y-5 overflow-y-auto">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Details</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-400">Type</p>
                  <p className="text-sm font-medium text-slate-700 uppercase">{file.type}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Status</p>
                  <StatusDot status={file.status} />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Transactions</p>
                  <p className="text-sm font-medium text-slate-700">
                    {file.status === "done" ? file.txCount : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Uploaded</p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {formatDate(file.uploadedAt)}
                  </p>
                </div>
                {file.errorMsg && (
                  <div>
                    <p className="text-xs text-slate-400">Error</p>
                    <p className="text-xs text-red-500 leading-relaxed">{file.errorMsg}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusDot({ status }: { status: string }) {
  const cfg = {
    pending:    { color: "bg-amber-400",   label: "Pending" },
    processing: { color: "bg-blue-400",    label: "Processing" },
    done:       { color: "bg-emerald-400", label: "Done" },
    failed:     { color: "bg-red-400",     label: "Failed" },
  }
  const c = cfg[status as keyof typeof cfg] ?? cfg.pending
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${c.color}`} />
      <span className="text-sm font-medium text-slate-700">{c.label}</span>
    </div>
  )
}
