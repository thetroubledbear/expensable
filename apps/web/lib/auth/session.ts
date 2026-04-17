import { auth } from "./config"
import { redirect } from "next/navigation"

export async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  return session
}

export async function getSession() {
  return auth()
}
