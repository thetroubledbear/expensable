import { requireAuth } from "@/lib/auth/session"
import { db } from "@expensable/db"
import { resolveHousehold } from "@/lib/auth/household"
import { getPresignedUrl } from "@/lib/storage"
import { SettingsForm } from "@/components/settings-form"
import { BillingSection } from "@/components/billing-section"
import { MembersSection } from "@/components/members-section"
import { AvatarUpload } from "@/components/avatar-upload"
import { PLANS, type PlanTier } from "@expensable/types"
import { CheckCircle2, Users } from "lucide-react"

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>
}) {
  const { upgraded } = await searchParams
  const session = await requireAuth()

  // Resolve avatar URL fresh from DB
  const dbUser = session.user?.id
    ? await db.user.findUnique({ where: { id: session.user.id }, select: { name: true, image: true } })
    : null
  let avatarUrl: string | null = null
  if (dbUser?.image) {
    avatarUrl = dbUser.image.startsWith("http")
      ? dbUser.image
      : await getPresignedUrl(dbUser.image, 3600).catch(() => null)
  }

  const baseMembership = await resolveHousehold(session.user?.id!)

  // Re-query with members included (resolveHousehold doesn't include members)
  const membership = baseMembership
    ? await db.householdMember.findFirst({
        where: { id: baseMembership.id },
        include: {
          household: {
            include: {
              billing: true,
              members: {
                include: { user: { select: { id: true, name: true, email: true, image: true } } },
                orderBy: { joinedAt: "asc" },
              },
            },
          },
        },
      })
    : null

  const household = membership?.household
  const billing = household?.billing
  const tier = (billing?.tier ?? "free") as PlanTier
  const plan = PLANS[tier]

  // Use 0 if the billing cycle has rolled into a new calendar month
  let filesUsed = billing?.filesUploadedThisMonth ?? 0
  if (billing) {
    const now = new Date()
    const c = billing.billingCycleStart
    if (c.getMonth() !== now.getMonth() || c.getFullYear() !== now.getFullYear()) {
      filesUsed = 0
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1 text-sm">Manage your household preferences</p>
      </div>
      {upgraded && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-700 font-medium">
            Plan upgraded successfully — welcome to {tier.charAt(0).toUpperCase() + tier.slice(1)}!
          </p>
        </div>
      )}
      <div className="space-y-6">
        {/* Profile / Avatar */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Profile</h2>
          <AvatarUpload
            currentUrl={avatarUrl}
            userName={dbUser?.name ?? session.user?.name}
          />
        </div>

        <SettingsForm
          initialName={household?.name ?? ""}
          initialCurrency={household?.defaultCurrency ?? "USD"}
        />
        {membership?.role === "owner" ? (
          <BillingSection
            tier={tier}
            filesUsed={filesUsed}
            monthlyLimit={plan.monthlyFileLimit}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Plan</h2>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 capitalize">{tier} plan</p>
                <p className="text-xs text-slate-400">Managed by the household owner</p>
              </div>
            </div>
          </div>
        )}
        {tier === "family" && (
          <MembersSection
            members={(household?.members ?? []).map((m) => ({
              id: m.id,
              userId: m.userId,
              role: m.role,
              joinedAt: m.joinedAt.toISOString(),
              name: m.user.name,
              email: m.user.email,
            }))}
            isOwner={membership?.role === "owner"}
            maxMembers={plan.maxHouseholdMembers}
          />
        )}
      </div>
    </div>
  )
}
