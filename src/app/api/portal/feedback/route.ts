import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { z } from "zod"
import { put } from "@vercel/blob"
import { randomUUID } from "crypto"
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

// Screenshot validation. Keep narrower than the onboarding uploader —
// feedback screenshots are casual phone/desktop captures, no need for
// SVG or animated GIF. Cap size at 5 MB which is generous for a PNG of
// a 4K display.
const SCREENSHOT_ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
])
const SCREENSHOT_MAX_BYTES = 5 * 1024 * 1024 // 5 MB

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

  // Branch on content type — multipart for the screenshot path, JSON for
  // legacy (no-attachment) submissions. Keeps existing JSON callers working
  // and avoids forcing every text-only feedback through a FormData encode.
  const contentType = req.headers.get("content-type") ?? ""
  const isMultipart = contentType.toLowerCase().startsWith("multipart/form-data")

  let payload: z.infer<typeof feedbackSchema>
  let screenshot: File | null = null

  if (isMultipart) {
    let form: FormData
    try {
      form = await req.formData()
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
    }
    const parsed = feedbackSchema.safeParse({
      category: form.get("category") ?? undefined,
      title: form.get("title") ?? undefined,
      details: form.get("details") ?? undefined,
      pageUrl: form.get("pageUrl") ?? undefined,
      userAgent: form.get("userAgent") ?? undefined,
    })
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", issues: parsed.error.issues },
        { status: 400 },
      )
    }
    payload = parsed.data
    const file = form.get("screenshot")
    if (file instanceof File && file.size > 0) {
      screenshot = file
    }
  } else {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }
    const parsed = feedbackSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", issues: parsed.error.issues },
        { status: 400 },
      )
    }
    payload = parsed.data
  }

  // Validate screenshot before doing any work that we'd have to roll back.
  if (screenshot) {
    if (!SCREENSHOT_ALLOWED_TYPES.has(screenshot.type)) {
      return NextResponse.json(
        {
          error:
            "Screenshot must be PNG, JPEG, or WebP. Other formats aren't supported.",
        },
        { status: 400 },
      )
    }
    if (screenshot.size > SCREENSHOT_MAX_BYTES) {
      return NextResponse.json(
        { error: "Screenshot exceeds 5 MB. Crop or compress and try again." },
        { status: 400 },
      )
    }
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

  // Upload screenshot to Vercel Blob BEFORE writing the DB row, so a
  // failed upload doesn't leave an orphan feedback record claiming a
  // screenshot that doesn't exist. If the upload fails we still create
  // the feedback row (without the image) — better to capture the text
  // than to drop the whole report.
  let screenshotUrl: string | null = null
  if (screenshot) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      logger.warn(
        "Feedback screenshot supplied but BLOB_READ_WRITE_TOKEN not configured",
        {
          endpoint: "POST /api/portal/feedback",
          userId: dbUser.id,
        },
      )
      // Don't fail — text-only feedback still has value. Just no image.
    } else {
      const ext =
        screenshot.type === "image/png"
          ? "png"
          : screenshot.type === "image/jpeg"
            ? "jpg"
            : "webp"
      try {
        const blob = await put(
          `feedback/${dbUser.id}/${randomUUID()}.${ext}`,
          screenshot,
          { access: "public", contentType: screenshot.type },
        )
        screenshotUrl = blob.url
      } catch (blobErr) {
        logger.error("Feedback screenshot upload failed", blobErr, {
          endpoint: "POST /api/portal/feedback",
          userId: dbUser.id,
        })
        // Same fall-through — keep the report, lose the image.
      }
    }
  }

  try {
    const record = await db.portalFeedback.create({
      data: {
        reporterId: dbUser.id,
        reporterEmail,
        reporterName,
        category: payload.category,
        title: payload.title,
        details: payload.details,
        pageUrl: payload.pageUrl ?? null,
        userAgent: payload.userAgent ?? null,
        screenshotUrl,
        status: "NEW",
      },
      select: { id: true },
    })

    // Fire-and-forget Slack/email/in-app fanout. Failures here must never
    // block the user-facing 200 — the row is already saved.
    notifyPortalFeedback({
      feedbackId: record.id,
      category: payload.category,
      title: payload.title,
      reporterName,
      reporterEmail,
      pageUrl: payload.pageUrl ?? null,
    }).catch((err) =>
      logger.error("Failed to fan out portal feedback notification", err, {
        endpoint: "POST /api/portal/feedback",
        action: record.id,
      }),
    )

    return NextResponse.json({ ok: true, id: record.id, screenshotUrl })
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
