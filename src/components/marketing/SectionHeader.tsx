import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  badge?: string
  badgeColor?: string
  heading: string
  subheading?: string
  centered?: boolean
  className?: string
}

export function SectionHeader({
  badge,
  badgeColor = "red",
  heading,
  subheading,
  centered = true,
  className,
}: SectionHeaderProps) {
  const badgeColors: Record<string, string> = {
    red: "bg-red-50 text-red-700 border-red-200",
    green: "bg-green-50 text-green-700 border-green-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  }

  return (
    <div className={cn(centered && "text-center", className)}>
      {badge && (
        <div className={cn(centered && "flex justify-center", "mb-4")}>
          <span
            className={cn(
              "inline-block rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider",
              badgeColors[badgeColor] ?? badgeColors.red
            )}
          >
            {badge}
          </span>
        </div>
      )}
      <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
        {heading}
      </h2>
      {subheading && (
        <p className={cn("mt-4 text-lg text-muted-foreground", centered && "mx-auto max-w-2xl")}>
          {subheading}
        </p>
      )}
    </div>
  )
}
