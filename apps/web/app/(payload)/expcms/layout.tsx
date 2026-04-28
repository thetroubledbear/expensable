import { RootLayout } from "@payloadcms/next/layouts"
import { handleServerFunctions } from "@payloadcms/next/layouts"
import { importMap } from "./[[...segments]]/importMap"
import config from "@payload-config"
import React from "react"

type Args = {
  children: React.ReactNode
}

export default async function Layout({ children }: Args) {
  const serverFunction = handleServerFunctions
  return RootLayout({ config, importMap, children, serverFunction })
}
