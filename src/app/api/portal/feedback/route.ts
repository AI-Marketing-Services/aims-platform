import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { z } from "zod"
import { sendTrackedEmail } from "@/lib/email"
import { AIMS_FROM_EMAIL, AIMS_REPLY_TO } from "@/lib/email/senders"
import { logger } from "@/lib/logger"

const feedbackSchema = z.object({
  category: z.enum(["BUG", "IDEA", "QUESTION", "OTHER"]).default("BUG"),
  title: z.string().trim().min(1).max(140),
  details: z.string().trim().min(1).max(4000),
  pageUrl: z.string().trim().max(500).optional(),
  userAgent: z.string().trim().max(500).optional(),
})

const RECIPIENT = "adamwolfe100@gmail.com"

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let parsed
  try {
    const body = await req.json()
    parsed = feedbackSchema.safeParse(body)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const cu = await currentUser()
  const reporterEmail = cu?.emailAddresses?.[0]?.emailAddress ?? "unknown"
  const reporterName =
    [cu?.firstName, cu?.lastName].filter(Boolean).join(" ") || cu?.fullName || "(no name)"

  const { category, title, details, pageUrl, userAgent } = parsed.data

  const subject = `[Portal Feedback · ${category}] ${title}`
  const text = [
    `Reporter: ${reporterName} <${reporterEmail}>`,
    `Category: ${category}`,
    pageUrl ? `Page: ${pageUrl}` : null,
    userAgent ? `User-Agent: ${userAgent}` : null,
    "",
    title,
    "",
    details,
  ]
    .filter((l) => l !== null)
    .join("\n")

  try {
    await sendTrackedEmail({
      from: AIMS_FROM_EMAIL,
      replyTo: reporterEmail !== "unknown" ? reporterEmail : AIMS_REPLY_TO,
      to: RECIPIENT,
      subject,
      text,
      serviceArm: "portal-feedback",
    })
  } catch (err) {
    logger.error("Failed to email portal feedback", err, { userId })
    return NextResponse.json(
      { error: "Could not deliver feedback right now — try again in a minute." },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}
