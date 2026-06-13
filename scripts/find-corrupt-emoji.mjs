import { readFileSync } from "node:fs"

const src = readFileSync("components/enhanced-emoji-picker.tsx", "utf8")
const catBlock = src.match(/const EMOJI_CATEGORIES[\s\S]*?^}/m)?.[0] ?? ""
for (const line of catBlock.split("\n")) {
  for (const match of line.matchAll(/"([^"]+)"/g)) {
    if (match[1].includes("\uFFFD")) {
      console.log("Corrupt entry on line:", line.trim())
    }
  }
}
