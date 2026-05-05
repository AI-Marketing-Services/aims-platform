import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { invalidateTenantCache } from "@/lib/tenant/resolve-tenant"
import { checkWhitelabelAccess } from "@/lib/auth/whitelabel"

const patchSchema = z.object({
  businessName: z.string().max(200).optional(),
  tagline: z.string().max(300).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  faviconUrl: z.string().url().optional().or(z.literal("")),
  brandColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color")
    .optional(),
  accentColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color")
    .optional(),
  fontHeading: z
    .enum(["DM Sans", "Inter", "Cormorant Garamond", "Playfair Display", "Space Grotesk"])
    .optional(),
})

export async function PATCH(req: Request) {
  const access = await checkWhitelabelAccess()
  if (!access.ok) {
    return NextResponse.json({ error: access.error, reason: access.reason }, { status: access.status })
  }
  const clerkId = access.clerkId

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    )
  }

  const data = parsed.data

  try {
    const dbUser = await db.user.findUnique({
      where: { clerkId },
      include: { operatorSite: { select: { subdomain: true, customDomain: true } } },
    })
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const profile = await db.memberProfile.upsert({
      where: { userId: dbUser.id },
      create: { userId: dbUser.id, ...data },
      update: { ...data },
    })

    if (dbUser.operatorSite) {
      invalidateTenantCache({
        subdomains: [dbUser.operatorSite.subdomain],
        customDomains: [dbUser.operatorSite.customDomain],
      })
    }

    return NextResponse.json({ ok: true, profile })
  } catch (err) {
    logger.error("Failed to update reseller brand", err, {
      endpoint: "PATCH /api/reseller/brand",
      userId: clerkId,
    })
    return NextResponse.json({ error: "Failed to update branding" }, { status: 500 })
  }
}
