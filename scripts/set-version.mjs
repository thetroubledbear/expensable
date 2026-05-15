import { readFileSync, writeFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const root = dirname(fileURLToPath(import.meta.url)) + "/.."
const { version } = JSON.parse(readFileSync(resolve(root, "version.json"), "utf8"))

function updateJson(rel, updater) {
  const path = resolve(root, rel)
  const obj = JSON.parse(readFileSync(path, "utf8"))
  updater(obj)
  writeFileSync(path, JSON.stringify(obj, null, 2) + "\n")
  console.log(`updated ${rel}`)
}

updateJson("package.json",                 (o) => { o.version = version })
updateJson("apps/web/package.json",        (o) => { o.version = version })
updateJson("apps/mobile/package.json",     (o) => { o.version = version })
updateJson("apps/mobile/app.json",         (o) => {
  o.expo.version = version
  o.expo.runtimeVersion = version
})

console.log(`\nAll files set to v${version}`)
