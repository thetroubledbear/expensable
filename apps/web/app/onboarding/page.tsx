import { requireAuth } from "@/lib/auth/session"
import { db } from "@expensable/db"
import { redirect } from "next/navigation"
import { OnboardingWizard } from "@/components/onboarding-wizard"

export default async function OnboardingPage() {
  const session = await requireAuth()
  const userId = session.user?.id!

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { onboardingCompleted: true, name: true },
  })

  if (user?.onboardingCompleted) redirect("/dashboard")

  const firstName = user?.name?.split(" ")[0] ?? "there"
  return <OnboardingWizard firstName={firstName} />
}
