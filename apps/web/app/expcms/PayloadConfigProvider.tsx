'use client'
import { ConfigProvider } from "@payloadcms/ui"
import React from "react"

export function PayloadConfigProvider({
  config,
  children,
}: {
  config: Parameters<typeof ConfigProvider>[0]["config"]
  children: React.ReactNode
}) {
  return <ConfigProvider config={config}>{children}</ConfigProvider>
}
