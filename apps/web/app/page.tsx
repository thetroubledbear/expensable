import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import Link from "next/link"
import {
  Wallet, BrainCircuit, Users, FolderOpen, BarChart3,
  ArrowRight, CheckCircle2, Upload, Sparkles, TrendingDown,
} from "lucide-react"

export default async function Home() {
  const session = await getSession()
  if (session) redirect("/dashboard")

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <CtaSection />
      <Footer />
    </div>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <span className="text-slate-900 font-semibold text-[15px] tracking-tight">Expensable</span>
        </div>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="px-3 sm:px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
          >
            Get started
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </nav>
      </div>
    </header>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="pt-28 sm:pt-32 pb-12 sm:pb-16 px-4 sm:px-6 bg-gradient-to-b from-slate-50 via-white to-white">
      <div className="max-w-6xl mx-auto">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold">
            <Sparkles className="w-3 h-3" />
            AI-Powered Expense Tracking
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-center text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-[1.1] max-w-3xl mx-auto">
          Stop guessing where your{" "}
          <span className="text-emerald-600">money goes</span>
        </h1>
        <p className="text-center text-base sm:text-lg text-slate-500 mt-6 max-w-2xl mx-auto leading-relaxed">
          Upload bank statements, receipts, and CSV exports. Our AI extracts every transaction automatically — no manual entry, no spreadsheets.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
          >
            Start for free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
          >
            Sign in
          </Link>
        </div>

        {/* Trust line */}
        <p className="text-center text-xs text-slate-400 mt-4">
          Free plan available · No credit card required
        </p>

        {/* Dashboard mockup — hidden on small phones */}
        <div className="hidden sm:block">
          <DashboardMockup />
        </div>
      </div>
    </section>
  )
}

