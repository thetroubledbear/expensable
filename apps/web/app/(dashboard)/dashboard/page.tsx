import { requireAuth } from "@/lib/auth/session"

export default async function DashboardPage() {
  const session = await requireAuth()
  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-gray-500 mt-1">Welcome, {session.user?.name ?? session.user?.email}</p>
      {/* Phase 3: monthly summary cards, chart, recent transactions */}
    </div>
  )
}
