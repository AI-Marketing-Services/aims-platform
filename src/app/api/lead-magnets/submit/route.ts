import { NextResponse } from "next/server"
import { z } from "zod"
import { createLeadMagnetSubmission } from "@/lib/db/queries"
import { sendLeadMagnetResults } from "@/lib/email"

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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://aimanagingservices.com"
    const typeSlug = parsed.data.type.toLowerCase().replace(/_/g, "-")

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
