"use client"

import type React from "react"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Download, Upload } from "lucide-react"

import type { ColumnVisibility } from "@/lib/app-data"

interface Task {
  id: string
  name: string
  status: string
  priority: string
  completed: boolean
  notes: string
  emoji: string
  progress: number
  dueDate: Date | null
  assignedTo: string
}

interface ExportImportDialogProps {
  sections: Array<{ id: string; name: string; tasks?: Task[] }> // Added tasks to sections
  statusOptions: Array<{ key: string; label: string; color: string }>
  priorityOptions: Array<{ key: string; label: string; color: string }>
  columnVisibility: ColumnVisibility
  columnOrder: string[]
  users: string[]
  onImport: (data: {
    sections: Array<{ id: string; name: string; tasks?: Task[] }> // Added tasks to import
    statusOptions: Array<{ key: string; label: string; color: string }>
    priorityOptions: Array<{ key: string; label: string; color: string }>
    columnVisibility?: ColumnVisibility
    columnOrder?: string[]
    users?: string[]
  }) => void
  children: React.ReactNode
}

export function ExportImportDialog({
  sections,
  statusOptions,
  priorityOptions,
  columnVisibility,
  columnOrder,
  users,
  onImport,
  children,
}: ExportImportDialogProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [importUrl, setImportUrl] = useState("")
  const [isLoadingUrl, setIsLoadingUrl] = useState(false)

  const escapeXml = (str: string) => {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;")
  }

  const unescapeXml = (str: string) => {
    return str
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
  }

  const exportData = () => {
    const data = {
      sections: sections.map((section, index) => ({
        id: section.id,
        name: section.name,
        order: index,
        tasks: section.tasks || [], // Include tasks in export
      })),
      statusOptions: statusOptions.map((option, index) => ({
        key: option.key,
        label: option.label,
        color: option.color,
        order: index,
      })),
      priorityOptions: priorityOptions.map((option, index) => ({
        key: option.key,
        label: option.label,
        color: option.color,
        order: index,
      })),
      columnVisibility,
      columnOrder,
      users,
      exportDate: new Date().toISOString(),
      version: "1.0",
    }

    const xmlData = `<?xml version="1.0" encoding="UTF-8"?>
<taskManagementConfig version="1.0" exportDate="${data.exportDate}">
  <sections>
    ${data.sections
      .map(
        (section) => `    <section id="${section.id}" name="${escapeXml(section.name)}" order="${section.order}">
      ${section.tasks
        .map(
          (task) => `      <task 
        id="${task.id}" 
        name="${escapeXml(task.name)}" 
        status="${task.status}" 
        priority="${task.priority}" 
        completed="${task.completed}" 
        emoji="${escapeXml(task.emoji)}" 
        progress="${task.progress}" 
        dueDate="${task.dueDate ? new Date(task.dueDate).toISOString() : ""}" 
        assignedTo="${escapeXml(task.assignedTo)}">
        <notes>${escapeXml(task.notes)}</notes>
      </task>`,
        )
        .join("\n")}
    </section>`,
      )
      .join("\n")}
  </sections>
  <statusOptions>
    ${data.statusOptions
      .map(
        (option) =>
          `    <status key="${option.key}" label="${escapeXml(option.label)}" color="${option.color}" order="${option.order}" />`,
      )
      .join("\n")}
  </statusOptions>
  <priorityOptions>
    ${data.priorityOptions
      .map(
        (option) =>
          `    <priority key="${option.key}" label="${escapeXml(option.label)}" color="${option.color}" order="${option.order}" />`,
      )
      .join("\n")}
  </priorityOptions>
  <columnVisibility status="${data.columnVisibility.status}" priority="${data.columnVisibility.priority}" progress="${data.columnVisibility.progress}" due="${data.columnVisibility.due}" who="${data.columnVisibility.who}" />
  <columnOrder>
    ${data.columnOrder.map((col) => `    <column>${col}</column>`).join("\n")}
  </columnOrder>
  <users>
    ${data.users.map((user) => `    <user>${escapeXml(user)}</user>`).join("\n")}
  </users>
</taskManagementConfig>`

    const blob = new Blob([xmlData], { type: "application/xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `task-management-config-${new Date().toISOString().split("T")[0]}.xml`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleUrlImport = async () => {
    if (!importUrl.trim()) {
      alert("Please enter a valid URL")
      return
    }

    setIsLoadingUrl(true)
    try {
      const response = await fetch(importUrl)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.text()
      const blob = new Blob([data], { type: "application/xml" })
      const file = new File([blob], "imported-config.xml", { type: "application/xml" })
      setUploadedFile(file)
      setImportUrl("")
      alert("Data loaded from URL successfully. Click Import Configuration to apply.")
    } catch (error) {
      alert(`Error loading data from URL: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoadingUrl(false)
    }
  }

  const handleImport = async () => {
    if (!uploadedFile) {
      alert("Please upload an XML file first")
      return
    }

    try {
      const fileContent = await uploadedFile.text()
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(fileContent, "application/xml")

      const sections = Array.from(xmlDoc.querySelectorAll("section")).map((section) => {
        const tasks = Array.from(section.querySelectorAll("task")).map((task) => {
          const notesElement = task.querySelector("notes")
          const dueDateStr = task.getAttribute("dueDate") || ""

          return {
            id: task.getAttribute("id") || "",
            name: unescapeXml(task.getAttribute("name") || ""),
            status: task.getAttribute("status") || "not-yet",
            priority: task.getAttribute("priority") || "blank",
            completed: task.getAttribute("completed") === "true",
            emoji: unescapeXml(task.getAttribute("emoji") || ""),
            progress: Number.parseInt(task.getAttribute("progress") || "0", 10),
            dueDate: dueDateStr ? new Date(dueDateStr) : null,
            assignedTo: unescapeXml(task.getAttribute("assignedTo") || ""),
            notes: notesElement ? unescapeXml(notesElement.textContent || "") : "",
          }
        })

        return {
          id: section.getAttribute("id") || "",
          name: unescapeXml(section.getAttribute("name") || ""),
          tasks,
        }
      })

      const statusOptions = Array.from(xmlDoc.querySelectorAll("status")).map((status) => ({
        key: status.getAttribute("key") || "",
        label: unescapeXml(status.getAttribute("label") || ""),
        color: status.getAttribute("color") || "",
      }))

      const priorityOptions = Array.from(xmlDoc.querySelectorAll("priority")).map((priority) => ({
        key: priority.getAttribute("key") || "",
        label: unescapeXml(priority.getAttribute("label") || ""),
        color: priority.getAttribute("color") || "",
      }))

      const columnVisibilityElement = xmlDoc.querySelector("columnVisibility")
      const columnVisibility = columnVisibilityElement
        ? {
            status: columnVisibilityElement.getAttribute("status") !== "false",
            priority: columnVisibilityElement.getAttribute("priority") !== "false",
            progress: columnVisibilityElement.getAttribute("progress") !== "false",
            due: columnVisibilityElement.getAttribute("due") !== "false",
            who: columnVisibilityElement.getAttribute("who") !== "false",
          }
        : undefined

      const columnOrder = Array.from(xmlDoc.querySelectorAll("columnOrder > column"))
        .map((col) => col.textContent || "")
        .filter((col) => col !== "attachments")

      const users = Array.from(xmlDoc.querySelectorAll("users > user")).map((user) => unescapeXml(user.textContent || ""))

      onImport({ sections, statusOptions, priorityOptions, columnVisibility, columnOrder, users })
      setUploadedFile(null)
      setIsOpen(false)
    } catch (error) {
      alert("Error parsing import data. Please check the file format.")
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type === "application/xml" || file.type === "text/xml" || file.name.endsWith(".xml")) {
        setUploadedFile(file)
      } else {
        alert("Please upload a valid XML file")
        e.target.value = ""
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export / Import Configuration</DialogTitle>
          <DialogDescription>
            Export your current configuration including tasks, sections, status options, and priority options to share
            with others or import a configuration from XML file or URL.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <Label className="text-base font-medium">Export Current Configuration</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Download your current tasks, sections, status options, and priority options as an XML file.
            </p>
            <Button onClick={exportData} className="gap-2">
              <Download className="w-4 h-4" />
              Export to XML
            </Button>
          </div>

          <div className="border-t pt-6">
            <Label htmlFor="import-data" className="text-base font-medium">
              Import Configuration
            </Label>
            <p className="text-sm text-muted-foreground mb-3">Import configuration from a URL or upload an XML file.</p>

            <div className="space-y-3 mb-4">
              <Label htmlFor="import-url">Import from URL</Label>
              <div className="flex gap-2">
                <Input
                  id="import-url"
                  placeholder="https://example.com/config.xml"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleUrlImport} disabled={!importUrl.trim() || isLoadingUrl} variant="outline">
                  {isLoadingUrl ? "Loading..." : "Load"}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="import-file">Or upload XML file</Label>
              <Input
                id="import-file"
                type="file"
                accept=".xml,application/xml,text/xml"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              {uploadedFile && (
                <p className="text-sm text-muted-foreground">
                  Selected file: <span className="font-medium">{uploadedFile.name}</span>
                </p>
              )}
            </div>

            <div className="flex gap-2 mt-3">
              <Button onClick={handleImport} disabled={!uploadedFile} className="gap-2">
                <Upload className="w-4 h-4" />
                Import Configuration
              </Button>
              <Button variant="outline" onClick={() => setUploadedFile(null)}>
                Clear
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
