import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { getOrCreateDbUserByClerkId } from "@/lib/auth/ensure-user"
import { notifyPortalFeedback } from "@/lib/notifications"
import { formRatelimit, rateLimitedResponse } from "@/lib/ratelimit"

const feedbackSchema = z.object({
  category: z.enum(["BUG", "IDEA", "QUESTION", "OTHER"]).default("BUG"),
  title: z.string().trim().min(1).max(140),
  details: z.string().trim().min(1).max(4000),
  pageUrl: z.string().trim().max(500).optional(),
  userAgent: z.string().trim().max(500).optional(),
})

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Rate-limit per user. Prevents an authenticated tester (or compromised
  // session) from filling the PortalFeedback table with 4000-char rows.
  // 5 submissions per minute is plenty even for a fast-clicking tester.
  if (formRatelimit) {
    const { success } = await formRatelimit.limit(`feedback:${clerkId}`)
    if (!success) return rateLimitedResponse(req, "POST /api/portal/feedback", clerkId)
  }

  let parsed
  try {
    parsed = feedbackSchema.safeParse(await req.json())
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const dbUser = await getOrCreateDbUserByClerkId(clerkId)
  const cu = await currentUser()
  const reporterEmail =
    cu?.emailAddresses?.[0]?.emailAddress ?? dbUser.email ?? "unknown"
  const reporterName =
    [cu?.firstName, cu?.lastName].filter(Boolean).join(" ") ||
    cu?.fullName ||
    dbUser.name ||
    null

  try {
    const record = await db.portalFeedback.create({
      data: {
        reporterId: dbUser.id,
        reporterEmail,
        reporterName,
        category: parsed.data.category,
        title: parsed.data.title,
        details: parsed.data.details,
        pageUrl: parsed.data.pageUrl ?? null,
        userAgent: parsed.data.userAgent ?? null,
        status: "NEW",
      },
      select: { id: true },
    })

    // Fire-and-forget Slack/email/in-app fanout. Failures here must never
    // block the user-facing 200 — the row is already saved.
    notifyPortalFeedback({
      feedbackId: record.id,
      category: parsed.data.category,
      title: parsed.data.title,
      reporterName,
      reporterEmail,
      pageUrl: parsed.data.pageUrl ?? null,
    }).catch((err) =>
      logger.error("Failed to fan out portal feedback notification", err, {
        endpoint: "POST /api/portal/feedback",
        action: record.id,
      }),
    )

    return NextResponse.json({ ok: true, id: record.id })
  } catch (err) {
    logger.error("Failed to save portal feedback", err, {
      endpoint: "POST /api/portal/feedback",
      userId: dbUser.id,
    })
    return NextResponse.json(
      { error: "Could not save feedback right now — try again in a minute." },
      { status: 500 },
    )
  }
}
