"use client"

import { useState, useMemo } from "react"
import {
  Search, LayoutGrid, List, FolderOpen, FileText, FileImage, File,
  Clock, CheckCircle2, AlertCircle, Loader2, Eye, Receipt,
} from "lucide-react"
import { FileDeleteButton } from "@/components/file-delete-button"
import { FilePreviewModal } from "@/components/file-preview-modal"

export interface VaultFile {
  id: string
  name: string
  type: string
  status: string
  uploadedAt: string
  txCount: number
  errorMsg: string | null
}

interface Props {
  files: VaultFile[]
  isOwner: boolean
}

const TYPE_CONFIG = {
  pdf:   { label: "PDF",   bg: "bg-red-50",     iconColor: "text-red-400",     border: "border-red-100" },
  csv:   { label: "CSV",   bg: "bg-emerald-50", iconColor: "text-emerald-400", border: "border-emerald-100" },
  image: { label: "Image", bg: "bg-violet-50",  iconColor: "text-violet-400",  border: "border-violet-100" },
}

const STATUS_CONFIG = {
  pending:    { label: "Pending",    dot: "bg-amber-400",   text: "text-amber-700",   badge: "bg-amber-50 border-amber-200" },
  processing: { label: "Processing", dot: "bg-blue-400",    text: "text-blue-700",    badge: "bg-blue-50 border-blue-200" },
  done:       { label: "Done",       dot: "bg-emerald-400", text: "text-emerald-700", badge: "bg-emerald-50 border-emerald-200" },
  failed:     { label: "Failed",     dot: "bg-red-400",     text: "text-red-700",     badge: "bg-red-50 border-red-200" },
}

function TypeIcon({ type, className }: { type: string; className?: string }) {
  const cls = className ?? "w-7 h-7"
  if (type === "pdf")   return <FileText  className={cls} />
  if (type === "image") return <FileImage className={cls} />
  return <File className={cls} />
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.badge} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function formatDate(d: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(d))
}

const TYPE_TABS = ["all", "pdf", "csv", "image"] as const
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "name",   label: "Name A–Z" },
]

export function FilesVault({ files, isOwner }: Props) {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [sort, setSort] = useState("newest")
  const [view, setView] = useState<"grid" | "list">("grid")
  const [preview, setPreview] = useState<VaultFile | null>(null)

  const filtered = useMemo(() => {
    let result = files
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((f) => f.name.toLowerCase().includes(q))
    }
    if (typeFilter !== "all") {
      result = result.filter((f) => f.type === typeFilter)
    }
    result = [...result].sort((a, b) => {
      if (sort === "newest") return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      if (sort === "oldest") return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
      return a.name.localeCompare(b.name)
    })
    return result
  }, [files, search, typeFilter, sort])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: files.length }
    for (const f of files) c[f.type] = (c[f.type] ?? 0) + 1
    return c
  }, [files])

  if (files.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-16 text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
          <FolderOpen className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-slate-700 font-semibold text-lg mb-1">Your vault is empty</p>
        <p className="text-slate-400 text-sm max-w-xs mx-auto">
          Upload bank statements, receipts, or CSV exports to start organizing your finances.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search files…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-slate-700 transition"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* View toggle */}
        <div className="flex rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => setView("grid")}
            className={`p-2.5 transition-colors ${view === "grid" ? "bg-slate-900 text-white" : "text-slate-400 hover:bg-slate-50"}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView("list")}
            className={`p-2.5 transition-colors ${view === "list" ? "bg-slate-900 text-white" : "text-slate-400 hover:bg-slate-50"}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Type tabs */}
      <div className="flex gap-1.5 mb-5">
        {TYPE_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${
              typeFilter === t
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {t === "all" ? "All" : t.toUpperCase()} {counts[t] ? `· ${counts[t]}` : ""}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          No files match your search
        </div>
      ) : view === "grid" ? (
        <GridView files={filtered} isOwner={isOwner} onPreview={setPreview} />
      ) : (
        <ListView files={filtered} isOwner={isOwner} onPreview={setPreview} />
      )}

      {preview && (
        <FilePreviewModal file={preview} onClose={() => setPreview(null)} />
      )}
    </>
  )
}

