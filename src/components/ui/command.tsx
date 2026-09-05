"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Search, Command as CommandIcon, X } from "lucide-react"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  placeholder?: string
  searchPlaceholder?: string
  groups: {
    label: string
    items: {
      id: string
      label: string
      description?: string
      icon?: React.ReactNode
      shortcut?: string
      onSelect: () => void
    }[]
  }[]
  emptyMessage?: string
  className?: string
}

function CommandPalette({
  open,
  onOpenChange,
  placeholder = "Type a command...",
  searchPlaceholder = "Search...",
  groups,
  emptyMessage = "No results found.",
  className,
}: CommandPaletteProps) {
  const [search, setSearch] = React.useState("")
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const filteredGroups = React.useMemo(() => {
    if (!search) return groups

    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.label.toLowerCase().includes(search.toLowerCase()) ||
            item.description?.toLowerCase().includes(search.toLowerCase())
        ),
      }))
      .filter((group) => group.items.length > 0)
  }, [groups, search])

  const allItems = React.useMemo(
    () => filteredGroups.flatMap((group) => group.items),
    [filteredGroups]
  )

  React.useEffect(() => {
    if (open) {
      setSearch("")
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  React.useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex((i) => Math.min(i + 1, allItems.length - 1))
          break
        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex((i) => Math.max(i - 1, 0))
          break
        case "Enter":
          e.preventDefault()
          if (allItems[selectedIndex]) {
            allItems[selectedIndex].onSelect()
            onOpenChange(false)
          }
          break
        case "Escape":
          onOpenChange(false)
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, allItems, selectedIndex, onOpenChange])

  if (!open) return null

  let globalIndex = 0

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="fixed inset-0 flex items-start justify-center pt-[20vh]">
        <div
          className={cn(
            "w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl",
            className
          )}
        >
          <div className="flex items-center border-b border-slate-200 px-4">
            <CommandIcon className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-12 w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="ml-2 rounded-md p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="max-h-[300px] overflow-y-auto p-2">
            {filteredGroups.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-500">
                {emptyMessage}
              </div>
            ) : (
              filteredGroups.map((group) => (
                <div key={group.label}>
                  <p className="px-2 py-1.5 text-xs font-medium text-slate-500">
                    {group.label}
                  </p>
                  {group.items.map((item) => {
                    const currentIndex = globalIndex++
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          item.onSelect()
                          onOpenChange(false)
                        }}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm outline-none transition-colors",
                          currentIndex === selectedIndex
                            ? "bg-slate-100 text-slate-900"
                            : "text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        {item.icon && (
                          <span className="text-slate-400">{item.icon}</span>
                        )}
                        <div className="flex-1 text-left">
                          <p className="font-medium">{item.label}</p>
                          {item.description && (
                            <p className="text-xs text-slate-500">
                              {item.description}
                            </p>
                          )}
                        </div>
                        {item.shortcut && (
                          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-slate-200 bg-slate-100 px-1.5 font-mono text-[10px] font-medium text-slate-600">
                            {item.shortcut}
                          </kbd>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export { CommandPalette }
