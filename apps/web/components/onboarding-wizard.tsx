"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Wallet,
  UploadCloud,
  Sparkles,
  LayoutDashboard,
  Users,
  ArrowRight,
  ArrowLeft,
  FileText,
  Image,
  Tag,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  Loader2,
} from "lucide-react"

// ── Step visuals ───────────────────────────────────────────────────────────────

function WelcomeVisual() {
  return (
    <div className="flex gap-3 justify-center">
      {[
        { label: "Money Out", value: "$1,842", color: "#ef4444" },
        { label: "Money In", value: "$3,200", color: "#10b981" },
        { label: "Net", value: "+$1,358", color: "#34d399" },
      ].map((c) => (
        <div
          key={c.label}
          className="rounded-xl px-4 py-3 text-center"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            minWidth: 88,
          }}
        >
          <div className="text-[10px] mb-1.5 font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>
            {c.label}
          </div>
          <div className="text-sm font-bold" style={{ color: c.color }}>
            {c.value}
          </div>
        </div>
      ))}
    </div>
  )
}

function UploadVisual() {
  return (
    <div className="flex gap-3 justify-center items-center">
      {[
        { ext: "CSV", Icon: FileText, color: "#10b981", bg: "rgba(16,185,129,0.12)" },
        { ext: "PDF", Icon: FileText, color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
        { ext: "IMG", Icon: Image, color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
      ].map(({ ext, Icon, color, bg }) => (
        <div
          key={ext}
          className="rounded-xl px-5 py-3.5 flex flex-col items-center gap-2"
          style={{ background: bg, border: `1px solid ${color}30` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
          <span className="text-[11px] font-semibold" style={{ color }}>
            {ext}
          </span>
        </div>
      ))}
    </div>
  )
}

function CategorizationVisual() {
  const rows = [
    { name: "Whole Foods", cat: "Food & Drink", color: "#10b981", amount: "-$67.40" },
    { name: "Uber", cat: "Transport", color: "#6366f1", amount: "-$14.20" },
    { name: "Netflix", cat: "Bills", color: "#f59e0b", amount: "-$15.99" },
  ]
  return (
    <div className="flex flex-col gap-2 w-full max-w-xs mx-auto">
      {rows.map((r) => (
        <div
          key={r.name}
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.color }} />
          <span className="flex-1 text-xs font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>
            {r.name}
          </span>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: `${r.color}20`, color: r.color }}
          >
            {r.cat}
          </span>
          <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.4)" }}>
            {r.amount}
          </span>
        </div>
      ))}
    </div>
  )
}

