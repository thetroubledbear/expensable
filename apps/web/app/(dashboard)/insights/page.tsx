import { requireAuth } from "@/lib/auth/session"
import { TrendingUp } from "lucide-react"

export default async function InsightsPage() {
  await requireAuth()
  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Insights</h1>
      </div>
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <TrendingUp className="w-7 h-7 text-slate-400" />
        </div>
        <p className="text-slate-600 font-medium mb-1">Insights — Phase 4</p>
        <p className="text-slate-400 text-sm">Spending trends and AI-powered analysis. Coming in Phase 4.</p>
      </div>
    </div>
  )
}
