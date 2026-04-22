import { NextRequest, NextResponse } from "next/server"
import { db } from "@expensable/db"
import { encode } from "@auth/core/jwt"

interface GoogleTokenInfo {
  sub: string
  email: string
  name?: string
  picture?: string
  aud: string
  exp: string
  email_verified?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { idToken?: string }
    const { idToken } = body

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 })
    }

    const tokenInfoRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    )
    if (!tokenInfoRes.ok) {
      return NextResponse.json({ error: "Invalid Google token" }, { status: 401 })
    }

    const tokenInfo = await tokenInfoRes.json() as GoogleTokenInfo

    const expectedClientId = process.env.GOOGLE_CLIENT_ID
    if (!expectedClientId || tokenInfo.aud !== expectedClientId) {
      return NextResponse.json({ error: "Token audience mismatch" }, { status: 401 })
    }

    if (!tokenInfo.email) {
      return NextResponse.json({ error: "Google token missing email" }, { status: 400 })
    }

    let user = await db.user.findUnique({ where: { email: tokenInfo.email } })

    if (!user) {
      user = await db.user.create({
        data: {
          email: tokenInfo.email,
          name: tokenInfo.name ?? tokenInfo.email.split("@")[0],
          image: tokenInfo.picture ?? null,
          emailVerified: new Date(),
        },
      })

      await db.account.create({
        data: {
          userId: user.id,
          type: "oauth",
          provider: "google",
          providerAccountId: tokenInfo.sub,
          id_token: idToken,
        },
      }).catch(() => null)

      await db.household.create({
        data: {
          name: `${user.name ?? user.email}'s Household`,
          billing: { create: { tier: "free" } },
          members: { create: { userId: user.id, role: "owner" } },
        },
      })
    } else if (tokenInfo.picture && user.image !== tokenInfo.picture) {
      await db.user.update({ where: { id: user.id }, data: { image: tokenInfo.picture } })
    }

    const secret = process.env.NEXTAUTH_SECRET!
    const maxAge = 30 * 24 * 60 * 60
    const isProduction = process.env.NODE_ENV === "production"
    const cookieName = isProduction
      ? "__Secure-authjs.session-token"
      : "authjs.session-token"

    const jwt = await encode({
      token: {
        sub: user.id,
        id: user.id,
        name: user.name ?? null,
        email: user.email ?? null,
        picture: user.image ?? null,
      },
      secret,
      maxAge,
      salt: cookieName,
    })

    const expires = new Date(Date.now() + maxAge * 1000)
    const cookieParts = [
      `${cookieName}=${jwt}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      `Expires=${expires.toUTCString()}`,
    ]
    if (isProduction) cookieParts.push("Secure")

    const response = NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name },
    })
    response.headers.set("Set-Cookie", cookieParts.join("; "))

    return response
  } catch (err) {
    console.error("[mobile/google]", err)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
