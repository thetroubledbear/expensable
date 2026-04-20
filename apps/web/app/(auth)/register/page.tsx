"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import {
  Wallet,
  Loader2,
  Upload,
  BarChart3,
  Bell,
  Repeat2,
} from "lucide-react"

const CURRENCIES = [
  { code: "USD", label: "USD — US Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "CHF", label: "CHF — Swiss Franc" },
  { code: "CAD", label: "CAD — Canadian Dollar" },
  { code: "AUD", label: "AUD — Australian Dollar" },
  { code: "JPY", label: "JPY — Japanese Yen" },
  { code: "NOK", label: "NOK — Norwegian Krone" },
  { code: "SEK", label: "SEK — Swedish Krona" },
  { code: "DKK", label: "DKK — Danish Krone" },
  { code: "NZD", label: "NZD — New Zealand Dollar" },
  { code: "SGD", label: "SGD — Singapore Dollar" },
  { code: "HKD", label: "HKD — Hong Kong Dollar" },
]

const STEPS = [
  { icon: Upload,   label: "Upload a bank statement or receipt" },
  { icon: BarChart3, label: "AI extracts and categorises every transaction" },
  { icon: Bell,     label: "Get alerts for subscriptions and anomalies" },
  { icon: Repeat2,  label: "Track month-over-month savings progress" },
]

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const name = form.get("name") as string
    const email = form.get("email") as string
    const password = form.get("password") as string
    const currency = form.get("currency") as string

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, currency }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? "Registration failed")
      setLoading(false)
      return
    }

    await signIn("credentials", { email, password, callbackUrl: "/dashboard" })
    router.push("/dashboard")
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/60 via-slate-950 to-slate-900" />
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-emerald-400/8 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative z-10 flex flex-col h-full px-12 py-12">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-auto">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">Expensable</span>
          </div>

          {/* Hero */}
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Take control of<br />
              <span className="text-emerald-400">every dollar.</span>
            </h2>
            <p className="text-slate-400 text-base leading-relaxed max-w-sm">
              Set up in minutes. Your AI finance assistant is ready when you are.
            </p>
          </div>

          {/* How it works */}
          <div className="mb-10">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-5">How it works</p>
            <div className="space-y-4">
              {STEPS.map(({ icon: Icon, label }, i) => (
                <div key={label} className="flex items-center gap-3.5">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/20 shrink-0">
                    <Icon className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-[10px] font-bold text-emerald-600/60 tabular-nums w-4 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="text-sm text-slate-300">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Decorative stat strip */}
          <div className="rounded-2xl bg-white/5 border border-white/8 backdrop-blur-sm p-4">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
              Example household
            </p>
            <div className="space-y-2">
              {[
                { label: "Subscriptions detected",  value: "14",    color: "text-violet-400" },
                { label: "Monthly savings rate",     value: "31%",   color: "text-emerald-400" },
                { label: "Transactions categorised", value: "1,203", color: "text-slate-200" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className={`text-sm font-bold tabular-nums ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Logo (mobile only) */}
          <div className="flex items-center justify-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-slate-900 font-bold text-xl tracking-tight">Expensable</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <h1 className="text-lg font-semibold text-slate-900 mb-1">Create account</h1>
            <p className="text-sm text-slate-500 mb-6">Free to start — no credit card needed</p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                name="name"
                type="text"
                required
                placeholder="Your name"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
              <input
                name="email"
                type="email"
                required
                placeholder="Email"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
              <input
                name="password"
                type="password"
                required
                minLength={8}
                placeholder="Password (min 8 characters)"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  Default currency
                </label>
                <select
                  name="currency"
                  defaultValue="USD"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition bg-white"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create account"}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-slate-400 mt-5">
            Already have an account?{" "}
            <a href="/login" className="text-emerald-600 hover:underline font-medium">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
