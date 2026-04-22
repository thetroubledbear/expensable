import { getCookieHeader, ingestSetCookie } from "./cookies"

export const BASE_URL = "https://expensable-web.vercel.app"

async function request(path: string, options: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }
  const cookie = getCookieHeader()
  if (cookie) headers["Cookie"] = cookie

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  ingestSetCookie(res.headers.get("set-cookie"))
  return res
}

export async function apiGet<T = unknown>(path: string): Promise<T> {
  const res = await request(path)
  return res.json() as Promise<T>
}

export async function apiPost<T = unknown>(path: string, body: unknown): Promise<T> {
  const res = await request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return res.json() as Promise<T>
}

export async function apiDelete<T = unknown>(path: string, body?: unknown): Promise<T> {
  const res = await request(path, {
    method: "DELETE",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json() as Promise<T>
}

export async function getCsrfToken(): Promise<string> {
  const res = await request("/api/auth/csrf")
  ingestSetCookie(res.headers.get("set-cookie"))
  const data = await res.json() as { csrfToken: string }
  return data.csrfToken
}

export async function authSignIn(email: string, password: string): Promise<boolean> {
  const csrfToken = await getCsrfToken()
  const res = await request("/api/auth/callback/credentials?json=true", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ csrfToken, email, password }).toString(),
  })
  ingestSetCookie(res.headers.get("set-cookie"))
  if (!res.ok) return false
  try {
    const data = await res.json() as { url?: string; error?: string }
    return !data.error
  } catch {
    return res.ok
  }
}

export async function authGetSession(): Promise<{ user?: { id: string; name?: string | null; email?: string | null } } | null> {
  try {
    const res = await request("/api/auth/session")
    if (!res.ok) return null
    const data = await res.json() as { user?: { id: string; name?: string | null; email?: string | null } }
    return data.user ? data : null
  } catch {
    return null
  }
}

export async function apiDeleteById(path: string): Promise<void> {
  await request(path, { method: "DELETE" })
}

export async function apiPatch<T = unknown>(path: string, body: unknown): Promise<T> {
  const res = await request(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return res.json() as Promise<T>
}

export async function apiUploadFile(formData: FormData): Promise<{ id?: string; status?: string; error?: string }> {
  const cookie = getCookieHeader()
  const headers: Record<string, string> = {}
  if (cookie) headers["Cookie"] = cookie

  const res = await fetch(`${BASE_URL}/api/files`, {
    method: "POST",
    headers,
    body: formData,
  })
  ingestSetCookie(res.headers.get("set-cookie"))
  const data = await res.json().catch(() => ({})) as { id?: string; status?: string; error?: string }
  if (!res.ok) return { error: data.error ?? `Upload failed (${res.status})` }
  return data
}
