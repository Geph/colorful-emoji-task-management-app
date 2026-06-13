"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { AppData } from "@/lib/app-data"
import { hydrateTaskDates, stripLegacyFields } from "@/lib/app-data"
import { getStorageApiUrl, loadFromLocalStorage, loadFromRemote, saveToLocalStorage, saveToRemote, isStorageApiConfigured } from "@/lib/storage"

interface UseAppStorageOptions {
  enabled: boolean
  onLoaded: (data: Partial<AppData>) => void
}

export function useAppStorage({ enabled, onLoaded }: UseAppStorageOptions) {
  const [isLoading, setIsLoading] = useState(true)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestDataRef = useRef<AppData | null>(null)
  const onLoadedRef = useRef(onLoaded)

  useEffect(() => {
    onLoadedRef.current = onLoaded
  }, [onLoaded])

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return

    let cancelled = false

    const load = async () => {
      try {
        const remoteData = await loadFromRemote()
        if (cancelled) return

        if (remoteData) {
          applyLoadedData(remoteData)
          saveToLocalStorage(remoteData)
          return
        }
      } catch (error) {
        console.warn("Remote storage unavailable, falling back to local data.", error)
      }

      const localData = loadFromLocalStorage()
      if (localData) {
        applyLoadedData(localData)
      }
    }

    const applyLoadedData = (raw: Partial<AppData>) => {
      const cleaned = stripLegacyFields(raw as Record<string, unknown>) as Partial<AppData>
      const hydrated: Partial<AppData> = {
        ...cleaned,
        sections: cleaned.sections?.map((section) => ({
          ...section,
          tasks: section.tasks.map((task) => hydrateTaskDates(task)),
        })),
        completedTasks: cleaned.completedTasks?.map((task) => hydrateTaskDates(task)),
      }
      onLoadedRef.current(hydrated)
    }

    load().finally(() => {
      if (!cancelled) setIsLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [enabled])

  const persist = useCallback((data: AppData) => {
    latestDataRef.current = data
    saveToLocalStorage(data)

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    if (!getStorageApiUrl()) return

    saveTimeoutRef.current = setTimeout(async () => {
      const payload = latestDataRef.current
      if (!payload) return

      try {
        await saveToRemote(payload)
        setSaveError(null)
        setLastSavedAt(new Date())
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : "Failed to save to database")
      }
    }, 1200)
  }, [])

  const syncNow = useCallback(async (data: AppData) => {
    latestDataRef.current = data
    saveToLocalStorage(data)

    if (!getStorageApiUrl()) {
      throw new Error("Storage API is not configured in this build.")
    }

    await saveToRemote(data)
    setSaveError(null)
    setLastSavedAt(new Date())
  }, [])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [])

  return {
    isLoading,
    saveError,
    lastSavedAt,
    persist,
    syncNow,
    isRemoteConfigured: isStorageApiConfigured(),
  }
}
