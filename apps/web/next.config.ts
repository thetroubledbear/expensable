import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@expensable/types", "@expensable/utils", "@expensable/db", "@expensable/api-client", "@expensable/ui"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
    ],
  },
}

export default nextConfig
