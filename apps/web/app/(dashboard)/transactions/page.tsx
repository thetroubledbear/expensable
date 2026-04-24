import { requireAuth } from "@/lib/auth/session"
import { db } from "@expensable/db"
import { resolveHousehold } from "@/lib/auth/household"
import { ensureCategories } from "@/lib/categories"
import { TransactionsTable } from "@/components/transactions-table"
import { AddTransactionModal } from "@/components/add-transaction-modal"
import { VoiceInputButton } from "@/components/voice-input-button"

export const dynamic = "force-dynamic"

export default async function TransactionsPage() {
  const session = await requireAuth()

  const membership = await resolveHousehold(session.user?.id!)

  const hid = membership?.householdId
  const currency = membership?.household.defaultCurrency ?? "USD"
  const isOwner = membership?.role === "owner"

  await ensureCategories()

  const [transactions, total, categories, accounts] = hid
    ? await Promise.all([
        db.transaction.findMany({
          where: { householdId: hid },
          orderBy: { date: "desc" },
          take: 25,
          include: {
            category: { select: { id: true, name: true, icon: true, color: true } },
            financialAccount: { select: { id: true, name: true, type: true } },
          },
        }),
        db.transaction.count({ where: { householdId: hid } }),
        db.category.findMany({ orderBy: { name: "asc" } }),
        db.financialAccount.findMany({
          where: { householdId: hid },
          orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
          select: { id: true, name: true, type: true },
        }),
      ])
    : [[], 0, [], []]

  const initialData = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: transactions as any[],
    total,
    page: 1,
    totalPages: Math.ceil(total / 25) || 1,
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Transactions</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Browse, search, and categorize your transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <VoiceInputButton />
          <AddTransactionModal categories={categories} defaultCurrency={currency} />
        </div>
      </div>

      <TransactionsTable
        initialData={initialData}
        categories={categories}
        accounts={accounts as { id: string; name: string; type: string }[]}
        defaultCurrency={currency}
        isOwner={isOwner}
      />
    </div>
  )
}
