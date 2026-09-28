"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RocketIcon } from "@/components/rocket-icon"

interface PinEntryPageProps {
  appName: string
  appIcon: string
  isVerifying?: boolean
  onPinEntered: (pin: string) => void | Promise<void>
}

export function PinEntryPage({ appName, appIcon, isVerifying = false, onPinEntered }: PinEntryPageProps) {
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")

  const handlePinSubmit = async () => {
    if (pin.length !== 4) {
      setError("PIN must be 4 digits")
      return
    }
    try {
      await onPinEntered(pin)
    } catch {
      setError("Could not verify PIN. Please try again.")
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-purple-900 to-purple-700 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            {appIcon ? (
              <img src={appIcon || "/placeholder.svg"} alt="App icon" className="w-16 h-16 object-contain" />
            ) : (
              <RocketIcon className="w-16 h-16 text-purple-600" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{appName}</h1>
          <p className="text-gray-600">Enter your 4-digit PIN to continue</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pin">PIN</Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ""))
                setError("")
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void handlePinSubmit()
                }
              }}
              placeholder="0000"
              className="h-14 text-center text-2xl tracking-widest"
              autoFocus
            />
          </div>

          {error && <p className="text-center text-sm text-red-500">{error}</p>}

          <Button onClick={() => void handlePinSubmit()} className="h-12 w-full" disabled={pin.length !== 4 || isVerifying}>
            {isVerifying ? "Checking..." : "Enter"}
          </Button>

          <p className="text-center text-xs text-gray-500">
            Forgot it? After you unlock, remove or reset the PIN in Settings. There is no email recovery.
          </p>
        </div>
      </div>
    </div>
  )
}
