const { getDefaultConfig } = require("expo/metro-config")
const path = require("path")

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, "../..")

const config = getDefaultConfig(projectRoot)

// Watch the entire monorepo so Metro resolves hoisted packages
config.watchFolders = [monorepoRoot]

// Resolve modules from mobile app first, then monorepo root
config.resolver.nodeModulesDirs = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
]

// Force React to resolve to a single copy — the one in apps/mobile/node_modules
// (react@19.1.0), which matches react-native's bundled renderer version.
// Without this, files inside apps/mobile/node_modules/expo-router resolve
// react from their own nested copy, producing a second instance that breaks hooks.
// We must NOT use the monorepo root react@19.2.4 — that mismatches the renderer.
const DEDUPLICATE = [
  "react",
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
]

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (DEDUPLICATE.includes(moduleName)) {
    return {
      filePath: require.resolve(moduleName, { paths: [projectRoot] }),
      type: "sourceFile",
    }
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
