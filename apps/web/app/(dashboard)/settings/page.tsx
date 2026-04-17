import { requireAuth } from "@/lib/auth/session"
import { db } from "@expensable/db"
import { SettingsForm } from "@/components/settings-form"

export default async function SettingsPage() {
  const session = await requireAuth()

  const membership = await db.householdMember.findFirst({
    where: { userId: session.user?.id! },
    include: { household: true },
  })

  const household = membership?.household

  return (
    <div className="p-8 max-w-2xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1 text-sm">Manage your household preferences</p>
      </div>
      <SettingsForm
        initialName={household?.name ?? ""}
        initialCurrency={household?.defaultCurrency ?? "USD"}
      />
    </div>
  )
}
