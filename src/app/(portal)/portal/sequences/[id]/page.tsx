import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Send } from "lucide-react"
import { db } from "@/lib/db"
import { ensureDbUser } from "@/lib/auth/ensure-user"
import { SequenceEditor } from "./SequenceEditor"

export const dynamic = "force-dynamic"

export default async function SequenceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const dbUser = await ensureDbUser()
  const { id } = await params

  const sequence = await db.emailSequence.findFirst({
    where: { id, userId: dbUser.id },
    include: {
      steps: { orderBy: { order: "asc" } },
      enrollments: {
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          recipientEmail: true,
          recipientName: true,
          currentStep: true,
          status: true,
          nextSendAt: true,
          lastStepSentAt: true,
          repliedAt: true,
        },
      },
    },
  })
  if (!sequence) notFound()

  return (
    <div className="space-y-6">
      <Link
        href="/portal/sequences"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-3 w-3" />
        All sequences
      </Link>

      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Send className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{sequence.name}</h1>
          <p className="text-sm text-muted-foreground">
            {sequence.steps.length} step{sequence.steps.length === 1 ? "" : "s"} · Status: {sequence.status}
          </p>
        </div>
      </div>

      <SequenceEditor
        sequence={{
          id: sequence.id,
          name: sequence.name,
          status: sequence.status,
          fromName: sequence.fromName,
          pauseOnReply: sequence.pauseOnReply,
          steps: sequence.steps.map((s) => ({
            id: s.id,
            order: s.order,
            delayDays: s.delayDays,
            subject: s.subject,
            body: s.body,
          })),
          enrollments: sequence.enrollments.map((e) => ({
            ...e,
            nextSendAt: e.nextSendAt?.toISOString() ?? null,
            lastStepSentAt: e.lastStepSentAt?.toISOString() ?? null,
            repliedAt: e.repliedAt?.toISOString() ?? null,
          })),
        }}
      />
    </div>
  )
}
