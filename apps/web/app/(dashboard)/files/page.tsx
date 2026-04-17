import { requireAuth } from "@/lib/auth/session"
import { db } from "@expensable/db"
import { FileText, FileImage, File, Clock, CheckCircle2, AlertCircle, Loader2, FolderOpen } from "lucide-react"
import Link from "next/link"
import { FilesPoller } from "@/components/files-poller"
import { FileDeleteButton } from "@/components/file-delete-button"

export const dynamic = "force-dynamic"

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    icon: Clock,
    class: "bg-amber-50 text-amber-700 border-amber-200",
  },
  processing: {
    label: "Processing",
    icon: Loader2,
    class: "bg-blue-50 text-blue-700 border-blue-200",
    spin: true,
  },
  done: {
    label: "Done",
    icon: CheckCircle2,
    class: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  failed: {
    label: "Failed",
    icon: AlertCircle,
    class: "bg-red-50 text-red-700 border-red-200",
  },
}

function FileTypeIcon({ type }: { type: string }) {
  if (type === "pdf") return <FileText className="w-4 h-4 text-slate-500" />
  if (type === "image") return <FileImage className="w-4 h-4 text-slate-500" />
  return <File className="w-4 h-4 text-slate-500" />
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending
  const Icon = cfg.icon
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.class}`}
    >
      <Icon className={`w-3 h-3 ${"spin" in cfg && cfg.spin ? "animate-spin" : ""}`} />
      {cfg.label}
    </span>
  )
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d))
}

export default async function FilesPage() {
  const session = await requireAuth()

  const membership = await db.householdMember.findFirst({
    where: { userId: session.user?.id! },
  })

  const files = membership
    ? await db.uploadedFile.findMany({
        where: { householdId: membership.householdId },
        orderBy: { uploadedAt: "desc" },
        include: { _count: { select: { transactions: true } } },
      })
    : []

  const hasProcessing = files.some(
    (f) => f.status === "pending" || f.status === "processing"
  )

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <FilesPoller hasProcessing={hasProcessing} />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Files</h1>
          <p className="text-slate-500 mt-1 text-sm">{files.length} file{files.length !== 1 ? "s" : ""} uploaded</p>
        </div>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
        >
          Upload more
        </Link>
      </div>

      {files.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <FolderOpen className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-slate-600 font-medium mb-1">No files yet</p>
          <p className="text-slate-400 text-sm">Upload a bank statement or receipt to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-400 uppercase tracking-wide">File</th>
                <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-400 uppercase tracking-wide">Type</th>
                <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-400 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-400 uppercase tracking-wide">Transactions</th>
                <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-400 uppercase tracking-wide">Uploaded</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {files.map((file) => (
                <tr key={file.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <FileTypeIcon type={file.type} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 truncate max-w-[200px]">{file.name}</p>
                        {file.errorMsg && (
                          <p className="text-xs text-red-500 truncate max-w-[200px]">{file.errorMsg}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium uppercase">
                      {file.type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={file.status} />
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 tabular-nums">
                    {file.status === "done" ? file._count.transactions : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs">
                    {formatDate(file.uploadedAt)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <FileDeleteButton fileId={file.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
