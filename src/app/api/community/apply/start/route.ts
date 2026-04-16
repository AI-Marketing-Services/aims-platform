import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { formRatelimit, getIp } from "@/lib/ratelimit"
import { logger } from "@/lib/logger"

/**
 * POST /api/community/apply/start
 * Captures step-1 (name + email) submissions so we can follow up with
 * anyone who starts the apply form but doesn't finish. Fires from the
 * client when the applicant first advances past the name+email step.
 */

const schema = z.object({
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  email: z.string().email().max(180),
  source: z.string().max(60).optional(),
  utmSource: z.string().max(60).optional(),
  utmMedium: z.string().max(60).optional(),
  utmCampaign: z.string().max(60).optional(),
})

export async function POST(req: Request) {
  if (formRatelimit) {
    const { success } = await formRatelimit.limit(getIp(req))
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }
  }

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { firstName, lastName, email, source, utmSource, utmMedium, utmCampaign } = parsed.data
    const normalizedEmail = email.trim().toLowerCase()

    // Dedup within last 24h for the same email
    const recent = await db.partialApplication.findFirst({
      where: {
        email: normalizedEmail,
        createdAt: { gte: new Date(Date.now() - 24 * 3600_000) },
      },
      orderBy: { createdAt: "desc" },
    })

    if (recent) {
      // Refresh updatedAt so we can still identify them as an active session
      await db.partialApplication.update({
        where: { id: recent.id },
        data: { firstName: firstName.trim(), lastName: lastName.trim() },
      })
      return NextResponse.json({ ok: true, id: recent.id, existing: true })
    }

    const record = await db.partialApplication.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
        source: source ?? "apply-form",
        utmSource,
        utmMedium,
        utmCampaign,
        userAgent: req.headers.get("user-agent") ?? undefined,
        ip: getIp(req),
      },
    })

    return NextResponse.json({ ok: true, id: record.id }, { status: 201 })
  } catch (err) {
    logger.error("Partial application save failed", err, {
      endpoint: "POST /api/community/apply/start",
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
