import { InvitePageClient } from "@/components/invite-page-client"
import { db } from "@expensable/db"
import { LogoMark } from "@/components/logo"

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const invite = await db.householdInvite.findUnique({
    where: { token },
    include: { household: { select: { name: true } } },
  })

  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="w-full max-w-sm text-center">
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <LogoMark className="w-9 h-9 rounded-xl" />
            <span className="text-slate-900 font-bold text-xl tracking-tight">Expensable</span>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <p className="text-slate-500 text-sm">
              {!invite
                ? "This invite link is invalid."
                : invite.usedAt
                ? "This invite has already been used."
                : "This invite has expired."}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <InvitePageClient
      token={token}
      householdName={invite.household.name}
      expiresAt={invite.expiresAt.toISOString()}
    />
  )
}
