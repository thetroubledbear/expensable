"use client"

import { useState, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { Wallet, Loader2, ArrowRight } from "lucide-react"

function LoginForm() {
  const params = useSearchParams()
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard"
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const result = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      callbackUrl,
      redirect: false,
    })
    if (result?.error) {
      setError("Invalid email or password")
      setLoading(false)
    } else {
      window.location.href = callbackUrl
    }
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.border = "1px solid rgba(16,185,129,0.5)"
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(16,185,129,0.08)"
  }
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)"
    e.currentTarget.style.boxShadow = "none"
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#060d1a" }}>

      {/* ── Background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full"
          style={{
            background: "radial-gradient(ellipse, rgba(16,185,129,0.18) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-[450px] h-[350px] rounded-full"
          style={{
            background: "radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 70%)",
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
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              boxShadow: "0 0 18px rgba(16,185,129,0.35)",
            }}
          >
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-[15px] tracking-tight" style={{ color: "rgba(255,255,255,0.9)" }}>
            Expensable
          </span>
        </div>
        <a href="/register" className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
          No account?{" "}
          <span className="font-medium" style={{ color: "#34d399" }}>
            Create one →
          </span>
        </a>
      </header>

      {/* ── Main ── */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
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
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#34d399", boxShadow: "0 0 6px #34d399" }}
              />
              Secure sign-in
            </div>
            <h1
              className="text-[26px] font-bold leading-tight mb-2"
              style={{ color: "rgba(255,255,255,0.93)" }}
            >
              Welcome back
            </h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
              Sign in to your Expensable account
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
            {/* Google */}
            <button
              onClick={() => signIn("google", { callbackUrl })}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl px-4 py-[10px] text-sm font-medium transition-all duration-150"
              style={{
                background: "rgba(255,255,255,0.96)",
                color: "#1e293b",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,1)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.96)")}
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="relative my-5 flex items-center">
              <div className="flex-1" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }} />
              <span
                className="mx-3 text-[11px]"
                style={{ color: "rgba(255,255,255,0.22)" }}
              >
                or email
              </span>
              <div className="flex-1" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }} />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {[
                { name: "email", type: "email", placeholder: "you@example.com", label: "Email" },
                { name: "password", type: "password", placeholder: "••••••••", label: "Password" },
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
                  <>Sign in <ArrowRight className="w-3.5 h-3.5" /></>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-xs mt-5" style={{ color: "rgba(255,255,255,0.18)" }}>
            No account?{" "}
            <a href="/register" className="transition-colors" style={{ color: "rgba(52,211,153,0.7)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#34d399")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(52,211,153,0.7)")}
            >
              Sign up free
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
