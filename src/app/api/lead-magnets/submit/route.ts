import { NextResponse } from "next/server"
import { z } from "zod"
import { createLeadMagnetSubmission } from "@/lib/db/queries"
import { sendLeadMagnetResults } from "@/lib/email"
import { db } from "@/lib/db"
import { notifyNewLead } from "@/lib/notifications"

const submitSchema = z.object({
  type: z.enum([
    "AI_READINESS_QUIZ",
    "ROI_CALCULATOR",
    "WEBSITE_AUDIT",
    "SEGMENT_EXPLORER",
    "STACK_CONFIGURATOR",
  ]),
  email: z.string().email(),
  name: z.string().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  data: z.record(z.unknown()),
  results: z.record(z.unknown()).optional(),
  score: z.number().optional(),
  source: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = submitSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const submission = await createLeadMagnetSubmission(parsed.data)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://aimseos.com"
    const typeSlug = parsed.data.type.toLowerCase().replace(/_/g, "-")

    // Auto-create Deal from lead magnet
    const deal = await db.deal.create({
      data: {
        contactName: parsed.data.name ?? parsed.data.email.split("@")[0],
        contactEmail: parsed.data.email,
        company: parsed.data.company,
        phone: parsed.data.phone,
        source: typeSlug,
        sourceDetail: submission.id,
        utmSource: parsed.data.utmSource,
        utmMedium: parsed.data.utmMedium,
        utmCampaign: parsed.data.utmCampaign,
        value: 0,
        activities: {
          create: {
            type: "FORM_SUBMITTED",
            detail: `Lead magnet submission: ${parsed.data.type}${parsed.data.score ? ` (score: ${parsed.data.score})` : ""}`,
          },
        },
      },
    }).catch(console.error)

    // Update submission with deal link
    if (deal) {
      await db.leadMagnetSubmission.update({
        where: { id: submission.id },
        data: { convertedToDeal: true, dealId: deal.id },
      }).catch(console.error)

      // Notify team of new lead
      await notifyNewLead({
        contactName: parsed.data.name ?? parsed.data.email,
        contactEmail: parsed.data.email,
        company: parsed.data.company,
        source: typeSlug,
      }).catch(console.error)
    }

    // Send results email
    await sendLeadMagnetResults({
      to: parsed.data.email,
      name: parsed.data.name ?? "",
      type: typeSlug,
      score: parsed.data.score,
      resultsUrl: `${appUrl}/tools/${typeSlug}?results=${submission.id}`,
    }).catch(console.error)

    return NextResponse.json(
      { id: submission.id, score: submission.score },
      { status: 201 }
    )
  } catch (err) {
    console.error("Lead magnet submission failed:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
