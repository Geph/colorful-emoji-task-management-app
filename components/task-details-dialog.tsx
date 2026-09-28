"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RichTextEditor } from "@/components/rich-text-editor"
import { Copy, Edit3, CheckCircle, Trash2 } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface TaskDetailsDialogProps {
  taskName: string
  taskNotes: string
  taskEmoji?: string
  isCompleted?: boolean
  onUpdateNotes: (notes: string) => void
  onRenameTask: (newName: string) => void
  onDuplicateTask: () => void
  onMarkCompleted: () => void
  onDeleteTask: () => void
  children: React.ReactNode
}

export function TaskDetailsDialog({
  taskName,
  taskNotes,
  taskEmoji = "📝",
  isCompleted = false,
  onUpdateNotes,
  onRenameTask,
  onDuplicateTask,
  onMarkCompleted,
  onDeleteTask,
  children,
}: TaskDetailsDialogProps) {
  const [notes, setNotes] = useState(taskNotes)
  const [isOpen, setIsOpen] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [newTaskName, setNewTaskName] = useState(taskName)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const isMobile = useIsMobile()

  useEffect(() => {
    setNewTaskName(taskName)
  }, [taskName])

  const handleSave = () => {
    onUpdateNotes(notes)
    const trimmedName = newTaskName.trim()
    if (trimmedName && trimmedName !== taskName) {
      onRenameTask(trimmedName)
    }
    setIsOpen(false)
    setIsRenaming(false)
  }

  const handleCancel = () => {
    setNotes(taskNotes)
    setNewTaskName(taskName)
    setIsRenaming(false)
    setIsOpen(false)
  }

  const handleDuplicate = () => {
    onDuplicateTask()
    setIsOpen(false)
  }

  const handleMarkCompleted = () => {
    onMarkCompleted()
    setIsOpen(false)
  }

  const handleDelete = () => {
    onDeleteTask()
    setIsOpen(false)
    setShowDeleteConfirm(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="max-h-[90vh] w-full max-w-[calc(100vw-1rem)] gap-3 overflow-y-auto p-4 sm:max-h-[95vh] sm:w-[75vw] sm:max-w-[1200px] sm:gap-4 sm:p-6"
        showCloseButton={false}
      >
        <DialogHeader className="relative">
          <div className="flex items-start gap-2 sm:items-center sm:gap-3">
            <div className="flex-none pt-0.5 text-2xl leading-none">{taskEmoji}</div>
            {isRenaming ? (
              <Input
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                className="h-11 flex-1 text-lg font-semibold sm:h-10"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setIsRenaming(false)
                  }
                  if (e.key === "Escape") {
                    setNewTaskName(taskName)
                    setIsRenaming(false)
                  }
                }}
                autoFocus
              />
            ) : (
              <>
                <DialogTitle className="min-w-0 flex-1 break-words text-left leading-snug">{newTaskName}</DialogTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Rename task"
                  onClick={() => setIsRenaming(true)}
                  className="h-9 w-9 flex-none sm:h-7 sm:w-7"
                >
                  <Edit3 className="h-4 w-4 sm:h-3 sm:w-3" />
                </Button>
              </>
            )}
          </div>
        </DialogHeader>
        <div className="space-y-4">
          <RichTextEditor value={notes} onChange={setNotes} placeholder="Add notes for this task..." />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-2">
              <Button
                variant="outline"
                onClick={handleDuplicate}
                className="h-11 flex-col gap-1 bg-transparent px-2 text-xs sm:h-10 sm:flex-row sm:gap-2 sm:px-4 sm:text-sm"
              >
                <Copy className="h-4 w-4" />
                Duplicate
              </Button>
              <Button
                onClick={handleMarkCompleted}
                className={`h-11 flex-col gap-1 px-2 text-xs text-white sm:h-10 sm:flex-row sm:gap-2 sm:px-4 sm:text-sm ${
                  isCompleted ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                <CheckCircle className="h-4 w-4" />
                {isCompleted ? (isMobile ? "Reopen" : "Set to Incomplete") : "Complete"}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className="h-11 flex-col gap-1 px-2 text-xs sm:h-10 sm:flex-row sm:gap-2 sm:px-4 sm:text-sm"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel} className="h-11 flex-1 sm:h-10 sm:flex-none">
                Cancel
              </Button>
              <Button onClick={handleSave} className="h-11 flex-1 sm:h-10 sm:flex-none">
                Save
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{taskName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className={cn(buttonVariants({ variant: "destructive" }))}
            >
              Delete Task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
