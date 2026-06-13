import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const packagePath = join(root, "package.json")
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"))

const [major, minor, patch] = packageJson.version.split(".").map(Number)
packageJson.version = `${major}.${minor}.${patch + 1}`

writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`)
console.log(`Version bumped to ${packageJson.version}`)
