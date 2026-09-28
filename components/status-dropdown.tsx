"use client"

import { Check, Settings } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { OptionManagerDialog } from "@/components/option-manager-dialog"

export type StatusType = string

interface StatusOption {
  key: string
  label: string
  color: string
}

interface StatusDropdownProps {
  value: StatusType
  onChange: (status: StatusType) => void
  options: StatusOption[]
  onUpdateOptions: (options: StatusOption[]) => void
  fullWidth?: boolean
  mobileHeight?: boolean // added mobileHeight prop for taller mobile dropdowns
}

export function StatusDropdown({
  value,
  onChange,
  options,
  onUpdateOptions,
  fullWidth = false,
  mobileHeight = false,
}: StatusDropdownProps) {
  const allOptions = [{ key: "blank", label: "--", color: "#ffffff" }, ...options]

  const currentStatus = allOptions.find((option) => option.key === value) || allOptions[0]

  const handleStatusChange = (status: StatusType) => {
    console.log("[v0] Status changing to:", status)
    onChange(status)
  }

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        console.log("[v0] Status dropdown open state changed:", open)
      }}
    >
      <DropdownMenuTrigger
        className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:text-accent-foreground dark:hover:bg-accent/50 has-[>svg]:px-3 p-0 hover:bg-transparent cursor-pointer ${fullWidth ? "w-full h-full min-h-[32px]" : ""} ${mobileHeight ? "min-h-[40px]" : ""}`} // added mobileHeight conditional styling
        onClick={() => console.log("[v0] Status dropdown trigger clicked")}
      >
        <Badge
          className={`text-xs font-medium hover:opacity-80 cursor-pointer ${
            fullWidth ? "w-full h-full flex items-center justify-center border" : "rounded-full"
          } ${fullWidth && !mobileHeight ? "rounded-none" : ""} ${mobileHeight ? "min-h-[36px] rounded-md py-2" : ""} ${currentStatus.key === "blank" ? "text-gray-500 border-gray-300" : "text-white"}`} // added mobileHeight styling for badge
          style={{
            backgroundColor: currentStatus.key === "blank" ? "#ffffff" : currentStatus.color,
            borderColor: currentStatus.key === "blank" ? "#d1d5db" : currentStatus.color,
          }}
        >
          {currentStatus.label}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48" sideOffset={4} onCloseAutoFocus={(e) => e.preventDefault()}>
        {allOptions.map((option) => (
          <DropdownMenuItem
            key={option.key}
            onClick={() => {
              console.log("[v0] Status option clicked:", option.key)
              handleStatusChange(option.key)
            }}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${option.key === "blank" ? "border border-gray-300" : ""}`}
                style={{ backgroundColor: option.key === "blank" ? "#ffffff" : option.color }}
              />
              <span>{option.label}</span>
            </div>
            {value === option.key && <Check className="w-4 h-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <OptionManagerDialog title="Status" options={options} onUpdateOptions={onUpdateOptions}>
            <div className="flex items-center gap-2 cursor-pointer">
              <Settings className="w-4 h-4" />
              <span>Manage Options</span>
            </div>
          </OptionManagerDialog>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
