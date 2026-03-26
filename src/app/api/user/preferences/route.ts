import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

const prefsSchema = z.object({
  // Notification channel prefs
  emailNotifs: z.boolean().optional(),
  slackNotifs: z.boolean().optional(),
  // Granular notification event type prefs
  notifNewPurchase: z.boolean().optional(),
  notifFulfillmentUpdate: z.boolean().optional(),
  notifSupportReply: z.boolean().optional(),
  notifBillingAlert: z.boolean().optional(),
  notifMarketingDigest: z.boolean().optional(),
  // Profile fields
  company: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
  website: z.string().max(500).optional(),
  industry: z.string().max(100).optional(),
  locationCount: z.number().int().min(1).max(9999).optional(),
  heardAbout: z.string().max(100).optional(),
})

export async function PATCH(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
  const parsed = prefsSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 })

  const {
    emailNotifs,
    slackNotifs,
    notifNewPurchase,
    notifFulfillmentUpdate,
    notifSupportReply,
    notifBillingAlert,
    notifMarketingDigest,
    company,
    phone,
    website,
    industry,
    locationCount,
    heardAbout,
  } = parsed.data

  const updateData: Record<string, unknown> = {}
  if (emailNotifs !== undefined) updateData.emailNotifs = emailNotifs
  if (slackNotifs !== undefined) updateData.slackNotifs = slackNotifs
  if (notifNewPurchase !== undefined) updateData.notifNewPurchase = notifNewPurchase
  if (notifFulfillmentUpdate !== undefined) updateData.notifFulfillmentUpdate = notifFulfillmentUpdate
  if (notifSupportReply !== undefined) updateData.notifSupportReply = notifSupportReply
  if (notifBillingAlert !== undefined) updateData.notifBillingAlert = notifBillingAlert
  if (notifMarketingDigest !== undefined) updateData.notifMarketingDigest = notifMarketingDigest
  if (company !== undefined) updateData.company = company
  if (phone !== undefined) updateData.phone = phone
  if (website !== undefined) updateData.website = website
  if (industry !== undefined) updateData.industry = industry
  if (locationCount !== undefined) updateData.locationCount = locationCount
  if (heardAbout !== undefined) updateData.heardAbout = heardAbout

  try {
    const user = await db.user.update({
      where: { clerkId: userId },
      data: updateData,
      select: {
        emailNotifs: true,
        slackNotifs: true,
        notifNewPurchase: true,
        notifFulfillmentUpdate: true,
        notifSupportReply: true,
        notifBillingAlert: true,
        notifMarketingDigest: true,
        company: true,
        phone: true,
        website: true,
        industry: true,
        locationCount: true,
        heardAbout: true,
      },
    })

    return NextResponse.json(user)
  } catch (err) {
    logger.error("Failed to update user preferences", err, { endpoint: "PATCH /api/user/preferences", userId })
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 })
  }
}
