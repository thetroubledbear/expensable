export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { getPayload } = await import("payload")
      const { default: config } = await import("@payload-config")
      const payload = await getPayload({ config })
      // tablesFilter in payload.config.ts restricts drizzle to Payload-owned
      // tables only, so pushDevSchema never prompts about Prisma table renames.
      const { pushDevSchema } = await import("@payloadcms/drizzle")
      await pushDevSchema(payload.db as any)
    } catch (err) {
      console.error("[Payload] schema init error:", err)
    }
  }
}
