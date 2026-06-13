"use client"

import { useEffect, useRef, useState } from "react"
import { checkRemoteConnection, getStorageApiUrl, isStorageApiConfigured } from "@/lib/storage"

type DbStatus = "checking" | "connected" | "local" | "error"

export function DbStatusIndicator() {
  const [status, setStatus] = useState<DbStatus>("checking")
  const [message, setMessage] = useState("")
  const [popupOpen, setPopupOpen] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isStorageApiConfigured()) {
      setStatus("local")
      setMessage("Using browser storage only.")
      return
    }

    checkRemoteConnection().then((result) => {
      if (result.ok) {
        setStatus("connected")
        setMessage(result.message)
      } else {
        setStatus("error")
        setMessage(result.message)
      }
    })
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setPopupOpen(false)
      }
    }

    if (popupOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [popupOpen])

  const dotColor =
    status === "connected"
      ? "bg-green-400"
      : status === "checking"
        ? "bg-yellow-400 animate-pulse"
        : status === "local"
          ? "bg-blue-400"
          : "bg-red-500"

  const dotLabel =
    status === "connected"
      ? "MySQL storage connected"
      : status === "checking"
        ? "Checking storage connection..."
        : status === "local"
          ? "Using browser storage"
          : "Storage connection error"

  return (
    <div className="relative flex items-center">
      <button
        ref={buttonRef}
        type="button"
        aria-label={dotLabel}
        title={dotLabel}
        onClick={() => {
          if (status !== "connected") setPopupOpen((open) => !open)
        }}
        className={`h-3 w-3 flex-shrink-0 rounded-full ${dotColor} ${
          status !== "connected" ? "cursor-pointer" : "cursor-default"
        } focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60`}
      />

      {popupOpen && status !== "connected" && (
        <div
          ref={popupRef}
          role="dialog"
          aria-label="Storage status"
          className="absolute right-0 top-6 z-50 w-80 rounded-lg border border-white/20 bg-gray-900 p-4 text-sm text-white shadow-xl"
        >
          <p className="mb-1 font-semibold">
            {status === "local" ? "Browser storage mode" : "Storage connection issue"}
          </p>
          <p className="break-words leading-relaxed text-white/75">{message}</p>
          {status === "error" && (
            <p className="mt-2 text-xs text-white/50">Trying: {getStorageApiUrl()}</p>
          )}
          <button
            type="button"
            onClick={() => setPopupOpen(false)}
            className="mt-3 text-xs text-white/50 underline hover:text-white/80"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}
