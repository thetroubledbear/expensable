import { requireAuth } from "@/lib/auth/session"
import { db } from "@expensable/db"
import { resolveHousehold } from "@/lib/auth/household"
import Link from "next/link"
import { FilesVault, type VaultFile } from "@/components/files-vault"

export const dynamic = "force-dynamic"

export default async function FilesPage() {
  const session = await requireAuth()

  const membership = await resolveHousehold(session.user?.id!)
  const isOwner = membership?.role === "owner"

  const files = membership
    ? await db.uploadedFile.findMany({
        where: { householdId: membership.householdId },
        orderBy: { uploadedAt: "desc" },
        include: { _count: { select: { transactions: true } } },
      })
    : []

  const vaultFiles: VaultFile[] = files.map((f) => ({
    id: f.id,
    name: f.name,
    type: f.type,
    status: f.status,
    uploadedAt: f.uploadedAt.toISOString(),
    txCount: f._count.transactions,
    errorMsg: f.errorMsg,
  }))

  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Files Vault</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {files.length} file{files.length !== 1 ? "s" : ""} stored
          </p>
        </div>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
        >
          Upload more
        </Link>
      </div>

      <FilesVault files={vaultFiles} isOwner={isOwner} />
    </div>
  )
}
