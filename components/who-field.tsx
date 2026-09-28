"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { User, Plus, Settings, Pencil, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface WhoFieldProps {
  value: string
  onChange: (value: string) => void
  users: string[]
  onAddUser: (user: string) => void
  onRemoveUser: (user: string) => void
  onRenameUser: (oldName: string, newName: string) => void
}

export function WhoField({ value, onChange, users, onAddUser, onRemoveUser, onRenameUser }: WhoFieldProps) {
  const [isManagingUsers, setIsManagingUsers] = useState(false)
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [isRenamingUser, setIsRenamingUser] = useState(false)
  const [newUserName, setNewUserName] = useState("")
  const [renameUserOldName, setRenameUserOldName] = useState("")
  const [renameUserNewName, setRenameUserNewName] = useState("")

  const handleAddUser = () => {
    const trimmed = newUserName.trim()
    if (trimmed && !users.includes(trimmed)) {
      onAddUser(trimmed)
      setNewUserName("")
      setIsAddingUser(false)
    }
  }

  const handleRenameUser = () => {
    const trimmed = renameUserNewName.trim()
    if (trimmed && !users.includes(trimmed) && renameUserOldName) {
      onRenameUser(renameUserOldName, trimmed)
      setRenameUserOldName("")
      setRenameUserNewName("")
      setIsRenamingUser(false)
    }
  }

  const startRenameUser = (userName: string) => {
    setRenameUserOldName(userName)
    setRenameUserNewName(userName)
    setIsRenamingUser(true)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex h-10 w-full items-center justify-start rounded-md border border-border px-2 text-left text-sm font-normal transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-6 sm:border-0 sm:p-1"
          >
            <User className="mr-1 h-3 w-3 flex-shrink-0" />
            <span className="truncate">{value || "Unassigned"}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48" sideOffset={5}>
          <DropdownMenuItem onClick={() => onChange("")}>
            <span className="text-muted-foreground italic">Unassigned</span>
          </DropdownMenuItem>
          {users.length > 0 && <DropdownMenuSeparator />}
          {users.map((user) => (
            <DropdownMenuItem key={user} onClick={() => onChange(user)}>
              <User className="mr-2 h-4 w-4" />
              {user}
            </DropdownMenuItem>
          ))}
          {users.length > 0 && <DropdownMenuSeparator />}
          <DropdownMenuItem onClick={() => setIsManagingUsers(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Manage Users
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isManagingUsers} onOpenChange={setIsManagingUsers}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Users</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No users added yet</p>
            ) : (
              <div className="space-y-2">
                {users.map((user) => (
                  <div key={user} className="flex items-center justify-between p-2 rounded-md border">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="text-sm">{user}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => startRenameUser(user)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => onRemoveUser(user)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setIsManagingUsers(false)
                setIsAddingUser(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New User
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsManagingUsers(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddingUser} onOpenChange={setIsAddingUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-user-name">User Name</Label>
              <Input
                id="new-user-name"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddUser()
                  }
                }}
                placeholder="Enter user name"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingUser(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser} disabled={!newUserName.trim()}>
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRenamingUser} onOpenChange={setIsRenamingUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rename-user-name">New User Name</Label>
              <Input
                id="rename-user-name"
                value={renameUserNewName}
                onChange={(e) => setRenameUserNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRenameUser()
                  }
                }}
                placeholder="Enter new user name"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenamingUser(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameUser} disabled={!renameUserNewName.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
