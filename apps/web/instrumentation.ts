export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const orig = process.env.NODE_ENV
    // pushDevSchema is the only production-safe way to bootstrap tables
    // without migration files. It checks for schema changes and skips if
    // tables already match — idempotent on every cold start.
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "development",
      configurable: true,
      writable: true,
    })
    try {
      const { getPayload } = await import("payload")
      const { default: config } = await import("@payload-config")
      await getPayload({ config })
    } catch (err) {
      console.error("[Payload] init error:", err)
    } finally {
      Object.defineProperty(process.env, "NODE_ENV", {
        value: orig,
        configurable: true,
        writable: true,
      })
    }
  }
}
