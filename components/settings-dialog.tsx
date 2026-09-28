"use client"

import { useState } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Settings, Upload, Download, Lock, RotateCcw } from "lucide-react"
import { ExportImportDialog } from "@/components/export-import-dialog"
import { ColumnOrderSettings } from "@/components/column-order-settings"
import { ThemeSettings } from "@/components/theme-settings"
import { useIsMobile } from "@/hooks/use-mobile"
import { APP_VERSION } from "@/lib/version"
import type { ColumnVisibility } from "@/lib/app-data"

interface SettingsDialogProps {
  children: React.ReactNode
  appName: string
  appIcon: string
  headerColor: string
  onUpdateHeaderColor: (color: string) => void
  hasPIN: boolean
  onUpdateAppName: (name: string) => void
  onUpdateAppIcon: (icon: string) => void
  onSetPIN: (pin: string) => void | Promise<void>
  onRemovePIN: () => void
  sections: any[]
  statusOptions: any[]
  priorityOptions: any[]
  onImport: (data: any) => void
  columnVisibility: ColumnVisibility
  onUpdateColumnVisibility: (visibility: ColumnVisibility) => void
  columnOrder: string[]
  onUpdateColumnOrder: (order: string[]) => void
  users: string[]
  isRemoteConfigured?: boolean
  lastSavedAt?: Date | null
  saveError?: string | null
  onSyncToDatabase?: () => Promise<void>
}

