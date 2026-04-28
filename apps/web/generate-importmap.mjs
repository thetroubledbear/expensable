// ESM script to generate Payload import map, bypassing the CJS/TLA issue
// with tsx's synchronous require that fails on lexical packages with top-level await.
// Usage: node --import tsx/esm generate-importmap.mjs
// Use file:// path to bypass payload package.json exports restriction on internal paths
import { generateImportMap } from '../../node_modules/payload/dist/bin/generateImportMap/index.js'
import { loadEnv } from '../../node_modules/payload/dist/bin/loadEnv.js'

loadEnv()

// Dynamic import handles ESM TLA correctly (unlike CJS require)
const configModule = await import('./payload.config.ts')
const config = configModule.default ?? configModule

await generateImportMap(config)
console.log('Import map generated.')
