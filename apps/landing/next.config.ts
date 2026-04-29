import type { NextConfig } from "next"
import { withPayload } from "@payloadcms/next/withPayload"

const nextConfig: NextConfig = {
  transpilePackages: ["@expensable/types", "@expensable/ui"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
    ],
  },
}

export default withPayload(nextConfig)
