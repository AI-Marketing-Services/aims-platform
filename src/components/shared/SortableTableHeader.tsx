"use client"

import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SortableTableHeaderProps {
  label: string
  field: string
  currentSort: string
  currentDir: "asc" | "desc"
  onSort: (field: string) => void
  className?: string
}

export function SortableTableHeader({
  label,
  field,
  currentSort,
  currentDir,
  onSort,
  className,
}: SortableTableHeaderProps) {
  const isActive = currentSort === field

  return (
    <th
      onClick={() => onSort(field)}
      className={cn(
        "text-left text-xs text-muted-foreground font-medium px-4 py-3 whitespace-nowrap cursor-pointer hover:text-foreground select-none transition-colors",
        className
      )}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive ? (
          currentDir === "asc" ? (
            <ChevronUp className="w-3 h-3 text-foreground" />
          ) : (
            <ChevronDown className="w-3 h-3 text-foreground" />
          )
        ) : (
          <ChevronsUpDown className="w-3 h-3 opacity-30" />
        )}
      </span>
    </th>
  )
}
