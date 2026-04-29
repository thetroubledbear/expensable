import { auth } from "@/lib/auth/config"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_EXACT = ["/"]
const PUBLIC_PREFIXES = ["/login", "/register", "/api/auth", "/invite", "/api/invite", "/expcms", "/cms-api", "/blog", "/api/notices", "/p/"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic =
    PUBLIC_EXACT.includes(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))

  if (isPublic) return NextResponse.next()

  const session = await auth()
  if (!session) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
}
