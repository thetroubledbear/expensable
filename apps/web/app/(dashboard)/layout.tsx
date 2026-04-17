import { requireAuth } from "@/lib/auth/session"
import { Sidebar } from "@/components/sidebar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth()
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar user={session.user ?? {}} />
      <main className="flex-1 min-w-0 overflow-auto">{children}</main>
    </div>
  )
}
