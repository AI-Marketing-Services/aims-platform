import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { getOrCreateDbUserByClerkId } from "@/lib/auth/ensure-user"

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
