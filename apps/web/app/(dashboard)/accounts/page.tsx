import { auth } from "@/lib/auth/config"
import { redirect } from "next/navigation"
import { db } from "@expensable/db"
import { resolveHousehold } from "@/lib/auth/household"
import { AccountsManager, type AccountType } from "@/components/accounts-manager"

export default async function AccountsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const membership = await resolveHousehold(session.user.id)
  if (!membership) redirect("/dashboard")

  let accounts = await db.financialAccount.findMany({
    where: { householdId: membership.householdId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    include: { _count: { select: { transactions: true } } },
  })

  if (accounts.length === 0) {
    const defaultAccount = await db.financialAccount.create({
      data: {
        householdId: membership.householdId,
        name: "Checking",
        type: "checking",
        isDefault: true,
        currency: membership.household.defaultCurrency,
      },
      include: { _count: { select: { transactions: true } } },
    })
    accounts = [defaultAccount]
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Accounts</h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage your checking, savings, and other accounts. Assign uploads to specific accounts.
        </p>
      </div>
      <AccountsManager
        initialAccounts={accounts as { id: string; name: string; type: AccountType; isDefault: boolean; currency: string; _count: { transactions: number } }[]}
        defaultCurrency={membership.household.defaultCurrency}
        isOwner={membership.role === "owner"}
      />
    </div>
  )
}
