'use server'
import { handleServerFunctions } from "@payloadcms/next/layouts"
import type { ServerFunctionClient } from "payload"
import config from "@payload-config"
import { importMap } from "./[[...segments]]/importMap"

export const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({ ...args, config, importMap })
}
