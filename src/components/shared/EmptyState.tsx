import Link from "next/link"
import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-4">
        <Icon className="h-6 w-6 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mt-1">{description}</p>
      {action && (
        <div className="mt-5">
          {action.href ? (
            <Link
              href={action.href}
              className="bg-[#DC2626] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#B91C1C] transition-colors"
            >
              {action.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              className="bg-[#DC2626] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#B91C1C] transition-colors"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}