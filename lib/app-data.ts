export interface Task {
  id: string
  name: string
  status: string
  priority: string
  completed: boolean
  notes: string
  emoji: string
  progress: number
  dueDate: string | null
  assignedTo: string
  sectionId?: string
}

export interface TaskSection {
  id: string
  name: string
  tasks: Task[]
  expanded: boolean
}

export interface ColumnVisibility {
  status: boolean
  priority: boolean
  progress: boolean
  due: boolean
  who: boolean
}

export interface OptionItem {
  key: string
  label: string
  color: string
}

export interface AppData {
  appName: string
  appIcon: string
  headerColor: string
  columnVisibility: ColumnVisibility
  columnOrder: string[]
  sections: TaskSection[]
  completedTasks: Task[]
  statusOptions: OptionItem[]
  priorityOptions: OptionItem[]
  users: string[]
}

export const DEFAULT_COLUMN_VISIBILITY: ColumnVisibility = {
  status: true,
  priority: true,
  progress: true,
  due: true,
  who: true,
}

export const DEFAULT_COLUMN_ORDER = ["status", "priority", "progress", "due", "who"]

export function parseStoredDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  const parsed = new Date(value as string)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function serializeTaskDates(task: Task & { dueDate?: Date | string | null }): Task {
  const dueDate =
    task.dueDate instanceof Date
      ? task.dueDate.toISOString()
      : typeof task.dueDate === "string"
        ? task.dueDate
        : null

  return { ...task, dueDate }
}

export function hydrateTaskDates(task: Task): Task & { dueDate: Date | null } {
  return {
    ...task,
    dueDate: parseStoredDate(task.dueDate),
  }
}

export function stripLegacyFields(data: Record<string, unknown>): Record<string, unknown> {
  const { attachments: _attachments, ...rest } = data
  if (Array.isArray(rest.tasks)) {
    rest.tasks = (rest.tasks as Record<string, unknown>[]).map(({ attachments: _a, ...task }) => task)
  }
  if (rest.columnVisibility && typeof rest.columnVisibility === "object") {
    const { attachments: _colAttachments, ...visibility } = rest.columnVisibility as Record<string, unknown>
    rest.columnVisibility = visibility
  }
  if (Array.isArray(rest.columnOrder)) {
    rest.columnOrder = (rest.columnOrder as string[]).filter((col) => col !== "attachments")
  }
  return rest
}
