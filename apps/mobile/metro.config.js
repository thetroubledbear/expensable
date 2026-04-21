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

// Force React and React Native to resolve to a single copy (monorepo root).
// Without this, files inside apps/mobile/node_modules/ (e.g. expo-router)
// resolve react from apps/mobile/node_modules/react — a different instance
// from the renderer — causing "Invalid hook call" crashes.
const DEDUPLICATE = [
  "react",
  "react-dom",
  "react-native",
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
]

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (DEDUPLICATE.includes(moduleName)) {
    return {
      filePath: require.resolve(moduleName, { paths: [monorepoRoot] }),
      type: "sourceFile",
    }
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