function DashboardMockup() {
  return (
    <div className="relative mt-16 max-w-5xl mx-auto">
      {/* Glow */}
      <div className="absolute -inset-4 bg-gradient-to-r from-emerald-400/20 via-sky-400/10 to-violet-400/20 blur-3xl rounded-3xl pointer-events-none" />

      <div className="relative rounded-2xl border border-slate-200/80 shadow-2xl overflow-hidden bg-white">
        {/* Fake browser chrome */}
        <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-50 border-b border-slate-100">
          <div className="w-3 h-3 rounded-full bg-red-300" />
          <div className="w-3 h-3 rounded-full bg-amber-300" />
          <div className="w-3 h-3 rounded-full bg-emerald-300" />
          <div className="flex-1 mx-3 h-6 rounded-md bg-slate-100 flex items-center px-3">
            <span className="text-[10px] text-slate-400">app.expensable.io/dashboard</span>
          </div>
        </div>

        {/* App shell */}
        <div className="flex" style={{ minHeight: 340 }}>
          {/* Sidebar */}
          <div className="w-44 bg-slate-950 shrink-0 p-3 flex flex-col gap-0.5">
            <div className="flex items-center gap-2 px-2 py-2 mb-3">
              <div className="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center">
                <Wallet className="w-3 h-3 text-white" />
              </div>
              <span className="text-white text-xs font-semibold">Expensable</span>
            </div>
            {["Dashboard", "Upload", "Files", "Transactions", "Subscriptions", "Settings"].map((item, i) => (
              <div
                key={item}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium ${
                  i === 0
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-slate-500"
                }`}
              >
                {item}
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 bg-slate-50 p-5 overflow-hidden">
            <p className="text-sm font-semibold text-slate-700 mb-4">Good morning, Alex · April overview</p>

            {/* KPI cards */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: "Money out", value: "$3,240", color: "text-red-600", bg: "bg-red-50" },
                { label: "Money in", value: "$5,800", color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Net", value: "+$2,560", color: "text-emerald-700", bg: "bg-emerald-50" },
                { label: "Savings rate", value: "44%", color: "text-emerald-600", bg: "bg-emerald-50" },
              ].map((card) => (
                <div key={card.label} className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
                  <div className={`w-6 h-6 rounded-lg ${card.bg} flex items-center justify-center mb-2`}>
                    <div className="w-2 h-2 rounded-full bg-current opacity-60" />
                  </div>
                  <p className={`text-sm font-bold tabular-nums ${card.color}`}>{card.value}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{card.label}</p>
                </div>
              ))}
            </div>

            {/* Chart + list row */}
            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-3 bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
                <p className="text-[10px] font-semibold text-slate-500 mb-3">6-Month Trend</p>
                <div className="flex items-end gap-2 h-16">
                  {[40, 65, 45, 80, 55, 90].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col gap-1 items-center">
                      <div className="w-full rounded-t-sm bg-red-100" style={{ height: h * 0.6 }} />
                      <div className="w-full rounded-t-sm bg-emerald-100" style={{ height: h * 0.4 }} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-span-2 bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
                <p className="text-[10px] font-semibold text-slate-500 mb-2">Recent</p>
                {[
                  { name: "Netflix", amt: "-$15.99" },
                  { name: "Whole Foods", amt: "-$84.20" },
                  { name: "Salary", amt: "+$4,200" },
                ].map((tx) => (
                  <div key={tx.name} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                    <span className="text-[10px] text-slate-600">{tx.name}</span>
                    <span className={`text-[10px] font-semibold tabular-nums ${tx.amt.startsWith("+") ? "text-emerald-600" : "text-slate-700"}`}>
                      {tx.amt}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: BrainCircuit,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
    title: "AI-Powered Parsing",
    desc: "Upload any file — PDFs, receipt photos, or CSV exports. Claude AI reads every transaction automatically, no templates or mapping needed.",
  },
  {
    icon: Users,
    iconBg: "bg-sky-50",
    iconColor: "text-sky-600",
    title: "Family Finances",
    desc: "Invite up to 6 household members on the Family plan. Everyone sees shared data. Only owners can delete — no accidental data loss.",
  },
  {
    icon: FolderOpen,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    title: "Files Vault",
    desc: "Every receipt and statement organized in a searchable gallery. Filter by type, preview PDFs and images inline, download anytime.",
  },
  {
    icon: BarChart3,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    title: "Smart Analytics",
    desc: "6-month spending trends, category breakdowns, subscription tracker, and savings rate — all on a customizable drag-and-drop dashboard.",
  },
]

function Features() {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
            Everything you need, nothing you don&apos;t
          </h2>
          <p className="text-slate-500 mt-3 max-w-xl mx-auto text-sm sm:text-base">
            Built for people who want real insight into their finances without the spreadsheet headache.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6 hover:shadow-md hover:border-slate-200 transition-all"
              >
                <div className={`w-10 h-10 rounded-xl ${f.iconBg} flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${f.iconColor}`} />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── How It Works ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    icon: Upload,
    iconBg: "bg-emerald-600",
    step: "01",
    title: "Upload your files",
    desc: "Drag and drop bank statements, receipts, or CSV exports. Supports PDF, JPEG, PNG, and CSV — up to 20 MB each.",
  },
  {
    icon: BrainCircuit,
    iconBg: "bg-violet-600",
    step: "02",
    title: "AI extracts transactions",
    desc: "Claude AI reads your files and extracts every transaction with date, amount, merchant, and category — automatically.",
  },
  {
    icon: TrendingDown,
    iconBg: "bg-sky-600",
    step: "03",
    title: "Get full visibility",
    desc: "Your dashboard fills with insights: spending trends, top merchants, subscription costs, savings rate, and more.",
  },
]

function HowItWorks() {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
            From upload to insight in seconds
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-8 sm:gap-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={s.step} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden sm:block absolute top-5 left-[calc(50%+2rem)] right-[-calc(50%-2rem)] h-px bg-slate-200" />
                )}
                <div className="flex flex-col items-center text-center">
                  <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center mb-4 relative z-10`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-bold text-slate-300 tracking-widest mb-2">{s.step}</span>
                  <h3 className="text-base font-semibold text-slate-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-xs">{s.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── CTA Section ──────────────────────────────────────────────────────────────

function CtaSection() {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-gradient-to-br from-emerald-50 to-slate-50 rounded-3xl border border-emerald-100 p-8 sm:p-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-3">
            Start tracking today
          </h2>
          <p className="text-slate-500 mb-8 text-sm sm:text-base">
            Free plan included. Upgrade to Pro or Family when you need more.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
            >
              Create free account
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
            >
              Already have an account
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-8">
            {["No credit card required", "Free plan forever", "Cancel anytime"].map((t) => (
              <div key={t} className="flex items-center gap-1.5 text-xs text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-slate-100 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-500 flex items-center justify-center">
            <Wallet className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-700">Expensable</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
            Sign in
          </Link>
          <Link href="/register" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
            Register
          </Link>
        </div>
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} Expensable</p>
      </div>
    </footer>
  )
}
