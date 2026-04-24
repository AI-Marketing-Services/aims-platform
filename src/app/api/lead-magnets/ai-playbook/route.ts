import { NextResponse } from "next/server"
import { z } from "zod"
import { generateAIPlaybookPDF } from "@/lib/pdf/generate"
import { sendAIPlaybookEmail } from "@/lib/email/ai-playbook"
import { createLeadMagnetSubmission } from "@/lib/db/queries"
import { formRatelimit, getIp } from "@/lib/ratelimit"
import { db } from "@/lib/db"
import { notifyNewLead } from "@/lib/notifications"
import { createCloseLead } from "@/lib/close"
import { queueEmailSequence } from "@/lib/email/queue"
import { getValidatedAttributionResellerId } from "@/lib/tenant/attribution"
import { logger } from "@/lib/logger"

const submitSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  source: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
})

/**
 * POST /api/lead-magnets/ai-playbook
 * Captures lead, generates PDF, emails it as attachment, creates CRM deal.
 */
export async function POST(req: Request) {
  if (formRatelimit) {
    const { success } = await formRatelimit.limit(getIp(req))
    if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  try {
    const body = await req.json()
    const parsed = submitSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { email, name, company, phone, source, utmSource, utmMedium, utmCampaign } = parsed.data

    // Create lead magnet submission
    const submission = await createLeadMagnetSubmission({
      type: "AI_PLAYBOOK",
      email,
      name,
      company,
      phone,
      data: { downloadType: "ai-operating-system-playbook" },
      source,
      utmSource,
      utmMedium,
      utmCampaign,
    })

    // Score: playbook downloads are warm - content-stage lead with clear interest
    const leadScore = 68
    const tier = "warm" as const
    const priority = "MEDIUM" as const
    const reason = "AI Operating System Playbook downloaded - content-stage lead, strong AI interest signal"

    // Check attribution cookie — if this visitor arrived via a reseller's
    // whitelabel page within the last 30 days, credit them for the lead.
    const referringResellerId = await getValidatedAttributionResellerId(db)

    // Create deal
    const deal = await db.deal.create({
      data: {
        contactName: name ?? email.split("@")[0],
        contactEmail: email,
        company,
        phone,
        referringResellerId,
        source: "ai-playbook",
        sourceDetail: `Score: ${leadScore}/100 (${tier}). ${reason}${referringResellerId ? " [attributed via cookie]" : ""}`,
        channelTag: referringResellerId ? "reseller" : (utmSource ?? "organic"),
        utmSource,
        utmMedium,
        utmCampaign,
        value: 0,
        leadScore,
        leadScoreTier: tier,
        leadScoreReason: reason,
        priority,
        stage: "APPLICATION_SUBMITTED",
        activities: {
          create: {
            type: "FORM_SUBMITTED",
            detail: `AI Playbook downloaded. Score: ${leadScore}/100 (${tier}). ${reason}`,
          },
        },
      },
    }).catch((e) => { logger.error("Failed to create deal from AI playbook download", e); return null })

    if (deal) {
      await db.leadMagnetSubmission.update({
        where: { id: submission.id },
        data: { convertedToDeal: true, dealId: deal.id },
      }).catch((e) => logger.error("Failed to link AI playbook submission to deal", e))

      // Notify team
      notifyNewLead({
        contactName: name ?? email,
        contactEmail: email,
        company,
        source: "ai-playbook",
        channelTag: utmSource,
      }).catch((e) => logger.error("Failed to notify new lead", e))

      // Sync to Close CRM
      createCloseLead({
        contactName: name ?? email,
        contactEmail: email,
        company,
        phone,
        source: "ai-playbook",
        dealId: deal.id,
      }).then((closeLeadId) => {
        if (closeLeadId) {
          db.deal.update({ where: { id: deal.id }, data: { closeLeadId } }).catch((e) => logger.error("Failed to update deal with closeLeadId", e))
        }
      }).catch((e) => logger.error("Failed to sync AI playbook lead to Close CRM", e))
    }

    // Generate PDF and send email (in parallel)
    const pdfBuffer = await generateAIPlaybookPDF()

    await sendAIPlaybookEmail({
      to: email,
      name: name ?? "",
      pdfBuffer,
    }).catch((e) => logger.error("Failed to send AI playbook email", e))

    // Queue follow-up nurture sequence (reuse post-quiz sequence for now)
    await queueEmailSequence(email, "post-quiz", {
      name,
      score: undefined,
    }).catch((e) => logger.error("Failed to queue AI playbook email sequence", e))

    return NextResponse.json(
      { id: submission.id, message: "Playbook sent to your email" },
      { status: 201 }
    )
  } catch (err) {
    logger.error("AI playbook submission failed", err, { endpoint: "POST /api/lead-magnets/ai-playbook" })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

/**
 * GET /api/lead-magnets/ai-playbook
 * Direct PDF download (no email capture required).
 * Useful for existing leads or direct links.
 */
export async function GET() {
  try {
    const pdfBuffer = await generateAIPlaybookPDF()

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=AIMS-AI-Operating-System-Playbook.pdf",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    })
  } catch (err) {
    logger.error("AI playbook PDF generation failed", err)
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })
  }
}