export function SettingsDialog({
  children,
  appName,
  appIcon,
  headerColor,
  onUpdateHeaderColor,
  hasPIN,
  onUpdateAppName,
  onUpdateAppIcon,
  onSetPIN,
  onRemovePIN,
  sections,
  statusOptions,
  priorityOptions,
  onImport,
  columnVisibility,
  onUpdateColumnVisibility,
  columnOrder,
  onUpdateColumnOrder,
  users,
  isRemoteConfigured = false,
  lastSavedAt = null,
  saveError = null,
  onSyncToDatabase,
}: SettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [tempAppName, setTempAppName] = useState(appName)
  const [newPIN, setNewPIN] = useState("")
  const [confirmPIN, setConfirmPIN] = useState("")
  const [isSyncing, setIsSyncing] = useState(false)

  const isMobile = useIsMobile()

  const handleIconUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 1024 * 1024) {
        // 1MB limit
        alert("File size must be under 1MB")
        return
      }

      if (!file.type.includes("png") && !file.type.includes("svg")) {
        alert("Only PNG and SVG files are supported")
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        onUpdateAppIcon(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSetPIN = async () => {
    if (newPIN.length !== 4 || !/^\d{4}$/.test(newPIN)) {
      alert("PIN must be exactly 4 digits")
      return
    }

    if (newPIN !== confirmPIN) {
      alert("PINs do not match")
      return
    }

    await onSetPIN(newPIN)
    setNewPIN("")
    setConfirmPIN("")
    alert("PIN saved. You'll be asked for it the next time you open this app.")
  }

  const handleSaveSettings = () => {
    onUpdateAppName(tempAppName)
    setOpen(false)
  }

  const handleSyncToDatabase = async () => {
    if (!onSyncToDatabase) return

    setIsSyncing(true)
    try {
      await onSyncToDatabase()
      alert("Tasks saved to the database.")
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save to database.")
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] w-full max-w-[calc(100vw-1rem)] overflow-y-auto p-4 sm:max-w-2xl sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Configure your app settings including appearance, columns, security, and data management.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className={`${isMobile ? "grid grid-cols-2 h-auto" : "grid grid-cols-4"} w-full`}>
            <TabsTrigger value="general" className={isMobile ? "text-xs py-2" : ""}>
              General
            </TabsTrigger>
            <TabsTrigger value="columns" className={isMobile ? "text-xs py-2" : ""}>
              Columns
            </TabsTrigger>
            <TabsTrigger value="security" className={isMobile ? "text-xs py-2" : ""}>
              Security
            </TabsTrigger>
            <TabsTrigger value="data" className={isMobile ? "text-xs py-2" : ""}>
              Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="app-name">App Name</Label>
              <Input
                id="app-name"
                value={tempAppName}
                onChange={(e) => setTempAppName(e.target.value)}
                placeholder="Enter app name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="app-icon">App Icon (PNG/SVG, max 1MB)</Label>
              <div className={`flex items-center gap-3 ${isMobile ? "flex-col" : ""}`}>
                <div className="w-12 h-12 border rounded flex items-center justify-center bg-muted">
                  {appIcon ? (
                    <img src={appIcon || "/placeholder.svg"} alt="App icon" className="w-8 h-8 object-contain" />
                  ) : (
                    <Upload className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <Input
                  id="app-icon"
                  type="file"
                  accept=".png,.svg"
                  onChange={handleIconUpload}
                  className={`${isMobile ? "w-full" : "flex-1"}`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="header-color">Header Color</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="header-color"
                  type="color"
                  value={headerColor}
                  onChange={(e) => onUpdateHeaderColor(e.target.value)}
                  className="w-20 h-10 p-1 cursor-pointer"
                />
                <span className="text-sm text-muted-foreground">{headerColor}</span>
              </div>
            </div>

            <ThemeSettings />

            <div className="pt-4 border-t mt-6">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>App Version</span>
                <span className="font-mono">v{APP_VERSION}</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="columns" className="space-y-4">
            <ColumnOrderSettings
              columnVisibility={columnVisibility}
              columnOrder={columnOrder}
              onUpdateColumnVisibility={onUpdateColumnVisibility}
              onUpdateColumnOrder={onUpdateColumnOrder}
            />
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The PIN is a lock screen, asked once per browser session. A hash is saved with your other settings in
                MySQL so every device that loads this data will prompt. It does not encrypt tasks, and the PIN itself is
                never stored.
              </p>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded border p-4">
                <div className="min-w-0">
                  <h3 className="font-medium">4-Digit PIN</h3>
                  <p className="text-sm text-muted-foreground">{hasPIN ? "PIN is currently set" : "No PIN set"}</p>
                </div>
                {hasPIN ? (
                  <Button variant="outline" onClick={onRemovePIN} className="h-11 w-full sm:h-10 sm:w-auto">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Remove PIN
                  </Button>
                ) : null}
              </div>

              {!hasPIN && (
                <div className="space-y-3">
                  <div className={`${isMobile ? "space-y-3" : "grid grid-cols-2 gap-3"}`}>
                    <div className="space-y-2">
                      <Label htmlFor="new-pin">New PIN (4 digits)</Label>
                      <Input
                        id="new-pin"
                        type="password"
                        inputMode="numeric"
                        autoComplete="new-password"
                        maxLength={4}
                        value={newPIN}
                        onChange={(e) => setNewPIN(e.target.value.replace(/\D/g, ""))}
                        placeholder="0000"
                        className="h-11 sm:h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-pin">Confirm PIN</Label>
                      <Input
                        id="confirm-pin"
                        type="password"
                        inputMode="numeric"
                        autoComplete="new-password"
                        maxLength={4}
                        value={confirmPIN}
                        onChange={(e) => setConfirmPIN(e.target.value.replace(/\D/g, ""))}
                        placeholder="0000"
                        className="h-11 sm:h-9"
                      />
                    </div>
                  </div>
                  <Button onClick={handleSetPIN} className="h-11 w-full sm:h-10">
                    <Lock className="mr-2 h-4 w-4" />
                    Set PIN
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <div className="space-y-4">
              <div className="p-4 border rounded">
                <h3 className="font-medium mb-2">Database sync</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Push everything currently in this browser (tasks, sections, settings) to MySQL. Use this once to
                  migrate data you already had saved locally.
                </p>
                {isRemoteConfigured ? (
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={handleSyncToDatabase}
                      disabled={isSyncing}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {isSyncing ? "Saving..." : "Push to database now"}
                    </Button>
                    {lastSavedAt && (
                      <p className="text-xs text-muted-foreground">
                        Last saved to database: {lastSavedAt.toLocaleString()}
                      </p>
                    )}
                    {saveError && <p className="text-xs text-destructive">{saveError}</p>}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Storage API not detected. Deploy the PHP files to{" "}
                    <code className="text-xs">/task/api/data.php</code> on your server.
                  </p>
                )}
              </div>

              <div className="p-4 border rounded">
                <h3 className="font-medium mb-2">Export/Import Configuration</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Export your sections, status options, and priority options to share or backup your configuration.
                </p>
                <ExportImportDialog
                  sections={sections}
                  statusOptions={statusOptions}
                  priorityOptions={priorityOptions}
                  columnVisibility={columnVisibility}
                  columnOrder={columnOrder}
                  users={users}
                  onImport={onImport}
                >
                  <Button variant="outline" className="w-full bg-transparent">
                    <Download className="w-4 h-4 mr-2" />
                    Export/Import Data
                  </Button>
                </ExportImportDialog>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 border-t pt-4 sm:justify-end">
          <Button variant="outline" onClick={() => setOpen(false)} className="h-11 flex-1 sm:h-10 sm:flex-none">
            Cancel
          </Button>
          <Button onClick={handleSaveSettings} className="h-11 flex-1 sm:h-10 sm:flex-none">
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
