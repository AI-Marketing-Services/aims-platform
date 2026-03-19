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
    red: "bg-primary/10 text-primary border-primary/20",
    green: "bg-primary/10 text-primary border-primary/20",
    blue: "bg-primary/10 text-primary border-primary/20",
    orange: "bg-primary/10 text-primary border-primary/20",
    purple: "bg-primary/10 text-primary border-primary/20",
  }

  return (
    <div className={cn(centered && "text-center", className)}>
      {badge && (
        <div className={cn(centered && "flex justify-center", "mb-4")}>
          <span
            className={cn(
              "eyebrow inline-block rounded-full border px-3 py-1",
              badgeColors[badgeColor] ?? badgeColors.red
            )}
          >
            // {badge}
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
