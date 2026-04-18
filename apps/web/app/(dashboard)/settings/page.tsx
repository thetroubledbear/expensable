import { requireAuth } from "@/lib/auth/session"
import { db } from "@expensable/db"
import { SettingsForm } from "@/components/settings-form"
import { BillingSection } from "@/components/billing-section"
import { PLANS, type PlanTier } from "@expensable/types"

export default async function SettingsPage() {
  const session = await requireAuth()

  const membership = await db.householdMember.findFirst({
    where: { userId: session.user?.id! },
    include: { household: { include: { billing: true } } },
  })

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
      <div className="space-y-6">
        <SettingsForm
          initialName={household?.name ?? ""}
          initialCurrency={household?.defaultCurrency ?? "USD"}
        />
        <BillingSection
          tier={tier}
          filesUsed={filesUsed}
          monthlyLimit={plan.monthlyFileLimit}
        />
      </div>
    </div>
  )
}
