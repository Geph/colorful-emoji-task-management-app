"use client"

import type React from "react"

import {
  ChevronDown,
  ChevronRight,
  Search,
  Plus,
  ArrowUpDown,
  Trash2,
  FolderOpen,
  CheckCircle,
  Edit,
  Merge,
  Settings,
  ChevronUp,
  ChevronDownIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useState, useRef, useEffect, useCallback } from "react"
import { StatusDropdown, type StatusType } from "@/components/status-dropdown"
import { PriorityDropdown, type PriorityType } from "@/components/priority-dropdown"
import { SectionRenameDialog } from "@/components/section-rename-dialog"
import { MoveToSectionDialog } from "@/components/move-to-section-dialog"
import { TaskDetailsDialog } from "@/components/task-details-dialog"
import { AddSectionDialog } from "@/components/add-section-dialog"
import { RemoveSectionDialog } from "@/components/remove-section-dialog"
import { RocketIcon } from "@/components/rocket-icon"
import { MergeTasksDialog } from "@/components/merge-tasks-dialog"
import { EmojiPicker } from "@/components/enhanced-emoji-picker"
import { SettingsDialog } from "@/components/settings-dialog"
import { DbStatusIndicator } from "@/components/db-status-indicator"
import { ProgressBar } from "@/components/progress-bar"
import { DueDatePicker } from "@/components/due-date-picker"
import { WhoField } from "@/components/who-field"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAppStorage } from "@/hooks/use-app-storage"
import {
  DEFAULT_COLUMN_ORDER,
  DEFAULT_COLUMN_VISIBILITY,
  serializeTaskDates,
  stripLegacyFields,
  type ColumnVisibility,
} from "@/lib/app-data"
import type { AppData } from "@/lib/app-data"

interface Task {
  id: string
  name: string
  status: StatusType
  priority: PriorityType
  completed: boolean
  notes: string
  emoji: string
  progress: number
  dueDate: Date | null
  assignedTo: string
  sectionId?: string // Added to track original section for completed tasks
}

interface TaskSection {
  id: string
  name: string
  tasks: Task[]
  expanded: boolean
}

type SortField = "name" | "status" | "priority" | "due"
type SortDirection = "asc" | "desc"

