import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"

const prefsSchema = z.object({
  // Notification prefs
  emailNotifs: z.boolean().optional(),
  slackNotifs: z.boolean().optional(),
  // Granular notification prefs stored as JSON in metadata
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
    notifFeatureAnnouncements,
    notifWeeklySummary,
    notifServiceStatus,
    notifBillingReminders,
    heardAbout,
    ...directFields
  } = parsed.data

  // Build the update object — only include fields that were provided
  const updateData: Record<string, unknown> = { ...directFields }

  // Store extra notif prefs and heardAbout on the user's name field isn't ideal;
  // since there's no separate preferences table, we skip persisting these extras
  // beyond what the User model supports. The UI will manage them via local state.
  // If a UserPreference model is added later, wire it up here.
  void notifFeatureAnnouncements
  void notifWeeklySummary
  void notifServiceStatus
  void notifBillingReminders
  void heardAbout

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
}
