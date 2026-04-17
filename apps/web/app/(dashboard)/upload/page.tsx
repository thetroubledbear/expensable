import { requireAuth } from "@/lib/auth/session"
import { UploadDropzone } from "@/components/upload-dropzone"
import { db } from "@expensable/db"
import { PLANS } from "@expensable/types"

export default async function UploadPage() {
  const session = await requireAuth()

  const membership = await db.householdMember.findFirst({
    where: { userId: session.user?.id! },
    include: { household: { include: { billing: true } } },
  })

  const billing = membership?.household.billing
  const tier = (billing?.tier ?? "free") as keyof typeof PLANS
  const used = billing?.filesUploadedThisMonth ?? 0
  const limit = PLANS[tier].monthlyFileLimit

  return (
    <div className="p-8 max-w-2xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Upload Files</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Claude will extract transactions from your bank statements, PDFs, and receipts.
        </p>
      </div>

      {/* Plan usage pill */}
      <div className="flex items-center gap-3 mb-6 p-3.5 rounded-xl bg-white border border-slate-100 shadow-sm w-fit">
        <div className="flex-1">
          <p className="text-xs text-slate-500">Files this month</p>
          <p className="text-sm font-semibold text-slate-800">
            {used} / {limit}
            <span className="ml-1.5 text-xs font-normal text-slate-400 capitalize">({tier} plan)</span>
          </p>
        </div>
        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${Math.min((used / limit) * 100, 100)}%` }}
          />
        </div>
      </div>

      <UploadDropzone />
    </div>
  )
}
