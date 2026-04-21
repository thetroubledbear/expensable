import { PrismaClient } from "../generated/client"

// Prisma's Quaint engine does not support channel_binding — strip it.
function dbUrl() {
  const raw = process.env.DATABASE_URL ?? ""
  try {
    const u = new URL(raw)
    u.searchParams.delete("channel_binding")
    return u.toString()
  } catch {
    return raw
  }
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({ datasourceUrl: dbUrl() })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db

export * from "../generated/client"
