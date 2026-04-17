"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { useRouter } from "next/navigation"
import {
  UploadCloud,
  FileText,
  FileImage,
  File,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react"

type UploadStatus = "idle" | "uploading" | "done" | "error"

interface PendingFile {
  id: string
  file: File
  status: UploadStatus
  error?: string
}

const ACCEPT = {
  "text/csv": [".csv"],
  "application/csv": [".csv"],
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
}

function fileIcon(mime: string) {
  if (mime === "application/pdf") return FileText
  if (mime.startsWith("image/")) return FileImage
  return File
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

export function UploadDropzone() {
  const router = useRouter()
  const [files, setFiles] = useState<PendingFile[]>([])
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback((accepted: File[]) => {
    setFiles((prev) => [
      ...prev,
      ...accepted.map((f) => ({
        id: Math.random().toString(36).slice(2),
        file: f,
        status: "idle" as const,
      })),
    ])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxSize: 20 * 1024 * 1024,
    multiple: true,
  })

  function remove(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  async function uploadAll() {
    setUploading(true)
    let anyFailed = false

    for (const pf of files.filter((f) => f.status === "idle")) {
      setFiles((prev) => prev.map((f) => (f.id === pf.id ? { ...f, status: "uploading" } : f)))

      const body = new FormData()
      body.append("file", pf.file)

      const res = await fetch("/api/files", { method: "POST", body })

      if (res.ok) {
        setFiles((prev) => prev.map((f) => (f.id === pf.id ? { ...f, status: "done" } : f)))
      } else {
        const data = await res.json().catch(() => ({}))
        setFiles((prev) =>
          prev.map((f) =>
            f.id === pf.id ? { ...f, status: "error", error: data.error ?? "Upload failed" } : f
          )
        )
        anyFailed = true
      }
    }

    setUploading(false)
    if (!anyFailed) setTimeout(() => router.push("/files"), 600)
  }

  const pendingCount = files.filter((f) => f.status === "idle").length

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-8 py-16 cursor-pointer transition-all select-none ${
          isDragActive
            ? "border-emerald-400 bg-emerald-50/60"
            : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30"
        }`}
      >
        <input {...getInputProps()} />
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-colors ${
            isDragActive ? "bg-emerald-100" : "bg-slate-100"
          }`}
        >
          <UploadCloud
            className={`w-8 h-8 transition-colors ${isDragActive ? "text-emerald-500" : "text-slate-400"}`}
          />
        </div>
        <p className="text-slate-800 font-semibold text-base mb-1">
          {isDragActive ? "Drop to upload" : "Drag & drop files here"}
        </p>
        <p className="text-sm text-slate-400 mb-5">or click to browse your files</p>
        <div className="flex items-center gap-2">
          {["CSV", "PDF", "JPEG · PNG · WebP"].map((t) => (
            <span
              key={t}
              className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-medium"
            >
              {t}
            </span>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3">Max 20 MB per file</p>
      </div>

      {/* Selected files */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map(({ id, file, status, error }) => {
            const Icon = fileIcon(file.type)
            return (
              <div
                key={id}
                className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 px-4 py-3 shadow-sm"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                  <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>
                </div>
                <div className="shrink-0 flex items-center">
                  {status === "idle" && (
                    <button
                      onClick={() => remove(id)}
                      className="text-slate-300 hover:text-slate-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {status === "uploading" && (
                    <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                  )}
                  {status === "done" && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  )}
                  {status === "error" && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-red-500 max-w-[160px] truncate">{error}</span>
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Upload button */}
      {pendingCount > 0 && (
        <button
          onClick={uploadAll}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl py-3 text-sm font-semibold transition-colors"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <UploadCloud className="w-4 h-4" />
              Upload {pendingCount} {pendingCount === 1 ? "file" : "files"}
            </>
          )}
        </button>
      )}
    </div>
  )
}
