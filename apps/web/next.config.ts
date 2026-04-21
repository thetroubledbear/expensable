import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@expensable/types", "@expensable/utils", "@expensable/db", "@expensable/api-client"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
}

export default nextConfig
