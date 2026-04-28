import { getNextRequestI18n } from "@payloadcms/next/utilities"
import { getClientConfig } from "@payloadcms/ui/utilities/getClientConfig"
import { createUnauthenticatedClientConfig } from "payload"
import { importMap } from "./[[...segments]]/importMap"
import config from "@payload-config"
import React from "react"
import { PayloadConfigProvider } from "./PayloadConfigProvider"

type Args = {
  children: React.ReactNode
}

export default async function Layout({ children }: Args) {
  const resolvedConfig = await config
  const i18n = await getNextRequestI18n({ config: resolvedConfig })
  const clientConfig = getClientConfig({ config: resolvedConfig, i18n, importMap, user: null })
  return (
    <PayloadConfigProvider config={clientConfig}>
      {children}
    </PayloadConfigProvider>
  )
}