export function TaskList() {
  const [statusOptions, setStatusOptions] = useState([
    { key: "ongoing", label: "On-going", color: "#81b1ff" },
    { key: "waiting", label: "Waiting / review", color: "#06b6d4" },
    { key: "not-yet", label: "Not yet", color: "#b5bcc2" },
    { key: "working", label: "Working on it", color: "#f9d900" },
    { key: "delegated", label: "Delegated", color: "#af7e2e" },
    { key: "paused", label: "Paused", color: "#6b7280" },
    { key: "stuck", label: "Stuck", color: "#ec4899" },
    { key: "someday", label: "Someday", color: "#1bbc9c" },
  ])

  const [priorityOptions, setPriorityOptions] = useState([
    { key: "high", label: "High", color: "#ef4444" },
    { key: "medium", label: "Medium", color: "#ff7800" },
    { key: "low", label: "Low", color: "#3082b7" },
    { key: "someday", label: "Someday", color: "#1bbc9c" },
    { key: "paused", label: "Paused", color: "#6b7280" }, // Added "paused" priority
  ])

  const [sections, setSections] = useState<TaskSection[]>([
    {
      id: "group1",
      name: "EXAMPLE GROUP 1",
      expanded: true,
      tasks: [
        {
          id: "1",
          name: "Example Task 1",
          status: "ongoing",
          priority: "medium",
          completed: false,
          notes: "",
          emoji: "📝",
          progress: 0,
          dueDate: null,
          assignedTo: "",
        },
        {
          id: "2",
          name: "Example Task 2",
          status: "not-yet",
          priority: "high",
          completed: false,
          notes: "",
          emoji: "📝",
          progress: 0,
          dueDate: null,
          assignedTo: "",
        },
      ],
    },
    {
      id: "group2",
      name: "EXAMPLE GROUP 2",
      expanded: true,
      tasks: [
        {
          id: "3",
          name: "Example Task 3",
          status: "working",
          priority: "low",
          completed: false,
          notes: "",
          emoji: "📝",
          progress: 0,
          dueDate: null,
          assignedTo: "",
        },
      ],
    },
  ])

  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [sortField, setSortField] = useState<SortField>("priority")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)

  const [appName, setAppName] = useState("Your Name's Task Management")
  const [appIcon, setAppIcon] = useState("")
  const [headerColor, setHeaderColor] = useState("#5e1bda")
  const [hasPIN, setHasPIN] = useState(false)
  const [userPIN, setUserPIN] = useState("")
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(DEFAULT_COLUMN_VISIBILITY)
  const [columnOrder, setColumnOrder] = useState<string[]>(DEFAULT_COLUMN_ORDER)

  const [isCompletedCollapsed, setIsCompletedCollapsed] = useState(false)
  const [users, setUsers] = useState<string[]>([])

  const isMobile = useIsMobile()
  const [storageReady, setStorageReady] = useState(false)

  const handleStorageLoaded = useCallback((data: Partial<AppData>) => {
    if (data.appName) setAppName(data.appName)
    if (data.appIcon) setAppIcon(data.appIcon)
    if (data.headerColor) setHeaderColor(data.headerColor)
    if (data.columnVisibility) {
      const cleaned = stripLegacyFields({ columnVisibility: data.columnVisibility }).columnVisibility as ColumnVisibility
      setColumnVisibility({ ...DEFAULT_COLUMN_VISIBILITY, ...cleaned })
    }
    if (data.columnOrder?.length) {
      setColumnOrder(data.columnOrder.filter((col) => col !== "attachments"))
    }
    if (data.sections) setSections(data.sections as TaskSection[])
    if (data.completedTasks) setCompletedTasks(data.completedTasks as Task[])
    if (data.statusOptions) setStatusOptions(data.statusOptions)
    if (data.priorityOptions) setPriorityOptions(data.priorityOptions)
    if (data.users) setUsers(data.users)
  }, [])

  const { isLoading: isStorageLoading, saveError, lastSavedAt, persist, syncNow, isRemoteConfigured } =
    useAppStorage({
      enabled: storageReady,
      onLoaded: handleStorageLoaded,
    })

  const buildCurrentAppData = useCallback(
    (): AppData => ({
      appName,
      appIcon,
      headerColor,
      columnVisibility,
      columnOrder,
      sections: sections.map((section) => ({
        ...section,
        tasks: section.tasks.map((task) => serializeTaskDates(task)),
      })),
      completedTasks: completedTasks.map((task) => serializeTaskDates(task)),
      statusOptions,
      priorityOptions,
      users,
    }),
    [
      appName,
      appIcon,
      headerColor,
      columnVisibility,
      columnOrder,
      sections,
      completedTasks,
      statusOptions,
      priorityOptions,
      users,
    ],
  )

  useEffect(() => {
    if (!storageReady || isStorageLoading) return

    persist(buildCurrentAppData())
  }, [storageReady, isStorageLoading, persist, buildCurrentAppData])

  const handleSyncToDatabase = useCallback(async () => {
    await syncNow(buildCurrentAppData())
  }, [syncNow, buildCurrentAppData])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserPIN = localStorage.getItem("userPIN")
      if (storedUserPIN) {
        setUserPIN(storedUserPIN)
        setHasPIN(true)
      }
      setStorageReady(true)
    }
  }, [])

  const calculateColumnWidths = () => {
    if (isMobile) {
      return {
        checkbox: "8%",
        emoji: "12%",
        name: "80%",
      }
    }

    const baseColumns = {
      checkbox: "5%",
      emoji: "8%",
      name: "40%", // Reduced from 50% to 40% to give more space to columns
    }

    const visibleColumns = columnOrder.filter((columnId) => {
      switch (columnId) {
        case "status":
          return columnVisibility.status
        case "priority":
          return columnVisibility.priority
        case "progress":
          return columnVisibility.progress
        case "due":
          return columnVisibility.due
        case "who":
          return columnVisibility.who
        default:
          return false
      }
    })

    // Calculate remaining width after base columns (47% remaining)
    const remainingWidth = 47

    // If no dynamic columns are visible, give all remaining space to name
    if (visibleColumns.length === 0) {
      return {
        ...baseColumns,
        name: "87%", // 40% + 47% = 87%
      }
    }

    // Define minimum widths for specific columns
    const columnMinWidths: Record<string, number> = {
      status: 10, // Increased minimum for status
      priority: 10, // Increased minimum for priority
      progress: 7,
      due: 9,
      who: 10, // Increased minimum for who
    }

    const dynamicColumns: Record<string, string> = {}

    // Calculate total minimum width needed
    const totalMinWidth = visibleColumns.reduce((sum, col) => sum + (columnMinWidths[col] || 6), 0)

    // If we have enough space, use minimum widths plus distribute extra space
    if (totalMinWidth <= remainingWidth) {
      const extraSpace = remainingWidth - totalMinWidth
      const extraPerColumn = Math.floor(extraSpace / visibleColumns.length)
      const remainder = extraSpace - extraPerColumn * visibleColumns.length

      visibleColumns.forEach((columnId, index) => {
        const minWidth = columnMinWidths[columnId] || 6
        const width = minWidth + extraPerColumn + (index === visibleColumns.length - 1 ? remainder : 0)

        switch (columnId) {
          case "status":
            if (columnVisibility.status) dynamicColumns.status = `${width}%`
            break
          case "priority":
            if (columnVisibility.priority) dynamicColumns.priority = `${width}%`
            break
          case "progress":
            if (columnVisibility.progress) dynamicColumns.progress = `${width}%`
            break
          case "due":
            if (columnVisibility.due) dynamicColumns.due = `${width}%`
            break
          case "who":
            if (columnVisibility.who) dynamicColumns.who = `${width}%`
            break
        }
      })
    } else {
      // Fallback: distribute evenly if minimum widths exceed available space
      const columnWidth = Math.floor(remainingWidth / visibleColumns.length)
      const remainder = remainingWidth - columnWidth * visibleColumns.length

      visibleColumns.forEach((columnId, index) => {
        const width = columnWidth + (index === visibleColumns.length - 1 ? remainder : 0)

        switch (columnId) {
          case "status":
            if (columnVisibility.status) dynamicColumns.status = `${width}%`
            break
          case "priority":
            if (columnVisibility.priority) dynamicColumns.priority = `${width}%`
            break
          case "progress":
            if (columnVisibility.progress) dynamicColumns.progress = `${width}%`
            break
          case "due":
            if (columnVisibility.due) dynamicColumns.due = `${width}%`
            break
          case "who":
            if (columnVisibility.who) dynamicColumns.who = `${width}%`
            break
        }
      })
    }

    return { ...baseColumns, ...dynamicColumns }
  }

  const [columnWidths, setColumnWidths] = useState(calculateColumnWidths())
  const [isResizing, setIsResizing] = useState<string | null>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (column: string, e: React.MouseEvent) => {
    // setIsResizing(column)
    e.preventDefault()
  }

  const handleSort = (field: SortField) => {
    console.log("[v0] Sort clicked:", field, "current direction:", sortDirection)
    if (sortField === field) {
      setSortDirection((prevDirection) => (prevDirection === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortTasks = (tasks: Task[]) => {
    return [...tasks].sort((a, b) => {
      let result = 0

      switch (sortField) {
        case "priority":
          const aPriorityIndex = priorityOptions.findIndex((p) => p.key === a.priority)
          const bPriorityIndex = priorityOptions.findIndex((p) => p.key === b.priority)
          // If priority not found, put it at the end
          const aPriority = aPriorityIndex === -1 ? 999 : aPriorityIndex
          const bPriority = bPriorityIndex === -1 ? 999 : bPriorityIndex
          result = aPriority - bPriority // Lower index (higher priority) first
          break

        case "due":
          const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER
          const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER
          result = aDate - bDate // Earlier dates first
          break

        case "status":
          result = a.status.localeCompare(b.status)
          break

        case "name":
        default:
          const aName = a.name.toLowerCase() || "zzz" // Empty names go to end
          const bName = b.name.toLowerCase() || "zzz"
          result = aName.localeCompare(bName)
          break
      }

      if (sortDirection === "desc") {
        result = -result
      }

      if (result === 0 && sortField !== "name") {
        const aName = a.name.toLowerCase() || "zzz"
        const bName = b.name.toLowerCase() || "zzz"
        result = aName.localeCompare(bName)
      }

      return result
    })
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      return
    }

    const handleMouseUp = () => {
      setIsResizing(null)
    }

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing, columnWidths])

  useEffect(() => {
    setColumnWidths(calculateColumnWidths())
  }, [columnVisibility, columnOrder, isMobile]) // Added isMobile to dependency array

  const toggleSection = (sectionId: string) => {
    setSections(
      sections.map((section) => (section.id === sectionId ? { ...section, expanded: !section.expanded } : section)),
    )
  }

  const suggestEmoji = (taskName: string): string => {
    const name = taskName.toLowerCase()

    // Common task-related emojis based on keywords
    if (name.includes("call") || name.includes("phone")) return "📞"
    if (name.includes("email") || name.includes("mail")) return "✉️"
    if (name.includes("meeting") || name.includes("meet")) return "🤝"
    if (name.includes("research") || name.includes("study")) return "🔍"
    if (name.includes("write") || name.includes("document")) return "📝"
    if (name.includes("fix") || name.includes("bug") || name.includes("repair")) return "🛠️"
    if (name.includes("update") || name.includes("upgrade")) return "⬆️"
    if (name.includes("website") || name.includes("web")) return "🌐"
    if (name.includes("server") || name.includes("deploy")) return "💻"
    if (name.includes("design") || name.includes("ui")) return "🎨"
    if (name.includes("test") || name.includes("testing")) return "🧪"
    if (name.includes("plan") || name.includes("planning")) return "📋"
    if (name.includes("review") || name.includes("check")) return "👀"
    if (name.includes("data") || name.includes("database")) return "📊"
    if (name.includes("video") || name.includes("record")) return "🎬"
    if (name.includes("photo") || name.includes("image")) return "📸"
    if (name.includes("book") || name.includes("read")) return "📚"
    if (name.includes("travel") || name.includes("trip")) return "✈️"
    if (name.includes("money") || name.includes("payment")) return "💰"
    if (name.includes("security") || name.includes("secure")) return "🔒"
    if (name.includes("backup") || name.includes("save")) return "💾"
    if (name.includes("clean") || name.includes("organize")) return "🧹"
    if (name.includes("launch") || name.includes("start")) return "🚀"

    // Default emoji for new tasks
    return "📝"
  }

  const addTask = (sectionId: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      name: "",
      status: "not-yet",
      priority: "blank",
      completed: false,
      notes: "",
      emoji: "",
      progress: 0,
      dueDate: null,
      assignedTo: "",
    }

    console.log("[v0] Adding new task to section:", sectionId)
    setSections(
      sections.map((section) =>
        section.id === sectionId ? { ...section, tasks: [newTask, ...section.tasks] } : section,
      ),
    )

    setEditingTaskId(newTask.id)
  }

  const duplicateTask = (sectionId: string, taskId: string) => {
    const section = sections.find((s) => s.id === sectionId)
    const task = section?.tasks.find((t) => t.id === taskId)

    if (task) {
      const duplicatedTask: Task = {
        ...task,
        id: Date.now().toString(),
        name: `${task.name} (Copy)`,
        notes: task.notes,
      }

      setSections(
        sections.map((section) =>
          section.id === sectionId ? { ...section, tasks: [...section.tasks, duplicatedTask] } : section,
        ),
      )
    }
  }

  const renameTask = (sectionId: string, taskId: string, newName: string) => {
    const trimmedName = newName.trim()

    setSections((prevSections) =>
      prevSections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              tasks: section.tasks.map((task) => {
                if (task.id === taskId) {
                  const updatedTask = { ...task, name: trimmedName }
                  if (!task.emoji && trimmedName) {
                    updatedTask.emoji = suggestEmoji(trimmedName)
                  }
                  return updatedTask
                }
                return task
              }),
            }
          : section,
      ),
    )
    setEditingTaskId(null)
  }

  const updateTaskStatus = (sectionId: string, taskId: string, status: StatusType) => {
    setSections(
      sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              tasks: section.tasks.map((task) => (task.id === taskId ? { ...task, status } : task)),
            }
          : section,
      ),
    )
  }

  const updateTaskPriority = (sectionId: string, taskId: string, priority: PriorityType) => {
    setSections(
      sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              tasks: section.tasks.map((task) => (task.id === taskId ? { ...task, priority } : task)),
            }
          : section,
      ),
    )
  }

  const updateTaskNotes = (sectionId: string, taskId: string, notes: string) => {
    setSections(
      sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              tasks: section.tasks.map((task) => (task.id === taskId ? { ...task, notes } : task)),
            }
          : section,
      ),
    )
  }

  const updateTaskProgress = (sectionId: string, taskId: string, progress: number) => {
    setSections(
      sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              tasks: section.tasks.map((task) => (task.id === taskId ? { ...task, progress } : task)),
            }
          : section,
      ),
    )
  }

  const updateTaskDueDate = (sectionId: string, taskId: string, dueDate: Date | null) => {
    setSections(
      sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              tasks: section.tasks.map((task) => (task.id === taskId ? { ...task, dueDate } : task)),
            }
          : section,
      ),
    )
  }

  const updateTaskAssignedTo = (sectionId: string, taskId: string, assignedTo: string) => {
    setSections(
      sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              tasks: section.tasks.map((task) => (task.id === taskId ? { ...task, assignedTo } : task)),
            }
          : section,
      ),
    )
  }

  const toggleTaskSelection = (taskId: string) => {
    const newSelected = new Set(selectedTasks)
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId)
    } else {
      newSelected.add(taskId)
    }
    setSelectedTasks(newSelected)
  }

  const deleteSelectedTasks = () => {
    setSections(
      sections.map((section) => ({
        ...section,
        tasks: section.tasks.filter((task) => !selectedTasks.has(task.id)),
      })),
    )
    setSelectedTasks(new Set())
  }

  const moveSelectedTasks = (targetSectionId: string) => {
    const tasksToMove: Task[] = []

    sections.forEach((section) => {
      section.tasks.forEach((task) => {
        if (selectedTasks.has(task.id)) {
          tasksToMove.push(task)
        }
      })
    })

    setSections(
      sections.map((section) => {
        if (section.id === targetSectionId) {
          return {
            ...section,
            tasks: [...section.tasks, ...tasksToMove],
          }
        } else {
          return {
            ...section,
            tasks: section.tasks.filter((task) => !selectedTasks.has(task.id)),
          }
        }
      }),
    )
    setSelectedTasks(new Set())
  }

  const markSelectedAsCompleted = () => {
    const tasksToComplete: Task[] = []

    sections.forEach((section) => {
      section.tasks.forEach((task) => {
        if (selectedTasks.has(task.id)) {
          tasksToComplete.push({ ...task, completed: true, sectionId: section.id }) // Store sectionId
        }
      })
    })

    setSections(
      sections.map((section) => ({
        ...section,
        tasks: section.tasks.filter((task) => !selectedTasks.has(task.id)),
      })),
    )

    setCompletedTasks([...completedTasks, ...tasksToComplete])
    setSelectedTasks(new Set())
  }

  const markTaskAsCompleted = (sectionId: string, taskId: string) => {
    const section = sections.find((s) => s.id === sectionId)
    const task = section?.tasks.find((t) => t.id === taskId)

    if (task) {
      const completedTask = { ...task, completed: true, sectionId: sectionId } // Store sectionId

      setSections(
        sections.map((section) =>
          section.id === sectionId ? { ...section, tasks: section.tasks.filter((t) => t.id !== taskId) } : section,
        ),
      )

      setCompletedTasks([...completedTasks, completedTask])
    }
  }

  const markTaskAsIncomplete = (taskId: string) => {
    const task = completedTasks.find((t) => t.id === taskId)

    if (task) {
      // Find the original section or add to the first section
      const targetSectionId = task.sectionId || sections[0]?.id
      // Reset status to a default or previously known status if available, otherwise empty
      const incompletedTask = { ...task, completed: false, status: task.status || "" }

      setSections(
        sections.map((section) =>
          section.id === targetSectionId ? { ...section, tasks: [incompletedTask, ...section.tasks] } : section,
        ),
      )

      setCompletedTasks(completedTasks.filter((t) => t.id !== taskId))
    }
  }

  const deleteTask = (sectionId: string, taskId: string) => {
    setSections(
      sections.map((section) =>
        section.id === sectionId ? { ...section, tasks: section.tasks.filter((t) => t.id !== taskId) } : section,
      ),
    )
  }

  const renameSection = (sectionId: string, newName: string) => {
    setSections(sections.map((section) => (section.id === sectionId ? { ...section, name: newName } : section)))
  }

  const removeSection = (sectionId: string, moveToSectionId?: string) => {
    const sectionToRemove = sections.find((s) => s.id === sectionId)
    if (!sectionToRemove) return

    if (moveToSectionId && sectionToRemove.tasks.length > 0) {
      setSections(
        sections
          .map((section) => {
            if (section.id === moveToSectionId) {
              return {
                ...section,
                tasks: [...section.tasks, ...sectionToRemove.tasks],
              }
            }
            return section
          })
          .filter((section) => section.id !== sectionId),
      )
    } else {
      setSections(sections.filter((section) => section.id !== sectionId))
    }
  }

  const addSection = (name: string) => {
    const newSection: TaskSection = {
      id: Date.now().toString(),
      name: name.toUpperCase(),
      tasks: [],
      expanded: true,
    }
    setSections([...sections, newSection])
  }

  const moveSectionUp = (sectionId: string) => {
    const index = sections.findIndex((s) => s.id === sectionId)
    if (index > 0) {
      const newSections = [...sections]
      const temp = newSections[index]
      newSections[index] = newSections[index - 1]
      newSections[index - 1] = temp
      setSections(newSections)
    }
  }

  const moveSectionDown = (sectionId: string) => {
    const index = sections.findIndex((s) => s.id === sectionId)
    if (index < sections.length - 1) {
      const newSections = [...sections]
      const temp = newSections[index]
      newSections[index] = newSections[index + 1]
      newSections[index + 1] = temp
      setSections(newSections)
    }
  }

  const handleImport = (data: {
    sections: Array<{ id: string; name: string; tasks?: Task[] }> // Added tasks to import type
    statusOptions: Array<{ key: string; label: string; color: string }>
    priorityOptions: Array<{ key: string; label: string; color: string }>
    columnVisibility?: ColumnVisibility
    columnOrder?: string[]
    users?: string[]
  }) => {
    if (data.sections && data.sections.length > 0) {
      setSections(
        data.sections.map((section) => ({
          id: section.id,
          name: section.name,
          tasks: section.tasks || [],
          expanded: true,
        })),
      )
    }
    setStatusOptions(data.statusOptions)
    setPriorityOptions(data.priorityOptions)
    if (data.columnVisibility) {
      const cleaned = stripLegacyFields({ columnVisibility: data.columnVisibility }).columnVisibility as ColumnVisibility
      setColumnVisibility({ ...DEFAULT_COLUMN_VISIBILITY, ...cleaned })
    }
    if (data.columnOrder && data.columnOrder.length > 0) {
      setColumnOrder(data.columnOrder.filter((col) => col !== "attachments"))
    }
    if (data.users) {
      setUsers(data.users)
    }
  }

  const mergeSelectedTasks = (newTaskName: string) => {
    const tasksToMerge: Task[] = []
    let targetSectionId = ""

    sections.forEach((section) => {
      section.tasks.forEach((task) => {
        if (selectedTasks.has(task.id)) {
          tasksToMerge.push(task)
          if (!targetSectionId) targetSectionId = section.id
        }
      })
    })

    if (tasksToMerge.length > 1) {
      const mergedTask: Task = {
        id: Date.now().toString(),
        name: newTaskName,
        status: tasksToMerge[0].status,
        priority: tasksToMerge[0].priority,
        completed: false,
        notes: tasksToMerge
          .map((t) => t.notes)
          .filter((n) => n)
          .join("\n\n"),
        emoji: tasksToMerge[0].emoji,
        progress: 0, // Default values for new fields
        dueDate: null,
        assignedTo: "",
      }

      setSections(
        sections.map((section) => {
          if (section.id === targetSectionId) {
            return {
              ...section,
              tasks: [...section.tasks.filter((task) => !selectedTasks.has(task.id)), mergedTask],
            }
          } else {
            return {
              ...section,
              tasks: section.tasks.filter((task) => !selectedTasks.has(task.id)),
            }
          }
        }),
      )
      setSelectedTasks(new Set())
    }
  }

  // Removed sendTaskEmail and setTaskReminder functions

  const updateTaskEmoji = (sectionId: string, taskId: string, emoji: string) => {
    setSections(
      sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              tasks: section.tasks.map((task) => (task.id === taskId ? { ...task, emoji } : task)),
            }
          : section,
      ),
    )
  }

  const handleUpdateAppName = (name: string) => {
    setAppName(name)
    if (typeof window !== "undefined") {
      localStorage.setItem("appName", name)
    }
  }

  const handleUpdateAppIcon = (icon: string) => {
    setAppIcon(icon)
    if (typeof window !== "undefined") {
      localStorage.setItem("appIcon", icon)
    }
  }

  const handleUpdateHeaderColor = (color: string) => {
    setHeaderColor(color)
    if (typeof window !== "undefined") {
      localStorage.setItem("headerColor", color)
    }
  }

  const handleSetPIN = (pin: string) => {
    setUserPIN(pin)
    setHasPIN(true)
    if (typeof window !== "undefined") {
      localStorage.setItem("userPIN", pin)
      localStorage.removeItem("isAuthenticated") // Force re-authentication
    }
    alert("PIN set successfully. You will need to enter it on your next visit.")
  }

  const handleRemovePIN = () => {
    setUserPIN("")
    setHasPIN(false)
    if (typeof window !== "undefined") {
      localStorage.removeItem("userPIN")
      localStorage.removeItem("isAuthenticated")
    }
  }

  const handleUpdateColumnVisibility = (visibility: ColumnVisibility) => {
    setColumnVisibility(visibility)
    if (typeof window !== "undefined") {
      localStorage.setItem("columnVisibility", JSON.stringify(visibility))
    }
  }

  const handleUpdateColumnOrder = (order: string[]) => {
    setColumnOrder(order)
    if (typeof window !== "undefined") {
      localStorage.setItem("columnOrder", JSON.stringify(order))
    }
  }

  const handleAddUser = (user: string) => {
    if (!users.includes(user)) {
      setUsers([...users, user])
    }
  }

  const handleRemoveUser = (user: string) => {
    setUsers(users.filter((u) => u !== user))
    // Unassign any tasks assigned to this user
    setSections(
      sections.map((section) => ({
        ...section,
        tasks: section.tasks.map((task) => (task.assignedTo === user ? { ...task, assignedTo: "" } : task)),
      })),
    )
  }

  const handleRenameUser = (oldName: string, newName: string) => {
    if (newName.trim() && !users.includes(newName) && users.includes(oldName)) {
      setUsers(users.map((u) => (u === oldName ? newName : u)))
      // Update all tasks assigned to this user
      setSections(
        sections.map((section) => ({
          ...section,
          tasks: section.tasks.map((task) => (task.assignedTo === oldName ? { ...task, assignedTo: newName } : task)),
        })),
      )
    }
  }

  const renderTaskColumns = (task: Task, section: { id: string }) => {
    const columnComponents: Record<string, React.JSX.Element> = {
      status: columnVisibility.status ? (
        <div className="flex items-stretch" style={{ width: columnWidths.status }}>
          <div className="w-full">
            <StatusDropdown
              value={task.status}
              onChange={(status) => updateTaskStatus(section.id, task.id, status)}
              options={statusOptions}
              onUpdateOptions={setStatusOptions}
              fullWidth
            />
          </div>
        </div>
      ) : null,
      priority: columnVisibility.priority ? ( // Added visibility check for priority
        <div className="flex items-stretch" style={{ width: columnWidths.priority }}>
          <div className="w-full">
            <PriorityDropdown
              value={task.priority}
              onChange={(priority) => updateTaskPriority(section.id, task.id, priority)}
              options={priorityOptions}
              onUpdateOptions={setPriorityOptions}
              fullWidth
            />
          </div>
        </div>
      ) : null,
      progress: columnVisibility.progress ? (
        <div className="flex items-center" style={{ width: columnWidths.progress }}>
          <ProgressBar
            value={task.progress}
            onChange={(progress) => updateTaskProgress(section.id, task.id, progress)}
          />
        </div>
      ) : null,
      due: columnVisibility.due ? (
        <div className="flex items-center" style={{ width: columnWidths.due }}>
          <DueDatePicker value={task.dueDate} onChange={(dueDate) => updateTaskDueDate(section.id, task.id, dueDate)} />
        </div>
      ) : null,
      who: columnVisibility.who ? (
        <div className="flex items-center relative z-10" style={{ width: columnWidths.who }}>
          <WhoField
            value={task.assignedTo}
            onChange={(assignedTo) => updateTaskAssignedTo(section.id, task.id, assignedTo)}
            users={users}
            onAddUser={handleAddUser}
            onRemoveUser={handleRemoveUser}
            onRenameUser={handleRenameUser}
          />
        </div>
      ) : null,
    }

    return columnOrder.map((columnId) => columnComponents[columnId]).filter(Boolean)
  }

  const renderColumnHeaders = () => {
    const headerComponents: Record<string, React.JSX.Element> = {
      status: columnVisibility.status ? (
        <div
          className="flex items-center justify-center gap-1 cursor-pointer relative"
          style={{ width: columnWidths.status }}
          onClick={() => handleSort("status")}
        >
          Status
          <ArrowUpDown className="w-3 h-3" />
        </div>
      ) : null,
      priority: columnVisibility.priority ? ( // Added visibility check for priority header
        <div
          className="flex items-center justify-center gap-1 cursor-pointer relative"
          style={{ width: columnWidths.priority }}
          onClick={() => handleSort("priority")}
        >
          Priority
          <ArrowUpDown className="w-3 h-3" />
        </div>
      ) : null,
      progress: columnVisibility.progress ? (
        <div className="flex items-center justify-center gap-1 relative" style={{ width: columnWidths.progress }}>
          Progress
        </div>
      ) : null,
      due: columnVisibility.due ? (
        <div
          className="flex items-center justify-center gap-1 cursor-pointer relative" // Added cursor-pointer and onClick handler for due date sorting
          style={{ width: columnWidths.due }}
          onClick={() => handleSort("due")}
        >
          Due
          <ArrowUpDown className="w-3 h-3" />
        </div>
      ) : null,
      who: columnVisibility.who ? (
        <div className="flex items-center justify-center gap-1 relative" style={{ width: columnWidths.who }}>
          Who
        </div>
      ) : null,
    }

    return columnOrder.map((columnId) => headerComponents[columnId]).filter(Boolean)
  }

  const renderMobileTaskRow = (task: Task, section: { id: string }) => {
    const mobileColumns = columnOrder.filter((columnId) => {
      switch (columnId) {
        case "status":
          return columnVisibility.status
        case "priority":
          return columnVisibility.priority
        case "progress":
          return columnVisibility.progress
        case "due":
          return columnVisibility.due
        case "who":
          return columnVisibility.who
        default:
          return false
      }
    })

    return (
      <div
        key={task.id}
        className={`p-2 hover:bg-muted/50 border-b border-border/50 ${
          task.completed ? "opacity-60" : ""
        } ${selectedTasks.has(task.id) ? "bg-blue-50" : ""}`}
      >
        {/* Main row with checkbox, emoji, name, and files */}
        <div className="flex items-center gap-3 mb-1">
          <Checkbox checked={selectedTasks.has(task.id)} onCheckedChange={() => toggleTaskSelection(task.id)} />
          <div onClick={() => console.log("[v0] Emoji picker container clicked in mobile row")}>
            <EmojiPicker
              value={task.emoji}
              onChange={(emoji) => {
                console.log("[v0] Emoji changed in mobile row:", emoji)
                updateTaskEmoji(section.id, task.id, emoji)
              }}
            />
          </div>
          <div className="flex-1">
            {editingTaskId === task.id ? (
              <Input
                value={task.name}
                onChange={(e) => {
                  const newName = e.target.value
                  setSections(
                    sections.map((section) =>
                      section.id === section.id
                        ? {
                            ...section,
                            tasks: section.tasks.map((t) => (t.id === task.id ? { ...t, name: newName } : t)),
                          }
                        : section,
                    ),
                  )
                }}
                onBlur={() => {
                  if (task.name.trim()) {
                    renameTask(section.id, task.id, task.name.trim())
                  } else {
                    renameTask(section.id, task.id, "New Task")
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur()
                  }
                }}
                autoFocus
                className="text-sm h-8"
              />
            ) : (
              <div
                className={`text-sm cursor-pointer hover:bg-muted/50 px-2 py-1 rounded flex-1 block ${
                  task.completed ? "line-through" : ""
                } ${task.name === "" ? "text-muted-foreground italic" : ""}`}
                onClick={() => {
                  if (task.name === "") {
                    setEditingTaskId(task.id)
                  }
                }}
              >
                {task.name === "" ? (
                  <span>Click to add task name...</span>
                ) : (
                  <TaskDetailsDialog
                    taskName={task.name}
                    taskNotes={task.notes}
                    taskEmoji={task.emoji}
                    onUpdateNotes={(notes) => updateTaskNotes(section.id, task.id, notes)}
                    onUpdateEmoji={(emoji) => updateTaskEmoji(section.id, task.id, emoji)}
                    onRenameTask={(newName) => renameTask(section.id, task.id, newName)}
                    onDuplicateTask={() => duplicateTask(section.id, task.id)}
                    onDeleteTask={() => deleteTask(section.id, task.id)}
                    onMarkCompleted={() => markTaskAsCompleted(section.id, task.id)} // Added mark completed
                  >
                    <span>{task.name}</span>
                  </TaskDetailsDialog>
                )}
              </div>
            )}
          </div>
        </div>

        {mobileColumns.length > 0 && (
          <div className={`ml-11 grid gap-2 text-xs ${mobileColumns.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
            {mobileColumns
              .map((columnId) => {
                switch (columnId) {
                  case "status":
                    return columnVisibility.status ? (
                      <div key="status" className="flex items-center">
                        <div className="flex-1">
                          <StatusDropdown
                            value={task.status}
                            onChange={(status) => updateTaskStatus(section.id, task.id, status)}
                            options={statusOptions}
                            onUpdateOptions={setStatusOptions}
                            fullWidth
                            mobileHeight // added mobile height prop
                          />
                        </div>
                      </div>
                    ) : null

                  case "priority":
                    return columnVisibility.priority ? (
                      <div key="priority" className="flex items-center">
                        <div className="flex-1">
                          <PriorityDropdown
                            value={task.priority}
                            onChange={(priority) => updateTaskPriority(section.id, task.id, priority)}
                            options={priorityOptions}
                            onUpdateOptions={setPriorityOptions}
                            fullWidth
                            mobileHeight // added mobile height prop
                          />
                        </div>
                      </div>
                    ) : null

                  case "progress":
                    return columnVisibility.progress ? (
                      <div key="progress" className="flex items-center gap-1">
                        <span className="text-muted-foreground font-medium">Progress:</span>
                        <div className="flex-1">
                          <ProgressBar
                            value={task.progress}
                            onChange={(progress) => updateTaskProgress(section.id, task.id, progress)}
                          />
                        </div>
                      </div>
                    ) : null

                  case "due":
                    return columnVisibility.due ? (
                      <div key="due" className="flex items-center gap-1">
                        <span className="text-muted-foreground font-medium">Due:</span>
                        <DueDatePicker
                          value={task.dueDate}
                          onChange={(dueDate) => updateTaskDueDate(section.id, task.id, dueDate)}
                        />
                      </div>
                    ) : null

                  case "who":
                    return columnVisibility.who ? (
                      <div key="who" className="flex items-center gap-1">
                        <span className="text-muted-foreground font-medium">Who:</span>
                        <div className="flex-1">
                          <WhoField
                            value={task.assignedTo}
                            onChange={(assignedTo) => updateTaskAssignedTo(section.id, task.id, assignedTo)}
                            users={users}
                            onAddUser={handleAddUser}
                            onRemoveUser={handleRemoveUser}
                            onRenameUser={handleRenameUser}
                          />
                        </div>
                      </div>
                    ) : null

                  default:
                    return null
                }
              })
              .filter(Boolean)}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 bg-background">
      {isStorageLoading && (
        <div className="border-b border-border bg-muted/40 px-4 py-2 text-center text-sm text-muted-foreground">
          Loading saved tasks...
        </div>
      )}
      {saveError && (
        <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
          Could not sync to database: {saveError}
        </div>
      )}
      <div
        className={`border-b border-border ${isMobile ? "px-3 py-4" : "p-6"}`}
        style={{ backgroundColor: headerColor }}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            {appIcon ? (
              <img src={appIcon || "/placeholder.svg"} alt="App icon" className="h-8 w-8 flex-shrink-0 object-contain" />
            ) : (
              <RocketIcon className="h-8 w-8 flex-shrink-0 text-white" />
            )}
            <div className="min-w-0">
              <h1 className={`truncate font-semibold text-white ${isMobile ? "text-lg" : "text-2xl"}`}>{appName}</h1>
              {lastSavedAt && !isMobile && (
                <p className="text-xs text-white/70">Saved {lastSavedAt.toLocaleTimeString()}</p>
              )}
            </div>
            <DbStatusIndicator />
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative order-1 w-full sm:order-2 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                className="w-full border-white/20 bg-white/10 pl-10 text-white placeholder:text-white/60"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="order-2 flex items-center gap-2 sm:order-1">
              <AddSectionDialog onAddSection={addSection}>
                <Button
                  variant="outline"
                  size={isMobile ? "default" : "sm"}
                  className="flex-1 gap-2 border-white/20 bg-white/10 text-white transition-colors hover:bg-white hover:text-purple-900 sm:flex-none"
                >
                  <Plus className="h-4 w-4" />
                  {isMobile ? "Section" : "Add Section"}
                </Button>
              </AddSectionDialog>
              <SettingsDialog
                appName={appName}
                appIcon={appIcon}
                headerColor={headerColor}
                onUpdateHeaderColor={handleUpdateHeaderColor}
                hasPIN={hasPIN}
                onUpdateAppName={handleUpdateAppName}
                onUpdateAppIcon={handleUpdateAppIcon}
                onSetPIN={handleSetPIN}
                onRemovePIN={handleRemovePIN}
                sections={sections}
                statusOptions={statusOptions}
                priorityOptions={priorityOptions}
                onImport={handleImport}
                columnVisibility={columnVisibility}
                onUpdateColumnVisibility={handleUpdateColumnVisibility}
                columnOrder={columnOrder}
                onUpdateColumnOrder={handleUpdateColumnOrder}
                users={users}
                isRemoteConfigured={isRemoteConfigured}
                lastSavedAt={lastSavedAt}
                saveError={saveError}
                onSyncToDatabase={handleSyncToDatabase}
              >
                <Button
                  variant="outline"
                  size={isMobile ? "default" : "sm"}
                  className="gap-2 border-white/20 bg-white/10 text-white transition-colors hover:bg-white hover:text-purple-900"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </SettingsDialog>
            </div>
          </div>
        </div>
      </div>

      <div className={`border-b border-border ${isMobile ? "px-2 py-2" : "p-4"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {selectedTasks.size > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={deleteSelectedTasks} className="gap-1 bg-transparent">
                  <Trash2 className="w-4 h-4" />
                  Delete ({selectedTasks.size})
                </Button>
                <MoveToSectionDialog sections={sections} onMove={moveSelectedTasks}>
                  <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                    <FolderOpen className="w-4 h-4" />
                    Move ({selectedTasks.size})
                  </Button>
                </MoveToSectionDialog>
                <Button variant="outline" size="sm" onClick={markSelectedAsCompleted} className="gap-1 bg-transparent">
                  <CheckCircle className="w-4 h-4" />
                  Complete ({selectedTasks.size})
                </Button>
                {selectedTasks.size > 1 && (
                  <MergeTasksDialog
                    selectedTaskNames={Array.from(selectedTasks)
                      .map((taskId) => {
                        for (const section of sections) {
                          const task = section.tasks.find((t) => t.id === taskId)
                          if (task) return task.name
                        }
                        return ""
                      })
                      .filter(Boolean)}
                    onMerge={mergeSelectedTasks}
                  >
                    <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                      <Merge className="w-4 h-4" />
                      Merge ({selectedTasks.size})
                    </Button>
                  </MergeTasksDialog>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`table-container ${isMobile ? "px-2 py-3" : "p-4"}`} ref={tableRef}>
        {sections.map((section) => (
          <div key={section.id} className="mb-6">
            <div className="flex flex-col gap-2 mb-4">
              {/* Main section header row */}
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => toggleSection(section.id)} className="p-1">
                  {section.expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>
                <div className="bg-gray-700 text-white px-3 py-1 rounded text-sm font-medium flex items-center gap-2">
                  <span>{section.name}</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded text-xs">{section.tasks.length}</span>
                </div>

                {/* Desktop: buttons inline */}
                <div className="hidden sm:flex items-center gap-2 ml-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => moveSectionUp(section.id)}
                    disabled={sections.findIndex((s) => s.id === section.id) === 0}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => moveSectionDown(section.id)}
                    disabled={sections.findIndex((s) => s.id === section.id) === sections.length - 1}
                  >
                    <ChevronDownIcon className="w-4 h-4" />
                  </Button>

                  <SectionRenameDialog
                    currentName={section.name}
                    onRename={(newName) => renameSection(section.id, newName)}
                  >
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </SectionRenameDialog>

                  <RemoveSectionDialog
                    sectionToRemove={section}
                    availableSections={sections}
                    onRemoveSection={removeSection}
                  >
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </RemoveSectionDialog>

                  <Button
                    size="sm"
                    className="gap-1 bg-gray-600 text-white hover:bg-gray-700"
                    onClick={() => addTask(section.id)}
                  >
                    <Plus className="w-4 h-4" />
                    Add Task
                  </Button>
                </div>
              </div>

              {/* Mobile: buttons below section header */}
              <div className="flex sm:hidden items-center gap-2 ml-8">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => moveSectionUp(section.id)}
                  disabled={sections.findIndex((s) => s.id === section.id) === 0}
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => moveSectionDown(section.id)}
                  disabled={sections.findIndex((s) => s.id === section.id) === sections.length - 1}
                >
                  <ChevronDownIcon className="w-4 h-4" />
                </Button>

                <SectionRenameDialog
                  currentName={section.name}
                  onRename={(newName) => renameSection(section.id, newName)}
                >
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <Edit className="w-4 h-4" />
                  </Button>
                </SectionRenameDialog>

                <RemoveSectionDialog
                  sectionToRemove={section}
                  availableSections={sections}
                  onRemoveSection={removeSection}
                >
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </RemoveSectionDialog>

                <Button
                  size="sm"
                  className="gap-1 bg-gray-600 text-white hover:bg-gray-700"
                  onClick={() => addTask(section.id)}
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </Button>
              </div>
            </div>

            {section.expanded && (
              <>
                {isMobile ? (
                  // Mobile layout - stacked cards
                  <div className="space-y-0.5">
                    {section.tasks
                      .filter(
                        (task) =>
                          searchTerm === "" ||
                          task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.emoji.includes(searchTerm),
                      )
                      .sort((a, b) => {
                        const sorted = sortTasks([a, b])
                        return sorted[0] === a ? -1 : 1
                      })
                      .map((task) => renderMobileTaskRow(task, section))}
                  </div>
                ) : (
                  // Desktop layout - table
                  <>
                    <div className="flex gap-1 px-4 py-2 text-sm text-muted-foreground border-b border-border overflow-x-auto">
                      <div style={{ width: columnWidths.checkbox }}>☑️</div>
                      <div style={{ width: columnWidths.emoji }}>😀</div>
                      <div
                        className="flex items-center gap-1 cursor-pointer relative"
                        style={{ width: columnWidths.name }}
                        onClick={() => handleSort("name")}
                      >
                        Name
                        {sortField === "name" && (
                          <ArrowUpDown className={`w-3 h-3 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                        )}
                      </div>
                      {renderColumnHeaders()}
                    </div>

                    {section.tasks
                      .filter(
                        (task) =>
                          searchTerm === "" ||
                          task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.emoji.includes(searchTerm),
                      )
                      .sort((a, b) => {
                        const sorted = sortTasks([a, b])
                        return sorted[0] === a ? -1 : 1
                      })
                      .map((task) => (
                        <div
                          key={task.id}
                          className={`group flex gap-1 px-4 py-0.75 hover:bg-muted/50 border-b border-border/50 ${
                            task.completed ? "opacity-60" : ""
                          } ${selectedTasks.has(task.id) ? "bg-blue-50" : ""}`}
                          style={{
                            minHeight: "32px",
                          }}
                        >
                          <div className="flex items-center" style={{ width: columnWidths.checkbox }}>
                            <Checkbox
                              checked={selectedTasks.has(task.id)}
                              onCheckedChange={() => toggleTaskSelection(task.id)}
                            />
                          </div>

                          <div className="flex items-center" style={{ width: columnWidths.emoji }}>
                            <div onClick={() => console.log("[v0] Emoji picker container clicked in table row")}>
                              <EmojiPicker
                                value={task.emoji}
                                onChange={(emoji) => {
                                  console.log("[v0] Emoji changed in table row:", emoji)
                                  updateTaskEmoji(section.id, task.id, emoji)
                                }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center" style={{ width: columnWidths.name }}>
                            {editingTaskId === task.id ? (
                              <Input
                                value={task.name}
                                onChange={(e) => {
                                  const newName = e.target.value
                                  setSections(
                                    sections.map((section) =>
                                      section.id === section.id
                                        ? {
                                            ...section,
                                            tasks: section.tasks.map((t) =>
                                              t.id === task.id ? { ...t, name: newName } : t,
                                            ),
                                          }
                                        : section,
                                    ),
                                  )
                                }}
                                onBlur={() => {
                                  if (task.name.trim()) {
                                    renameTask(section.id, task.id, task.name.trim())
                                  } else {
                                    renameTask(section.id, task.id, "New Task")
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.currentTarget.blur()
                                  }
                                }}
                                autoFocus
                                className="text-sm h-6 px-1 py-0"
                              />
                            ) : (
                              <div
                                className={`text-sm cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded flex-1 ${
                                  task.completed ? "line-through" : ""
                                } ${task.name === "" ? "text-muted-foreground italic" : ""}`}
                                onClick={() => {
                                  if (task.name === "") {
                                    setEditingTaskId(task.id)
                                  }
                                }}
                              >
                                {task.name === "" ? (
                                  <span>Click to add task name...</span>
                                ) : (
                                  <TaskDetailsDialog
                                    taskName={task.name}
                                    taskNotes={task.notes}
                                    taskEmoji={task.emoji}
                                    onUpdateNotes={(notes) => updateTaskNotes(section.id, task.id, notes)}
                                    onUpdateEmoji={(emoji) => updateTaskEmoji(section.id, task.id, emoji)}
                                    onRenameTask={(newName) => renameTask(section.id, task.id, newName)}
                                    onDuplicateTask={() => duplicateTask(section.id, task.id)}
                                    onMarkCompleted={() => markTaskAsCompleted(section.id, task.id)} // Added mark completed
                                    onDeleteTask={() => deleteTask(section.id, task.id)}
                                  >
                                    <span>{task.name}</span>
                                  </TaskDetailsDialog>
                                )}
                              </div>
                            )}
                          </div>

                          {renderTaskColumns(task, section)}
                        </div>
                      ))}
                  </>
                )}
              </>
            )}
          </div>
        ))}

        {/* Update completed tasks section to be collapsible and clickable */}
        {completedTasks.length > 0 && (
          <div className="mb-6">
            <div
              className="flex items-center gap-2 mb-4 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setIsCompletedCollapsed(!isCompletedCollapsed)}
            >
              <div className="bg-green-600 text-white px-3 py-1 rounded text-sm font-medium flex items-center gap-2">
                <span>{isCompletedCollapsed ? "▶" : "▼"}</span>
                <span>COMPLETED</span>
                <span className="bg-white/20 px-2 py-0.5 rounded text-xs">{completedTasks.length}</span>
              </div>
            </div>

            {!isCompletedCollapsed && (
              <>
                {isMobile ? (
                  // Mobile completed tasks
                  <div className="space-y-1">
                    {completedTasks.map((task) => (
                      <TaskDetailsDialog
                        key={task.id}
                        taskName={task.name}
                        taskNotes={task.notes}
                        taskEmoji={task.emoji}
                        isCompleted={true}
                        onUpdateNotes={(notes) => {
                          setCompletedTasks(completedTasks.map((t) => (t.id === task.id ? { ...t, notes } : t)))
                        }}
                        onRenameTask={(newName) => {
                          setCompletedTasks(completedTasks.map((t) => (t.id === task.id ? { ...t, name: newName } : t)))
                        }}
                        onDuplicateTask={() => {
                          const newTask = { ...task, id: Date.now().toString(), name: `${task.name} (copy)` }
                          setCompletedTasks([...completedTasks, newTask])
                        }}
                        onMarkCompleted={() => markTaskAsIncomplete(task.id)} // Changed to markTaskAsIncomplete
                        onDeleteTask={() => setCompletedTasks(completedTasks.filter((t) => t.id !== task.id))}
                      >
                        <div className="p-3 hover:bg-muted/50 border-b border-border/50 opacity-60 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <Checkbox checked={true} disabled />
                            <span className="text-2xl">{task.emoji}</span>
                            <span className="text-sm line-through flex-1">{task.name}</span>
                          </div>
                        </div>
                      </TaskDetailsDialog>
                    ))}
                  </div>
                ) : (
                  // Desktop completed tasks
                  <>
                    <div className="flex gap-1 px-4 py-2 text-sm text-muted-foreground border-b border-border overflow-x-auto">
                      <div style={{ width: columnWidths.checkbox }}>☑️</div>
                      <div style={{ width: columnWidths.emoji }}>😀</div>
                      <div style={{ width: columnWidths.name }}>Name</div>
                      <div style={{ width: columnWidths.status }}>Status</div>
                      <div style={{ width: columnWidths.priority }}>Priority</div>
                      {columnVisibility.progress && <div style={{ width: columnWidths.progress }}>Progress</div>}
                      {columnVisibility.due && <div style={{ width: columnWidths.due }}>Due</div>}
                      {columnVisibility.who && <div style={{ width: columnWidths.who }}>Who</div>}
                    </div>

                    {completedTasks.map((task) => (
                      <TaskDetailsDialog
                        key={task.id}
                        taskName={task.name}
                        taskNotes={task.notes}
                        taskEmoji={task.emoji}
                        isCompleted={true}
                        onUpdateNotes={(notes) => {
                          setCompletedTasks(completedTasks.map((t) => (t.id === task.id ? { ...t, notes } : t)))
                        }}
                        onRenameTask={(newName) => {
                          setCompletedTasks(completedTasks.map((t) => (t.id === task.id ? { ...t, name: newName } : t)))
                        }}
                        onDuplicateTask={() => {
                          const newTask = { ...task, id: Date.now().toString(), name: `${task.name} (copy)` }
                          setCompletedTasks([...completedTasks, newTask])
                        }}
                        onMarkCompleted={() => markTaskAsIncomplete(task.id)} // Changed to markTaskAsIncomplete
                        onDeleteTask={() => setCompletedTasks(completedTasks.filter((t) => t.id !== task.id))}
                      >
                        <div
                          className="flex gap-1 px-4 py-0.75 hover:bg-muted/50 border-b border-border/50 opacity-60 overflow-x-auto cursor-pointer"
                          style={{ minHeight: "32px" }}
                        >
                          <div className="flex items-center" style={{ width: columnWidths.checkbox }}>
                            <Checkbox checked={true} disabled />
                          </div>
                          <div className="flex items-center" style={{ width: columnWidths.emoji }}>
                            <span>{task.emoji}</span>
                          </div>
                          <div className="flex items-center" style={{ width: columnWidths.name }}>
                            <span className="text-sm line-through">{task.name}</span>
                          </div>
                          <div className="flex items-stretch" style={{ width: columnWidths.status }}>
                            <div className="w-full">
                              <StatusDropdown
                                value={task.status}
                                onChange={() => {}} // No-op for completed tasks
                                options={statusOptions}
                                onUpdateOptions={setStatusOptions}
                                fullWidth
                              />
                            </div>
                          </div>
                          <div className="flex items-stretch" style={{ width: columnWidths.priority }}>
                            <div className="w-full">
                              <PriorityDropdown
                                value={task.priority}
                                onChange={() => {}} // No-op for completed tasks
                                options={priorityOptions}
                                onUpdateOptions={setPriorityOptions}
                                fullWidth
                              />
                            </div>
                          </div>
                          {columnVisibility.progress && <div style={{ width: columnWidths.progress }}></div>}
                          {columnVisibility.due && <div style={{ width: columnWidths.due }}></div>}
                          {columnVisibility.who && <div style={{ width: columnWidths.who }}></div>}
                        </div>
                      </TaskDetailsDialog>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
