import React, { createContext, useContext, useEffect, useState } from "react"
import * as SecureStore from "expo-secure-store"
import * as WebBrowser from "expo-web-browser"
import * as Google from "expo-auth-session/providers/google"
import { makeRedirectUri } from "expo-auth-session"
import { authSignIn, authGetSession, BASE_URL } from "./api"
import { clearCookies, loadCookies, ingestSetCookie } from "./cookies"

// Register the web browser redirect handler
WebBrowser.maybeCompleteAuthSession()

// Web OAuth client ID from Google Cloud Console
// To enable Google Sign-In on Android, also register the redirect URI
// expensable://oauthredirect in your Google Cloud Console OAuth client
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? ""
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? ""

const CREDS_KEY = "saved_credentials"

interface User {
  id: string
  name?: string | null
  email?: string | null
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  register: (name: string, email: string, password: string) => Promise<string | null>
  promptGoogleSignIn: () => void
  googleLoading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [googleLoading, setGoogleLoading] = useState(false)

  const redirectUri = makeRedirectUri({ native: "expensable://oauthredirect" })

  const [, googleResponse, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
    redirectUri,
  })

  useEffect(() => {
    if (googleResponse?.type === "success") {
      const idToken = googleResponse.params.id_token ?? googleResponse.authentication?.idToken
      if (idToken) handleGoogleToken(idToken)
    } else if (googleResponse?.type === "error") {
      setGoogleLoading(false)
    }
  }, [googleResponse])

  useEffect(() => {
    init()
  }, [])

  async function init() {
    await loadCookies()
    const session = await authGetSession()
    if (session?.user) {
      setUser(session.user)
    } else {
      const raw = await SecureStore.getItemAsync(CREDS_KEY).catch(() => null)
      if (raw) {
        try {
          const { email, password } = JSON.parse(raw) as { email: string; password: string }
          const ok = await authSignIn(email, password)
          if (ok) {
            const s = await authGetSession()
            if (s?.user) setUser(s.user)
          }
        } catch {}
      }
    }
    setLoading(false)
  }

  async function handleGoogleToken(idToken: string) {
    setGoogleLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/api/auth/mobile/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      })
      const setCookie = res.headers.get("set-cookie")
      if (setCookie) ingestSetCookie(setCookie)
      const data = await res.json() as { ok?: boolean; user?: User; error?: string }
      if (data.ok && data.user) {
        setUser(data.user)
      }
    } catch {}
    finally {
      setGoogleLoading(false)
    }
  }

  function promptGoogleSignIn() {
    setGoogleLoading(true)
    promptAsync()
  }

  async function signIn(email: string, password: string): Promise<string | null> {
    const ok = await authSignIn(email, password)
    if (!ok) return "Invalid email or password"
    const session = await authGetSession()
    if (!session?.user) return "Session not established"
    setUser(session.user)
    await SecureStore.setItemAsync(CREDS_KEY, JSON.stringify({ email, password }))
    return null
  }

  async function signOut(): Promise<void> {
    clearCookies()
    await SecureStore.deleteItemAsync(CREDS_KEY).catch(() => {})
    setUser(null)
  }

  async function register(name: string, email: string, password: string): Promise<string | null> {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        return data.error ?? "Registration failed"
      }
      return signIn(email, password)
    } catch {
      return "Network error"
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, register, promptGoogleSignIn, googleLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
