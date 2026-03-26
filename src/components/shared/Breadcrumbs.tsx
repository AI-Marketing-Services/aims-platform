"use client"

import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-1.5 text-sm mb-4", className)}
    >
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none rounded"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1
        return (
          <span key={`${item.label}-${idx}`} className="flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
            {isLast || !item.href ? (
              <span className={cn(
                "font-medium truncate max-w-[200px]",
                isLast ? "text-foreground" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[200px] focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none rounded"
              >
                {item.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
