const PIN_UNLOCK_KEY = "taskPinUnlocked"
const LEGACY_PIN_KEY = "userPIN"
const LEGACY_AUTH_KEY = "isAuthenticated"
const PBKDF2_ITERATIONS = 100_000

const encoder = new TextEncoder()

export function isPinUnlocked(): boolean {
  if (typeof window === "undefined") return false
  return sessionStorage.getItem(PIN_UNLOCK_KEY) === "1"
}

export function markPinUnlocked(): void {
  if (typeof window === "undefined") return
  sessionStorage.setItem(PIN_UNLOCK_KEY, "1")
}

export function clearPinUnlock(): void {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(PIN_UNLOCK_KEY)
}

export function readLegacyPlaintextPin(): string | null {
  if (typeof window === "undefined") return null
  const value = localStorage.getItem(LEGACY_PIN_KEY)
  return value && /^\d{4}$/.test(value) ? value : null
}

export function clearLegacyPinStorage(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(LEGACY_PIN_KEY)
  localStorage.removeItem(LEGACY_AUTH_KEY)
}

export async function createPinRecord(pin: string): Promise<{ pinHash: string; pinSalt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await derivePinHash(pin, salt)
  return { pinHash: toHex(hash), pinSalt: toHex(salt) }
}

export async function verifyPin(pin: string, pinHash: string, pinSalt: string): Promise<boolean> {
  if (!pinHash || !pinSalt || !/^\d{4}$/.test(pin)) return false
  try {
    const hash = await derivePinHash(pin, fromHex(pinSalt))
    return timingSafeEqual(toHex(hash), pinHash)
  } catch {
    return false
  }
}

async function derivePinHash(pin: string, salt: Uint8Array): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(pin), "PBKDF2", false, ["deriveBits"])
  return crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: PBKDF2_ITERATIONS },
    key,
    256,
  )
}

function toHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

function fromHex(hex: string): Uint8Array {
  const pairs = hex.match(/.{1,2}/g) || []
  return new Uint8Array(pairs.map((pair) => Number.parseInt(pair, 16)))
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}
