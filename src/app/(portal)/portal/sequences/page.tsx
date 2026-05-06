import Link from "next/link"
import { Send, Plus, Users, Pause, Play, FileText } from "lucide-react"
import { db } from "@/lib/db"
import { ensureDbUser } from "@/lib/auth/ensure-user"
import { NewSequenceButton } from "./NewSequenceButton"

export const metadata = { title: "Email Sequences" }
export const dynamic = "force-dynamic"

const STATUS_BADGE: Record<string, { label: string; className: string; Icon: typeof Pause }> = {
  draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground border-border",
    Icon: FileText,
  },
  active: {
    label: "Active",
    className: "bg-primary/10 text-primary border-primary/30",
    Icon: Play,
  },
  paused: {
    label: "Paused",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    Icon: Pause,
  },
}

export default async function SequencesIndexPage() {
  const dbUser = await ensureDbUser()

  const sequences = await db.emailSequence.findMany({
    where: { userId: dbUser.id },
    include: {
      _count: { select: { steps: true, enrollments: true } },
    },
    orderBy: { updatedAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Send className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Email Sequences
            </h1>
            <p className="text-sm text-muted-foreground">
              Build a multi-step sequence once, run it across every lead.
              Auto-pauses on reply.
            </p>
          </div>
        </div>
        <NewSequenceButton />
      </div>

      {sequences.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <Send className="h-7 w-7 text-primary/60" />
          </div>
          <p className="font-semibold text-foreground mb-1">
            No sequences yet
          </p>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            Spin up your first multi-step email sequence — the bridge between
            &ldquo;I have 200 leads&rdquo; and &ldquo;I have 20 booked
            calls.&rdquo;
          </p>
          <NewSequenceButton label="Create your first sequence" />
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="hidden sm:grid grid-cols-12 px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/20 border-b border-border">
            <div className="col-span-5">Name</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Steps</div>
            <div className="col-span-2">Enrolled</div>
            <div className="col-span-1 text-right">Open</div>
          </div>
          <div className="divide-y divide-border">
            {sequences.map((s) => {
              const status = STATUS_BADGE[s.status] ?? STATUS_BADGE.draft
              const Icon = status.Icon
              return (
                <Link
                  key={s.id}
                  href={`/portal/sequences/${s.id}`}
                  className="grid grid-cols-2 sm:grid-cols-12 gap-2 px-5 py-3.5 text-sm hover:bg-muted/20 transition-colors items-center"
                >
                  <div className="col-span-2 sm:col-span-5">
                    <p className="font-semibold text-foreground truncate">
                      {s.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Updated{" "}
                      {new Date(s.updatedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${status.className}`}
                    >
                      <Icon className="h-3 w-3" />
                      {status.label}
                    </span>
                  </div>
                  <div className="col-span-1 sm:col-span-2 text-xs text-muted-foreground">
                    {s._count.steps} step{s._count.steps === 1 ? "" : "s"}
                  </div>
                  <div className="col-span-1 sm:col-span-2 text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {s._count.enrollments}
                  </div>
                  <div className="hidden sm:flex col-span-1 items-center justify-end text-muted-foreground">
                    <Plus className="h-3 w-3 rotate-45" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
