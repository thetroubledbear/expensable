"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Loader2, ArrowRight } from "lucide-react"
import { LogoMark } from "@/components/logo"

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

    await signIn("credentials", { email, password, callbackUrl: "/onboarding" })
    router.push("/onboarding")
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.border = "1px solid rgba(16,185,129,0.5)"
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(16,185,129,0.08)"
  }
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)"
    e.currentTarget.style.boxShadow = "none"
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#060d1a" }}>

      {/* ── Background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-[15%] left-[40%] w-[600px] h-[450px] rounded-full"
          style={{
            background: "radial-gradient(ellipse, rgba(16,185,129,0.15) 0%, transparent 70%)",
            filter: "blur(70px)",
          }}
        />
        <div
          className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[300px] rounded-full"
          style={{
            background: "radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.022]"
          style={{
            backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 50% 0%, transparent 45%, #060d1a 75%)" }}
        />
      </div>

      {/* ── Header ── */}
      <header className="relative z-10 px-6 pt-6 pb-0 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <LogoMark className="w-8 h-8 rounded-lg shrink-0" />
          <span className="font-semibold text-[15px] tracking-tight" style={{ color: "rgba(255,255,255,0.9)" }}>
            Expensable
          </span>
        </div>
        <a href="/login" className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
          Have an account?{" "}
          <span className="font-medium" style={{ color: "#34d399" }}>Sign in →</span>
        </a>
      </header>

      {/* ── Main ── */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[390px]">

          {/* Badge + heading */}
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-medium mb-4"
              style={{
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.18)",
                color: "#34d399",
                letterSpacing: "0.02em",
              }}
            >
              Free to start — no card needed
            </div>
            <h1
              className="text-[26px] font-bold leading-tight mb-2"
              style={{ color: "rgba(255,255,255,0.93)" }}
            >
              Create your account
            </h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
              Your AI finance assistant awaits
            </p>
          </div>

          {/* Glass card */}
          <div
            className="rounded-2xl p-6"
            style={{
              background: "rgba(255,255,255,0.035)",
              border: "1px solid rgba(255,255,255,0.075)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              boxShadow: "0 30px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07)",
            }}
          >
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Text inputs */}
              {[
                { name: "name",     type: "text",     placeholder: "Your name",         label: "Full name"      },
                { name: "email",    type: "email",    placeholder: "you@example.com",   label: "Email address"  },
                { name: "password", type: "password", placeholder: "Min 8 characters",  label: "Password", minLength: 8 },
              ].map((f) => (
                <div key={f.name}>
                  <label
                    className="block text-[11px] font-medium mb-1.5"
                    style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "0.02em" }}
                  >
                    {f.label}
                  </label>
                  <input
                    name={f.name}
                    type={f.type}
                    required
                    placeholder={f.placeholder}
                    minLength={f.minLength}
                    className="w-full rounded-xl px-3.5 py-[10px] text-sm outline-none transition-all duration-150"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.88)",
                    }}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>
              ))}

              {/* Currency */}
              <div>
                <label
                  className="block text-[11px] font-medium mb-1.5"
                  style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "0.02em" }}
                >
                  Default currency
                </label>
                <select
                  name="currency"
                  defaultValue="USD"
                  className="w-full rounded-xl px-3.5 py-[10px] text-sm outline-none transition-all duration-150 appearance-none"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.88)",
                  }}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code} style={{ background: "#0d1829", color: "#e2e8f0" }}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div
                  className="rounded-xl px-3.5 py-2.5 text-[13px]"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    color: "#fca5a5",
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl px-4 py-[10px] text-sm font-semibold transition-all duration-150 disabled:opacity-40 mt-1"
                style={{
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "white",
                  boxShadow: "0 4px 22px rgba(16,185,129,0.28)",
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.boxShadow = "0 4px 32px rgba(16,185,129,0.45)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 22px rgba(16,185,129,0.28)"
                }}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>Create account <ArrowRight className="w-3.5 h-3.5" /></>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-xs mt-5" style={{ color: "rgba(255,255,255,0.18)" }}>
            Already have an account?{" "}
            <a
              href="/login"
              className="transition-colors"
              style={{ color: "rgba(52,211,153,0.7)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#34d399")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(52,211,153,0.7)")}
            >
              Sign in
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
