"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Copy,
  Check,
  Pencil,
  Inbox,
  ExternalLink,
  Globe,
  EyeOff,
} from "lucide-react"

interface AuditQuizListItem {
  id: string
  slug: string
  title: string
  subtitle: string | null
  isPublished: boolean
  brandColor: string | null
  customDomain: string | null
  createdAt: string
  updatedAt: string
  responseCount: number
  lastResponseAt: string | null
}

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function CopyShareLink({ slug }: { slug: string }) {
  const [origin, setOrigin] = useState<string>("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin)
    }
  }, [])

  const link = origin ? `${origin}/q/${slug}` : `/q/${slug}`

  const handleCopy = async () => {
    if (!origin) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore — the user can still copy manually from the field below
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
      title={`Copy ${link}`}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {copied ? "Copied" : "Copy link"}
    </button>
  )
}

function AuditCard({ quiz }: { quiz: AuditQuizListItem }) {
  const accent = quiz.brandColor ?? "#C4972A"

  return (
    <div className="rounded-xl bg-card border border-border p-5 hover:border-primary/30 hover:shadow-sm transition-all duration-200 group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${accent}1a` }}
          >
            <ClipboardIcon color={accent} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {quiz.title}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-mono truncate">
              /q/{quiz.slug}
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
            quiz.isPublished
              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
              : "bg-muted/40 text-muted-foreground border-border"
          }`}
        >
          {quiz.isPublished ? (
            <Globe className="h-2.5 w-2.5" />
          ) : (
            <EyeOff className="h-2.5 w-2.5" />
          )}
          {quiz.isPublished ? "Live" : "Draft"}
        </span>
      </div>

      {quiz.subtitle && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-4">
          {quiz.subtitle}
        </p>
      )}

      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-4">
        <span className="inline-flex items-center gap-1">
          <Inbox className="h-3 w-3" />
          {quiz.responseCount} {quiz.responseCount === 1 ? "response" : "responses"}
        </span>
        <span aria-hidden="true">·</span>
        <span>Last: {formatDate(quiz.lastResponseAt)}</span>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3 -mx-1 px-1">
        <div className="flex items-center gap-1">
          <Link
            href={`/portal/audits/${quiz.id}`}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Link>
          <Link
            href={`/portal/audits/${quiz.id}/responses`}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
          >
            <Inbox className="h-3.5 w-3.5" />
            Responses
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <CopyShareLink slug={quiz.slug} />
          <a
            href={`/q/${quiz.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
            title="Open public link"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  )
}

function ClipboardIcon({ color }: { color: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="m9 14 2 2 4-4" />
    </svg>
  )
}

interface AuditsListClientProps {
  quizzes: AuditQuizListItem[]
}

export function AuditsListClient({ quizzes }: AuditsListClientProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {quizzes.map((quiz) => (
        <AuditCard key={quiz.id} quiz={quiz} />
      ))}
    </div>
  )
}
