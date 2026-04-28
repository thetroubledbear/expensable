import { RootLayout } from "@payloadcms/next/layouts"
import { importMap } from "./[[...segments]]/importMap"
import { serverFunction } from "./serverFunction"
import config from "@payload-config"
import React from "react"
import "@payloadcms/next/css"

type Args = {
  children: React.ReactNode
}

export default async function Layout({ children }: Args) {
  return RootLayout({ config, importMap, children, serverFunction })
}
