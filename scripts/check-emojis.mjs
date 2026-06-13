import { readFileSync } from "node:fs"

const src = readFileSync("components/enhanced-emoji-picker.tsx", "utf8")
const catBlock = src.match(/const EMOJI_CATEGORIES[\s\S]*?^}/m)?.[0] ?? ""
const namesBlock = src.match(/const EMOJI_NAMES[\s\S]*?^}/m)?.[0] ?? ""
const extract = (block) => [...block.matchAll(/"([^"]+)"/g)].map((match) => match[1])
const categories = [...new Set(extract(catBlock))]
const names = new Set(extract(namesBlock))
const missing = categories.filter((emoji) => !names.has(emoji))
for (const emoji of missing) {
  console.log(JSON.stringify(emoji), [...emoji].map((c) => c.codePointAt(0)?.toString(16)).join("-"))
}
