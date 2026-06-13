import type { AppData } from "./app-data"

const LOCAL_STORAGE_KEY = "taskAppData"

function getBasePath(): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/task"
  return basePath.replace(/\/$/, "")
}

/** Explicit env override, or auto-detect `{origin}{basePath}/api/data.php` in the browser. */
export function getStorageApiUrl(): string | undefined {
  if (process.env.NEXT_PUBLIC_STORAGE_API) {
    return process.env.NEXT_PUBLIC_STORAGE_API
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}${getBasePath()}/api/data.php`
  }

  return undefined
}

export function isStorageApiConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_STORAGE_API || typeof window !== "undefined"
}

export function getStorageApiKey(): string | undefined {
  return process.env.NEXT_PUBLIC_STORAGE_API_KEY || undefined
}

export function loadFromLocalStorage(): Partial<AppData> | null {
  if (typeof window === "undefined") return null

  const bundled = localStorage.getItem(LOCAL_STORAGE_KEY)
  if (bundled) {
    try {
      return JSON.parse(bundled) as Partial<AppData>
    } catch {
      return null
    }
  }

  return migrateLegacyLocalStorage()
}

function migrateLegacyLocalStorage(): Partial<AppData> | null {
  const storedSections = localStorage.getItem("taskSections")
  if (!storedSections) return null

  try {
    const data: Partial<AppData> = {
      sections: JSON.parse(storedSections),
    }

    const keys: Array<[string, keyof AppData]> = [
      ["appName", "appName"],
      ["appIcon", "appIcon"],
      ["headerColor", "headerColor"],
      ["columnVisibility", "columnVisibility"],
      ["columnOrder", "columnOrder"],
      ["completedTasks", "completedTasks"],
      ["statusOptions", "statusOptions"],
      ["priorityOptions", "priorityOptions"],
      ["users", "users"],
    ]

    for (const [storageKey, dataKey] of keys) {
      const value = localStorage.getItem(storageKey)
      if (value) {
        ;(data as Record<string, unknown>)[dataKey] = JSON.parse(value)
      }
    }

    return data
  } catch {
    return null
  }
}

export function saveToLocalStorage(data: AppData): void {
  if (typeof window === "undefined") return
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data))
}

export async function loadFromRemote(): Promise<AppData | null> {
  const endpoint = getStorageApiUrl()
  if (!endpoint) return null

  const headers: HeadersInit = { Accept: "application/json" }
  const apiKey = getStorageApiKey()
  if (apiKey) headers["X-API-Key"] = apiKey

  const response = await fetch(endpoint, { method: "GET", headers })
  if (response.status === 404) return null
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Storage load failed (${response.status})`)
  }

  const payload = await response.json()
  return (payload.data ?? payload) as AppData
}

export async function saveToRemote(data: AppData): Promise<void> {
  const endpoint = getStorageApiUrl()
  if (!endpoint) return

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
  }
  const apiKey = getStorageApiKey()
  if (apiKey) headers["X-API-Key"] = apiKey

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ data }),
    keepalive: true,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Storage save failed (${response.status})`)
  }
}

export async function checkRemoteConnection(): Promise<{ ok: boolean; message: string }> {
  const endpoint = getStorageApiUrl()
  if (!endpoint) {
    return {
      ok: false,
      message: "Could not determine storage API URL.",
    }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 8000)

  try {
    const headers: HeadersInit = { Accept: "application/json" }
    const apiKey = getStorageApiKey()
    if (apiKey) headers["X-API-Key"] = apiKey

    const response = await fetch(`${endpoint}?health=1`, {
      method: "GET",
      headers,
      signal: controller.signal,
    })

    if (response.ok) {
      return { ok: true, message: "Connected to MySQL storage." }
    }

    const body = await response.text()
    return { ok: false, message: body || `Health check failed (${response.status})` }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { ok: false, message: "Connection timed out after 8 seconds." }
    }
    return { ok: false, message: error instanceof Error ? error.message : "Network error" }
  } finally {
    clearTimeout(timeoutId)
  }
}
