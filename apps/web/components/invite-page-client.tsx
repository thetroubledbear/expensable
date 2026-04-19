"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession, signIn } from "next-auth/react"
import { Wallet, Loader2, Users } from "lucide-react"

interface Props {
  token: string
  householdName: string
  expiresAt: string
}

export function InvitePageClient({ token, householdName, expiresAt }: Props) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [view, setView] = useState<"main" | "register" | "login">("main")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const expires = new Date(expiresAt).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  async function accept() {
    setLoading(true)
    setError("")
    const res = await fetch(`/api/invite/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "accept" }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? "Failed to accept invite")
      setLoading(false)
      return
    }
    router.push("/dashboard")
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const name = form.get("name") as string
    const email = form.get("email") as string
    const password = form.get("password") as string

    const res = await fetch(`/api/invite/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "register", name, email, password }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? "Registration failed")
      setLoading(false)
      return
    }
    await signIn("credentials", { email, password, callbackUrl: "/dashboard" })
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const email = form.get("email") as string
    const password = form.get("password") as string
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })
    if (result?.error) {
      setError("Invalid email or password")
      setLoading(false)
      return
    }
    // Now accept
    const res = await fetch(`/api/invite/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "accept" }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? "Failed to accept invite")
      setLoading(false)
      return
    }
    router.push("/dashboard")
  }

  const inputCls =
    "w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
  const btnCls =
    "w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="text-slate-900 font-bold text-xl tracking-tight">Expensable</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          {/* Invite header — always visible */}
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400">You&apos;re invited to join</p>
              <p className="font-semibold text-slate-900">{householdName}</p>
              <p className="text-xs text-slate-400">Expires {expires}</p>
            </div>
          </div>

          {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

          {status === "loading" && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          )}

          {status === "authenticated" && view === "main" && (
            <div>
              <p className="text-sm text-slate-600 mb-4">
                Signed in as <span className="font-medium">{session.user?.email}</span>
              </p>
              <button onClick={accept} disabled={loading} className={btnCls}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Accept invite"}
              </button>
            </div>
          )}

          {status === "unauthenticated" && view === "main" && (
            <div className="space-y-3">
              <button onClick={() => setView("register")} className={btnCls}>
                Create account &amp; join
              </button>
              <button
                onClick={() => setView("login")}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Sign in &amp; join
              </button>
            </div>
          )}

          {view === "register" && (
            <form onSubmit={handleRegister} className="space-y-3">
              <p className="text-sm font-medium text-slate-700 mb-1">Create your account</p>
              <input name="name" type="text" required placeholder="Your name" className={inputCls} />
              <input name="email" type="email" required placeholder="Email" className={inputCls} />
              <input
                name="password"
                type="password"
                required
                minLength={8}
                placeholder="Password (min 8 characters)"
                className={inputCls}
              />
              <button type="submit" disabled={loading} className={btnCls}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create account & join"}
              </button>
              <button
                type="button"
                onClick={() => { setView("main"); setError("") }}
                className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Back
              </button>
            </form>
          )}

          {view === "login" && (
            <form onSubmit={handleLogin} className="space-y-3">
              <p className="text-sm font-medium text-slate-700 mb-1">Sign in</p>
              <input name="email" type="email" required placeholder="Email" className={inputCls} />
              <input
                name="password"
                type="password"
                required
                placeholder="Password"
                className={inputCls}
              />
              <button type="submit" disabled={loading} className={btnCls}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign in & join"}
              </button>
              <button
                type="button"
                onClick={() => { setView("main"); setError("") }}
                className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Back
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
