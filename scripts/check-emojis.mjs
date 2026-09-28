import { readFileSync } from "node:fs"

const picker = readFileSync("components/enhanced-emoji-picker.tsx", "utf8")
const search = readFileSync("lib/emoji-search.ts", "utf8")

const catBlock = picker.match(/const EMOJI_CATEGORIES[\s\S]*?^}/m)?.[0] ?? ""
const namesBlock = picker.match(/const EMOJI_NAMES[\s\S]*?^}/m)?.[0] ?? ""
const extBlock = search.match(/export const EMOJI_EXTENSIONS[\s\S]*$/m)?.[0] ?? ""

const literals = (block) => [...block.matchAll(/"([^"]+)"/g)].map((match) => match[1])
const keys = (block) => [...block.matchAll(/^\s*"([^"]+)":/gm)].map((match) => match[1])

const categories = [...catBlock.matchAll(/^ {2}(\w+): \[([\s\S]*?)^ {2}\],/gm)]

// Categories spread in supplemental lists from EMOJI_EXTENSIONS, so include those too.
const browsable = new Set([
  ...categories.flatMap(([, , body]) => literals(body)),
  ...literals(extBlock.match(/^ {2}people:\s*\[[\s\S]*?^ {2}\]/m)?.[0] ?? ""),
  ...literals(extBlock.match(/^ {2}travel:\s*\[[\s\S]*?^ {2}\]/m)?.[0] ?? ""),
])
const named = new Set([...keys(namesBlock), ...keys(extBlock.match(/names:\s*\{[\s\S]*?\}\s*as Record/m)?.[0] ?? "")])

const codePoints = (emoji) =>
  [...emoji].map((character) => character.codePointAt(0)?.toString(16)).join("-")

const unnamed = [...browsable].filter((emoji) => !named.has(emoji))
const unreachable = [...named].filter((emoji) => !browsable.has(emoji))

const duplicates = categories.flatMap(([, name, body]) => {
  const seen = new Set()
  return literals(body)
    .filter((emoji) => (seen.has(emoji) ? true : (seen.add(emoji), false)))
    .map((emoji) => `${name}: ${emoji}`)
})

console.log(`${categories.length} categories, ${browsable.size} browsable emojis, ${named.size} named emojis`)

if (unnamed.length) {
  console.log(`\n${unnamed.length} emoji(s) in a category with no EMOJI_NAMES entry (unsearchable):`)
  for (const emoji of unnamed) console.log(" ", JSON.stringify(emoji), codePoints(emoji))
}

if (unreachable.length) {
  console.log(`\n${unreachable.length} named emoji(s) missing from every category (unreachable in the picker):`)
  for (const emoji of unreachable) console.log(" ", JSON.stringify(emoji), codePoints(emoji))
}

if (duplicates.length) {
  console.log(`\n${duplicates.length} emoji(s) listed twice within one category:`)
  for (const entry of duplicates) console.log(" ", entry)
}

if (unnamed.length || unreachable.length || duplicates.length) {
  process.exitCode = 1
} else {
  console.log("\nEvery emoji is both browsable and searchable.")
}
