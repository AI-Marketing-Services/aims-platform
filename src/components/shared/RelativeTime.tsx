"use client"

import { formatDistanceToNow } from "date-fns"
import { formatDate } from "@/lib/utils"

interface RelativeTimeProps {
  date: string | Date
  className?: string
}

export function RelativeTime({ date, className }: RelativeTimeProps) {
  const dateObj = typeof date === "string" ? new Date(date) : date
  const absolute = formatDate(dateObj)
  const relative = formatDistanceToNow(dateObj, { addSuffix: true })

  return (
    <time dateTime={dateObj.toISOString()} title={absolute} className={className}>
      {relative}
    </time>
  )
}
