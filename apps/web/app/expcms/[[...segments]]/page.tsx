import { RootPage, generatePageMetadata } from "@payloadcms/next/views"
import { importMap } from "./importMap"
import config from "@payload-config"
import React from "react"

type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] }>
}

export const generateMetadata = ({ params, searchParams }: Args) =>
  generatePageMetadata({ config, params, searchParams })

export default function Page({ params, searchParams }: Args) {
  return RootPage({ config, params, searchParams, importMap })
}
