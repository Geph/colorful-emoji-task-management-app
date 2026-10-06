import { readFileSync } from "node:fs"
import { createRequire } from "node:module"

const picker = readFileSync("components/enhanced-emoji-picker.tsx", "utf8")
const search = readFileSync("lib/emoji-search.ts", "utf8")
const generated = readFileSync("lib/unicode-emojis.ts", "utf8")

const catBlock = picker.match(/const CURATED_EMOJI_CATEGORIES[\s\S]*?^}/m)?.[0] ?? ""
const namesBlock = picker.match(/const EMOJI_NAMES[\s\S]*?^}/m)?.[0] ?? ""
const extBlock = search.match(/export const EMOJI_EXTENSIONS[\s\S]*$/m)?.[0] ?? ""

const literals = (block) => [...block.matchAll(/"([^"]+)"/g)].map((match) => match[1])
const keys = (block) => [...block.matchAll(/^\s*"([^"]+)":/gm)].map((match) => match[1])
const strip = (emoji) => emoji.replace(/\uFE0F/g, "")
const codePoints = (emoji) =>
  [...emoji].map((character) => character.codePointAt(0)?.toString(16)).join("-")

const categories = [...catBlock.matchAll(/^ {2}(\w+): \[([\s\S]*?)^ {2}\],/gm)]

// Curated categories spread in supplemental lists from EMOJI_EXTENSIONS, so include those too.
const curated = new Set([
  ...categories.flatMap(([, , body]) => literals(body)),
  ...literals(extBlock.match(/^ {2}people:\s*\[[\s\S]*?^ {2}\]/m)?.[0] ?? ""),
  ...literals(extBlock.match(/^ {2}travel:\s*\[[\s\S]*?^ {2}\]/m)?.[0] ?? ""),
])
const unicodeEntries = [...generated.matchAll(/^\s*\["([^"]+)", "([^"]+)"\],$/gm)].map(([, emoji, name]) => [emoji, name])
const browsable = new Set([...curated, ...unicodeEntries.map(([emoji]) => emoji)].map(strip))
const officiallyNamed = new Set(unicodeEntries.map(([emoji]) => strip(emoji)))
const curatedNamed = new Set(
  [...keys(namesBlock), ...keys(extBlock.match(/names:\s*\{[\s\S]*?\}\s*as Record/m)?.[0] ?? "")].map(strip),
)

const unnamed = [...curated].filter((emoji) => !curatedNamed.has(strip(emoji)) && !officiallyNamed.has(strip(emoji)))
const unreachable = [...curatedNamed].filter((emoji) => !browsable.has(emoji))

const duplicates = categories.flatMap(([, name, body]) => {
  const seen = new Set()
  return literals(body)
    .filter((emoji) => (seen.has(emoji) ? true : (seen.add(emoji), false)))
    .map((emoji) => `${name}: ${emoji}`)
})

// The generated file must match the dataset, so a stale or hand-edited copy can't drop emojis.
const require = createRequire(import.meta.url)
const maxVersion = Number.parseFloat(generated.match(/UNICODE_EMOJI_MAX_VERSION = "([\d.]+)"/)?.[1] ?? "0")
const dataset = JSON.parse(readFileSync(require.resolve("unicode-emoji-json/data-by-emoji.json"), "utf8"))
const missingFromUnicode = Object.entries(dataset)
  .filter(([, info]) => Number.parseFloat(info.emoji_version) <= maxVersion)
  .filter(([emoji]) => !browsable.has(strip(emoji)))

console.log(
  `${categories.length} curated categories, ${curated.size} curated emojis, ${browsable.size} browsable emojis in total`,
)

if (missingFromUnicode.length) {
  console.log(`\n${missingFromUnicode.length} Unicode emoji(s) missing from the picker (run scripts/generate-unicode-emojis.mjs):`)
  for (const [emoji, info] of missingFromUnicode) console.log(" ", JSON.stringify(emoji), codePoints(emoji), info.name)
}

if (unnamed.length) {
  console.log(`\n${unnamed.length} curated emoji(s) with no name at all (unsearchable):`)
  for (const emoji of unnamed) console.log(" ", JSON.stringify(emoji), codePoints(emoji))
}

if (unreachable.length) {
  console.log(`\n${unreachable.length} named emoji(s) missing from every tab (unreachable in the picker):`)
  for (const emoji of unreachable) console.log(" ", JSON.stringify(emoji), codePoints(emoji))
}

if (duplicates.length) {
  console.log(`\n${duplicates.length} emoji(s) listed twice within one curated category:`)
  for (const entry of duplicates) console.log(" ", entry)
}

if (missingFromUnicode.length || unnamed.length || unreachable.length || duplicates.length) {
  process.exitCode = 1
} else {
  console.log(`\nEvery Unicode emoji up to version ${maxVersion} is browsable and searchable.`)
}
