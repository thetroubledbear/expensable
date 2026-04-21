import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "**": ["../../packages/db/generated/client/*.node"],
  },
  transpilePackages: ["@expensable/types", "@expensable/utils", "@expensable/db", "@expensable/api-client"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google avatars
    ],
  },
}

export default nextConfig
