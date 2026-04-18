"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PLANS, type PlanTier } from "@expensable/types"
import { Zap, Users, Check, ArrowUpCircle, ArrowDownCircle } from "lucide-react"

const PLAN_META: Record<PlanTier, { label: string; price: string; badgeClass: string }> = {
  free: { label: "Free", price: "$0/mo", badgeClass: "bg-slate-100 text-slate-700" },
  pro: { label: "Pro", price: "$9/mo", badgeClass: "bg-emerald-100 text-emerald-700" },
  family: { label: "Family", price: "$19/mo", badgeClass: "bg-violet-100 text-violet-700" },
}

interface Props {
  tier: PlanTier
  filesUsed: number
  monthlyLimit: number
}

export function BillingSection({ tier, filesUsed, monthlyLimit }: Props) {
  const [loading, setLoading] = useState<"pro" | "family" | "portal" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const meta = PLAN_META[tier]
  const usagePct = Math.min((filesUsed / monthlyLimit) * 100, 100)

  async function startCheckout(targetTier: "pro" | "family") {
    setLoading(targetTier)
    setError(null)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: targetTier }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? "Something went wrong")
      }
    } catch {
      setError("Network error — please try again")
    } finally {
      setLoading(null)
    }
  }

  async function changePlan(targetTier: "pro" | "family") {
    setLoading(targetTier)
    setError(null)
    try {
      const res = await fetch("/api/stripe/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: targetTier }),
      })
      const data = await res.json()
      if (data.success) {
        router.refresh()
      } else {
        setError(data.error ?? "Something went wrong")
      }
    } catch {
      setError("Network error — please try again")
    } finally {
      setLoading(null)
    }
  }

  async function manageSubscription() {
    setLoading("portal")
    setError(null)
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? "Something went wrong")
      }
    } catch {
      setError("Network error — please try again")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <h2 className="text-sm font-semibold text-slate-700 mb-5">Plan &amp; Billing</h2>
      {error && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-xs text-red-600">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between mb-5">
        <div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${meta.badgeClass}`}>
            {meta.label}
          </span>
          <p className="text-xs text-slate-400 mt-1">{meta.price}</p>
        </div>
        {tier !== "free" && (
          <button
            onClick={manageSubscription}
            disabled={loading === "portal"}
            className="text-xs text-emerald-600 hover:underline disabled:opacity-50"
          >
            {loading === "portal" ? "Loading…" : "Manage subscription"}
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs text-slate-500">Files this month</p>
          <p className="text-xs font-medium text-slate-700 tabular-nums">
            {filesUsed} / {monthlyLimit}
          </p>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${usagePct >= 90 ? "bg-red-400" : "bg-emerald-400"}`}
            style={{ width: `${usagePct}%` }}
          />
        </div>
      </div>

      {tier === "free" && (
        <div className="grid grid-cols-2 gap-3">
          <PlanCard
            name="Pro"
            price="$9/mo"
            features={[`${PLANS.pro.monthlyFileLimit} files/mo`, "1 member"]}
            icon={Zap}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
            loading={loading === "pro"}
            onUpgrade={() => startCheckout("pro")}
          />
          <PlanCard
            name="Family"
            price="$19/mo"
            features={[
              `${PLANS.family.monthlyFileLimit} files/mo`,
              `${PLANS.family.maxHouseholdMembers} members`,
            ]}
            icon={Users}
            iconColor="text-violet-600"
            iconBg="bg-violet-50"
            loading={loading === "family"}
            onUpgrade={() => startCheckout("family")}
          />
        </div>
      )}

      {tier === "pro" && (
        <div className="rounded-xl border border-slate-100 p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-violet-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">Family</p>
              <p className="text-xs text-slate-400 mb-2">$19/mo</p>
              <ul className="space-y-1 mb-3">
                {[
                  `${PLANS.family.monthlyFileLimit} files/mo`,
                  `${PLANS.family.maxHouseholdMembers} members`,
                ].map((f) => (
                  <li key={f} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => changePlan("family")}
                disabled={loading === "family"}
                className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-800 disabled:opacity-50 transition-colors"
              >
                <ArrowUpCircle className="w-3.5 h-3.5" />
                {loading === "family" ? "Upgrading…" : "Upgrade to Family"}
              </button>
            </div>
          </div>
        </div>
      )}

      {tier === "family" && (
        <div className="rounded-xl border border-slate-100 p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">Pro</p>
              <p className="text-xs text-slate-400 mb-2">$9/mo</p>
              <ul className="space-y-1 mb-3">
                {[`${PLANS.pro.monthlyFileLimit} files/mo`, "1 member"].map((f) => (
                  <li key={f} className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Check className="w-3 h-3 text-slate-300 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => changePlan("pro")}
                disabled={loading === "pro"}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 disabled:opacity-50 transition-colors"
              >
                <ArrowDownCircle className="w-3.5 h-3.5" />
                {loading === "pro" ? "Downgrading…" : "Downgrade to Pro"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PlanCard({
  name,
  price,
  features,
  icon: Icon,
  iconColor,
  iconBg,
  loading,
  onUpgrade,
}: {
  name: string
  price: string
  features: string[]
  icon: React.ElementType
  iconColor: string
  iconBg: string
  loading: boolean
  onUpgrade: () => void
}) {
  return (
    <div className="rounded-xl border border-slate-100 p-4">
      <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center mb-3`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <p className="text-sm font-semibold text-slate-900">{name}</p>
      <p className="text-xs text-slate-400 mb-3">{price}</p>
      <ul className="space-y-1 mb-4">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
            <Check className="w-3 h-3 text-emerald-500 shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <button
        onClick={onUpgrade}
        disabled={loading}
        className="w-full bg-slate-900 text-white text-xs font-semibold py-2 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
      >
        {loading ? "Loading…" : `Upgrade to ${name}`}
      </button>
    </div>
  )
}
