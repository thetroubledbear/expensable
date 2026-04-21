const path = require("path")

// babel-preset-expo is hoisted to monorepo root node_modules, but expo-router
// stays in apps/mobile/node_modules. When babel-preset-expo runs from root,
// require.resolve('expo-router') fails → expoRouterBabelPlugin silently skipped
// → process.env.EXPO_ROUTER_APP_ROOT never inlined → Metro require.context error.
// Fix: load the plugin via an absolute path so it resolves expo-router from HERE.
const presetExpoRoot = path.resolve(__dirname, "../../node_modules/babel-preset-expo")
const { expoRouterBabelPlugin } = require(
  path.join(presetExpoRoot, "build/expo-router-plugin")
)

module.exports = function (api) {
  api.cache(true)
  return {
    presets: ["babel-preset-expo"],
    plugins: [expoRouterBabelPlugin],
  }
}
