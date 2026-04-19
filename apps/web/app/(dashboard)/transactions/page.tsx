import { requireAuth } from "@/lib/auth/session"
import { db } from "@expensable/db"
import { resolveHousehold } from "@/lib/auth/household"
import { ensureCategories } from "@/lib/categories"
import { TransactionsTable } from "@/components/transactions-table"
import { AddTransactionModal } from "@/components/add-transaction-modal"

export const dynamic = "force-dynamic"

export default async function TransactionsPage() {
  const session = await requireAuth()

  const membership = await resolveHousehold(session.user?.id!)

  const hid = membership?.householdId
  const currency = membership?.household.defaultCurrency ?? "USD"
  const isOwner = membership?.role === "owner"

  await ensureCategories()

  const [transactions, total, categories] = hid
    ? await Promise.all([
        db.transaction.findMany({
          where: { householdId: hid },
          orderBy: { date: "desc" },
          take: 25,
          include: {
            category: { select: { id: true, name: true, icon: true, color: true } },
          },
        }),
        db.transaction.count({ where: { householdId: hid } }),
        db.category.findMany({ orderBy: { name: "asc" } }),
      ])
    : [[], 0, []]

  const initialData = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: transactions as any[],
    total,
    page: 1,
    totalPages: Math.ceil(total / 25) || 1,
  }

  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Transactions</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Browse, search, and categorize your transactions
          </p>
        </div>
        <AddTransactionModal categories={categories} defaultCurrency={currency} />
      </div>

      <TransactionsTable
        initialData={initialData}
        categories={categories}
        defaultCurrency={currency}
        isOwner={isOwner}
      />
    </div>
  )
}
