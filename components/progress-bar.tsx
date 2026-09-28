"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"

interface ProgressBarProps {
  value: number
  onChange: (value: number) => void
}

export function ProgressBar({ value, onChange }: ProgressBarProps) {
  const [open, setOpen] = useState(false)
  const [tempValue, setTempValue] = useState(value)

  const handleSave = () => {
    onChange(tempValue)
    setOpen(false)
  }

  const getProgressColor = (progress: number) => {
    if (progress === 0) return "bg-gray-200"
    if (progress < 25) return "bg-red-500"
    if (progress < 50) return "bg-orange-500"
    if (progress < 75) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getProgressEmoji = (progress: number) => {
    if (progress === 0) return "😐"
    if (progress < 20) return "😕"
    if (progress < 40) return "🙂"
    if (progress < 60) return "😊"
    if (progress < 80) return "😄"
    if (progress < 100) return "😁"
    return "🎉"
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          aria-label={`Progress ${value}%`}
          className="h-10 w-full justify-start px-2 sm:h-6 sm:px-0"
          onClick={() => {
            setTempValue(value)
            setOpen(true)
          }}
        >
          <div className="relative h-2 w-full rounded-full bg-gray-200">
            <div
              className={`h-2 rounded-full transition-all ${getProgressColor(value)}`}
              style={{ width: `${value}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
              {value}%
            </span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Progress</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="text-6xl transition-all duration-300">
              {getProgressEmoji(tempValue)}
            </div>
            <div className="text-3xl font-bold">
              {tempValue}%
            </div>
          </div>
          <div className="space-y-2">
            <Slider
              value={[tempValue]}
              onValueChange={(values) => setTempValue(values[0])}
              max={100}
              min={0}
              step={1}
              className="w-full"
            />
          </div>
          <div className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setOpen(false)} className="h-11 flex-1 sm:h-10 sm:flex-none">
              Cancel
            </Button>
            <Button onClick={handleSave} className="h-11 flex-1 sm:h-10 sm:flex-none">
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
