import { NotFoundPage } from "@payloadcms/next/views"
import { importMap } from "./importMap"
import config from "@payload-config"
import React from "react"

export default function NotFound() {
  return NotFoundPage({
    config,
    importMap,
    params: Promise.resolve({ segments: [] }),
    searchParams: Promise.resolve({}),
  })
}
