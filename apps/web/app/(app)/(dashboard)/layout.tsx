import { requireAuth } from "@/lib/auth/session"
import { db } from "@expensable/db"
import { getPresignedUrl } from "@/lib/storage"
import { Sidebar } from "@/components/sidebar"
import { FilesPoller } from "@/components/files-poller"
import { NoticesBanner } from "@/components/notices-banner"

export const revalidate = 60

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth()

  const dbUser = session.user?.id
    ? await db.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true, image: true },
      })
    : null

  let avatarUrl: string | null = null
  if (dbUser?.image) {
    avatarUrl = dbUser.image.startsWith("http")
      ? dbUser.image
      : await getPresignedUrl(dbUser.image, 3600).catch(() => null)
  }

  const user = {
    name: dbUser?.name ?? session.user?.name,
    email: dbUser?.email ?? session.user?.email,
    avatarUrl,
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar user={user} />
      <main className="flex-1 min-w-0 overflow-auto pt-14 md:pt-0">
        <NoticesBanner />
        {children}
      </main>
      <FilesPoller />
    </div>
  )
}
