import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { db } from "@expensable/db"

const SUPPORTED_CURRENCIES = ["USD","EUR","GBP","CHF","CAD","AUD","JPY","NOK","SEK","DKK","NZD","SGD","HKD"] as const

const schema = z.object({
  name: z.string().min(1).max(128),
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  currency: z.enum(SUPPORTED_CURRENCIES).default("USD"),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const { name, email, password, currency } = parsed.data

  let existing: unknown
  try {
    existing = await db.user.findUnique({ where: { email } })
  } catch {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }

  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  let user: { id: string; email: string | null }
  try {
    user = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        memberships: {
          create: {
            role: "owner",
            household: {
              create: {
                name: `${name}'s Household`,
                defaultCurrency: currency,
                billing: { create: { tier: "free" } },
              },
            },
          },
        },
      },
    })
  } catch {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 })
}
