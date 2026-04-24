'use client'

import { CheckCircle2, Loader2, HelpCircle, XCircle } from 'lucide-react'

type DomainStatus = 'detected' | 'waiting' | 'unchecked' | 'misconfigured'

const STATUS_CONFIG: Record<
  DomainStatus,
  { label: string; className: string; Icon: React.ElementType; spin?: boolean }
> = {
  detected: {
    label: 'Detected',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Icon: CheckCircle2,
  },
  waiting: {
    label: 'Waiting',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Icon: Loader2,
    spin: true,
  },
  unchecked: {
    label: 'Not checked',
    className: 'bg-muted text-muted-foreground border-border',
    Icon: HelpCircle,
  },
  misconfigured: {
    label: 'Misconfigured',
    className: 'bg-red-500/10 text-red-400 border-red-500/20',
    Icon: XCircle,
  },
}

const SIZE_CLASSES = {
  sm: { pill: 'px-2 py-0.5 text-[10px] gap-1', icon: 'h-3 w-3' },
  md: { pill: 'px-2.5 py-1 text-xs gap-1.5', icon: 'h-3.5 w-3.5' },
}

export function DomainStatusPill({
  status,
  size = 'md',
}: {
  status: DomainStatus
  size?: 'sm' | 'md'
}) {
  const { label, className, Icon, spin } = STATUS_CONFIG[status]
  const { pill, icon } = SIZE_CLASSES[size]

  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-flex items-center font-medium rounded-full border ${pill} ${className}`}
    >
      <Icon className={`${icon} ${spin ? 'animate-spin' : ''} flex-shrink-0`} aria-hidden />
      {label}
    </span>
  )
}
