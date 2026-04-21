import path from "path"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Tell Next.js the monorepo root so it can trace files from packages/
  outputFileTracingRoot: path.join(__dirname, "../../"),
  outputFileTracingIncludes: {
    "**": ["packages/db/generated/client/*.node"],
  },
  transpilePackages: ["@expensable/types", "@expensable/utils", "@expensable/db", "@expensable/api-client"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
}

export default nextConfig
