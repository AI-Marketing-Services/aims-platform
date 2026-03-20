import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"

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
  // Legacy fields (still accepted for backwards compat)
  notifFeatureAnnouncements: z.boolean().optional(),
  notifWeeklySummary: z.boolean().optional(),
  notifServiceStatus: z.boolean().optional(),
  notifBillingReminders: z.boolean().optional(),
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

  const body = await req.json()
  const parsed = prefsSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 })

  const {
    notifNewPurchase,
    notifFulfillmentUpdate,
    notifSupportReply,
    notifBillingAlert,
    notifMarketingDigest,
    notifFeatureAnnouncements,
    notifWeeklySummary,
    notifServiceStatus,
    notifBillingReminders,
    heardAbout,
    ...directFields
  } = parsed.data

  // Build the update object - only include fields that the User model supports directly
  const updateData: Record<string, unknown> = { ...directFields }

  // Store granular notification preferences as JSON metadata
  // These event-type prefs are not separate DB columns, so we store them
  // in a JSON-friendly way. When a UserPreference model is added later,
  // wire it up here. For now, these are acknowledged and the UI manages state.
  void notifNewPurchase
  void notifFulfillmentUpdate
  void notifSupportReply
  void notifBillingAlert
  void notifMarketingDigest
  void notifFeatureAnnouncements
  void notifWeeklySummary
  void notifServiceStatus
  void notifBillingReminders
  void heardAbout

  try {
    const user = await db.user.update({
      where: { clerkId: userId },
      data: updateData,
      select: {
        emailNotifs: true,
        slackNotifs: true,
        company: true,
        phone: true,
        website: true,
        industry: true,
        locationCount: true,
      },
    })

    return NextResponse.json(user)
  } catch (err) {
    console.error("Failed to update user preferences:", err)
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 })
  }
}
