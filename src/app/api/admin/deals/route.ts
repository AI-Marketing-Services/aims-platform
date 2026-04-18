import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

const schema = z.object({
  firstName: z.string().trim().min(1, "First name required").max(60),
  lastName: z.string().trim().max(60).optional().default(""),
  email: z.string().email("Valid email required"),
  phone: z.string().trim().max(40).optional().nullable(),
  company: z.string().trim().max(120).optional().nullable(),
  source: z.string().trim().max(60).optional().default("manual"),
  stage: z
    .enum([
      "APPLICATION_SUBMITTED",
      "CONSULT_BOOKED",
      "CONSULT_COMPLETED",
      "MIGHTY_INVITED",
      "MEMBER_JOINED",
    ])
    .optional()
    .default("APPLICATION_SUBMITTED"),
})

/**
 * Manually create a Deal in the CRM. Used by the admin UI when an
 * applicant has to be added by hand — e.g. they reached out via DM,
 * referral, or some channel that bypasses the marketing-site application
 * form. Dedupes on email so the same person can't be added twice.
 */
export async function POST(req: Request) {
  const { userId, sessionClaims } = await auth()
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { firstName, lastName, email, phone, company, source, stage } = parsed.data
  const trimmedEmail = email.trim().toLowerCase()
  const contactName = [firstName, lastName].filter(Boolean).join(" ").trim()

  try {
    // Dedup by email — if a deal already exists, return it instead of
    // creating a duplicate. The admin can keep editing the existing one.
    const existing = await db.deal.findFirst({
      where: { contactEmail: trimmedEmail },
      orderBy: { createdAt: "desc" },
    })
    if (existing) {
      return NextResponse.json(
        {
          ok: true,
          duplicate: true,
          deal: { id: existing.id, contactEmail: existing.contactEmail },
        },
        { status: 200 }
      )
    }

    const deal = await db.deal.create({
      data: {
        contactName,
        contactEmail: trimmedEmail,
        phone: phone ?? null,
        company: company ?? null,
        stage,
        source,
        sourceDetail: "Created manually from admin UI",
        assignedTo: userId,
      },
    })

    // Use FORM_SUBMITTED as the activity type — semantically closest
    // to "this person entered the funnel via a form-style intake",
    // with the detail/metadata making it clear it was an admin
    // hand-add rather than a marketing-site submission.
    await db.dealActivity.create({
      data: {
        dealId: deal.id,
        type: "FORM_SUBMITTED",
        detail: `Manually added to CRM by admin (${trimmedEmail})`,
        authorId: userId,
        metadata: { method: "admin-manual", stage },
      },
    })

    logger.info(`Deal created manually: ${deal.id} (${trimmedEmail}) by ${userId}`, {
      action: "admin_deal_create_manual",
    })

    return NextResponse.json(
      { ok: true, deal: { id: deal.id, contactName, contactEmail: trimmedEmail } },
      { status: 201 }
    )
  } catch (err) {
    logger.error(`Manual deal create failed for ${trimmedEmail}`, err)
    const message = err instanceof Error ? err.message : "Failed to create deal"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