function DashboardVisual() {
  const bars = [42, 68, 55, 80, 63, 91]
  return (
    <div
      className="rounded-2xl p-4 w-full max-w-xs mx-auto"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="text-[10px] font-medium mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
        6-month spending trend
      </div>
      <div className="flex items-end gap-1.5 h-14">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, background: "linear-gradient(180deg, #10b981 0%, #059669 100%)", opacity: i === bars.length - 1 ? 1 : 0.5 }} />
        ))}
      </div>
      <div className="flex gap-3 mt-3">
        {[
          { label: "Top merchant", value: "Whole Foods" },
          { label: "Subscriptions", value: "4 detected" },
        ].map((s) => (
          <div key={s.label} className="flex-1">
            <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>{s.label}</div>
            <div className="text-[11px] font-semibold mt-0.5" style={{ color: "rgba(255,255,255,0.7)" }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FamilyVisual() {
  const members = [
    { initials: "You", color: "#10b981" },
    { initials: "JD", color: "#6366f1" },
    { initials: "SK", color: "#f59e0b" },
  ]
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex -space-x-3">
        {members.map((m, i) => (
          <div
            key={i}
            className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2"
            style={{ background: m.color, ringColor: "#060d1a", zIndex: members.length - i }}
          >
            {m.initials}
          </div>
        ))}
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-medium ring-2"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px dashed rgba(255,255,255,0.2)",
            color: "rgba(255,255,255,0.4)",
            zIndex: 0,
          }}
        >
          +3
        </div>
      </div>
      <div
        className="px-3 py-1.5 rounded-full text-[11px] font-medium flex items-center gap-1.5"
        style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399" }}
      >
        <Users className="w-3 h-3" />
        Up to 6 household members
      </div>
    </div>
  )
}

// ── Step definitions ───────────────────────────────────────────────────────────

const STEPS = [
  {
    Icon: Wallet,
    badge: "Welcome",
    title: "Meet Expensable",
    description:
      "Your AI-powered finance tracker. Import files, auto-categorize transactions, and understand your spending — all in one place.",
    Visual: WelcomeVisual,
  },
  {
    Icon: UploadCloud,
    badge: "Step 1",
    title: "Import Any File",
    description:
      "Drag and drop bank statements, CSV exports, PDF invoices, or receipt photos. AI extracts every transaction automatically — no manual entry.",
    Visual: UploadVisual,
  },
  {
    Icon: Sparkles,
    badge: "Step 2",
    title: "AI Does the Work",
    description:
      "Transactions are labelled instantly — Food, Transport, Bills, and more. Anything unusual gets flagged so you stay in control.",
    Visual: CategorizationVisual,
  },
  {
    Icon: LayoutDashboard,
    badge: "Step 3",
    title: "Powerful Dashboard",
    description:
      "See spending trends, money in vs. out, top merchants, and auto-detected subscriptions. Your complete financial picture at a glance.",
    Visual: DashboardVisual,
  },
  {
    Icon: Users,
    badge: "Step 4",
    title: "Bring Your Household",
    description:
      "Invite family members to track shared expenses together. Pro and Family plans support up to 6 members with a unified view.",
    Visual: FamilyVisual,
  },
]

// ── Wizard ─────────────────────────────────────────────────────────────────────

interface Props {
  firstName: string
}

export function OnboardingWizard({ firstName }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [completing, setCompleting] = useState(false)

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  async function handleComplete() {
    setCompleting(true)
    try {
      await fetch("/api/user/complete-onboarding", { method: "POST" })
    } catch {}
    router.push("/dashboard")
  }

  function handleNext() {
    if (isLast) {
      handleComplete()
    } else {
      setStep((s) => s + 1)
    }
  }

  const focusStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.88)",
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#060d1a" }}>

      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-[15%] left-[40%] w-[600px] h-[450px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(16,185,129,0.15) 0%, transparent 70%)", filter: "blur(70px)" }}
        />
        <div
          className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[300px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)", filter: "blur(80px)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.022]"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 50% 0%, transparent 45%, #060d1a 75%)" }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 pt-6 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", boxShadow: "0 0 18px rgba(16,185,129,0.35)" }}
          >
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-[15px] tracking-tight" style={{ color: "rgba(255,255,255,0.9)" }}>
            Expensable
          </span>
        </div>
        <button
          onClick={handleComplete}
          className="text-sm transition-colors"
          style={{ color: "rgba(255,255,255,0.3)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
        >
          Skip intro →
        </button>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[440px]">

          {/* Greeting (first step only) */}
          {step === 0 && (
            <div className="text-center mb-6">
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
                Hey <span style={{ color: "#34d399" }}>{firstName}</span>, welcome aboard 👋
              </p>
            </div>
          )}

          {/* Card */}
          <div
            className="rounded-2xl p-7"
            style={{
              background: "rgba(255,255,255,0.035)",
              border: "1px solid rgba(255,255,255,0.075)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              boxShadow: "0 30px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07)",
            }}
          >
            {/* Step badge */}
            <div className="flex items-center justify-between mb-5">
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-medium"
                style={{
                  background: "rgba(16,185,129,0.08)",
                  border: "1px solid rgba(16,185,129,0.18)",
                  color: "#34d399",
                  letterSpacing: "0.02em",
                }}
              >
                <current.Icon className="w-3 h-3" />
                {current.badge}
              </div>
              <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                {step + 1} / {STEPS.length}
              </div>
            </div>

            {/* Title */}
            <h2 className="text-[22px] font-bold leading-tight mb-3" style={{ color: "rgba(255,255,255,0.93)" }}>
              {current.title}
            </h2>

            {/* Description */}
            <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.45)" }}>
              {current.description}
            </p>

            {/* Visual */}
            <div
              className="rounded-xl p-5 mb-6 flex items-center justify-center min-h-[100px]"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <current.Visual />
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className="rounded-full transition-all duration-200"
                  style={{
                    width: i === step ? 20 : 6,
                    height: 6,
                    background: i === step
                      ? "linear-gradient(90deg, #10b981, #059669)"
                      : i < step
                      ? "rgba(16,185,129,0.4)"
                      : "rgba(255,255,255,0.12)",
                  }}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-3">
              {step > 0 && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-[10px] text-sm font-medium transition-all duration-150"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.5)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
              )}

              <button
                onClick={handleNext}
                disabled={completing}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl px-4 py-[10px] text-sm font-semibold transition-all duration-150 disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "white",
                  boxShadow: "0 4px 22px rgba(16,185,129,0.28)",
                }}
                onMouseEnter={(e) => {
                  if (!completing) e.currentTarget.style.boxShadow = "0 4px 32px rgba(16,185,129,0.45)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 22px rgba(16,185,129,0.28)"
                }}
              >
                {completing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isLast ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Get started
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
