import { requireAuth } from "@/lib/auth/session"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAuth()
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-gray-50 p-4">
        <nav className="space-y-1">
          <a href="/dashboard" className="block rounded px-3 py-2 text-sm hover:bg-gray-100">Dashboard</a>
          <a href="/upload" className="block rounded px-3 py-2 text-sm hover:bg-gray-100">Upload</a>
          <a href="/transactions" className="block rounded px-3 py-2 text-sm hover:bg-gray-100">Transactions</a>
          <a href="/subscriptions" className="block rounded px-3 py-2 text-sm hover:bg-gray-100">Subscriptions</a>
          <a href="/insights" className="block rounded px-3 py-2 text-sm hover:bg-gray-100">Insights</a>
          <a href="/settings" className="block rounded px-3 py-2 text-sm hover:bg-gray-100">Settings</a>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
