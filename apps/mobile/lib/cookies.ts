import * as SecureStore from "expo-secure-store"

const STORE_KEY = "cookie_jar"
const jar = new Map<string, string>()

export async function loadCookies(): Promise<void> {
  try {
    const raw = await SecureStore.getItemAsync(STORE_KEY)
    if (raw) {
      const arr: [string, string][] = JSON.parse(raw)
      arr.forEach(([k, v]) => jar.set(k, v))
    }
  } catch {}
}

export function ingestSetCookie(header: string | null): void {
  if (!header) return
  // React Native may give multiple Set-Cookie joined by ", " — split carefully
  const entries = header.split(/,\s*(?=[^;]+=)/)
  for (const entry of entries) {
    const semiIdx = entry.indexOf(";")
    const kv = semiIdx >= 0 ? entry.slice(0, semiIdx) : entry
    const eqIdx = kv.indexOf("=")
    if (eqIdx <= 0) continue
    const name = kv.slice(0, eqIdx).trim()
    const value = kv.slice(eqIdx + 1).trim()
    jar.set(name, value)
  }
  persist()
}

export function getCookieHeader(): string {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ")
}

export function clearCookies(): void {
  jar.clear()
  SecureStore.deleteItemAsync(STORE_KEY).catch(() => {})
}

export function hasCookies(): boolean {
  return jar.size > 0
}

function persist(): void {
  SecureStore.setItemAsync(STORE_KEY, JSON.stringify([...jar.entries()])).catch(() => {})
}