// ─── Grid View ────────────────────────────────────────────────────────────────

function GridView({
  files,
  isOwner,
  onPreview,
}: {
  files: VaultFile[]
  isOwner: boolean
  onPreview: (f: VaultFile) => void
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {files.map((f) => (
        <GridCard key={f.id} file={f} isOwner={isOwner} onPreview={onPreview} />
      ))}
    </div>
  )
}

function GridCard({
  file,
  isOwner,
  onPreview,
}: {
  file: VaultFile
  isOwner: boolean
  onPreview: (f: VaultFile) => void
}) {
  const typeCfg = TYPE_CONFIG[file.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.pdf

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md hover:border-slate-200 transition-all">
      {/* Thumbnail area */}
      <button
        onClick={() => onPreview(file)}
        className={`w-full aspect-[4/3] flex flex-col items-center justify-center gap-2 ${typeCfg.bg} relative`}
      >
        <TypeIcon type={file.type} className={`w-10 h-10 ${typeCfg.iconColor}`} />
        <span className={`text-[10px] font-bold tracking-widest uppercase ${typeCfg.iconColor} opacity-60`}>
          {file.type}
        </span>
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-xl px-3 py-1.5 flex items-center gap-1.5 shadow-sm text-xs font-semibold text-slate-700">
            <Eye className="w-3.5 h-3.5" />
            Preview
          </div>
        </div>
        {/* Status indicator dot */}
        <div className="absolute top-2.5 right-2.5">
          <StatusBadge status={file.status} />
        </div>
      </button>

      {/* Info */}
      <div className="px-3.5 pt-3 pb-3.5">
        <p className="text-sm font-semibold text-slate-800 truncate leading-snug" title={file.name}>
          {file.name}
        </p>
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-xs text-slate-400">{formatDate(file.uploadedAt)}</p>
          {file.status === "done" && file.txCount > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <Receipt className="w-3 h-3" />
              {file.txCount}
            </div>
          )}
        </div>
        {file.errorMsg && (
          <p className="text-[10px] text-red-500 mt-1 truncate">{file.errorMsg}</p>
        )}
        {isOwner && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-50 flex justify-end">
            <FileDeleteButton fileId={file.id} isOwner={isOwner} />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── List View ────────────────────────────────────────────────────────────────

function ListView({
  files,
  isOwner,
  onPreview,
}: {
  files: VaultFile[]
  isOwner: boolean
  onPreview: (f: VaultFile) => void
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-400 uppercase tracking-wide">File</th>
            <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-400 uppercase tracking-wide hidden sm:table-cell">Type</th>
            <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-400 uppercase tracking-wide">Status</th>
            <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-400 uppercase tracking-wide hidden md:table-cell">Transactions</th>
            <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-400 uppercase tracking-wide hidden lg:table-cell">Uploaded</th>
            <th className="px-5 py-3.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {files.map((file) => {
            const typeCfg = TYPE_CONFIG[file.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.pdf
            return (
              <tr key={file.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl ${typeCfg.bg} flex items-center justify-center shrink-0`}>
                      <TypeIcon type={file.type} className={`w-4 h-4 ${typeCfg.iconColor}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 truncate max-w-[180px]">{file.name}</p>
                      {file.errorMsg && (
                        <p className="text-xs text-red-500 truncate max-w-[180px]">{file.errorMsg}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 hidden sm:table-cell">
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium uppercase">
                    {file.type}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={file.status} />
                </td>
                <td className="px-5 py-3.5 text-slate-600 tabular-nums hidden md:table-cell">
                  {file.status === "done" ? file.txCount : "—"}
                </td>
                <td className="px-5 py-3.5 text-slate-400 text-xs hidden lg:table-cell">
                  {formatDate(file.uploadedAt)}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => onPreview(file)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <FileDeleteButton fileId={file.id} isOwner={isOwner} />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
