import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { Prisma } from "@prisma/client"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { getOrCreateDbUserByClerkId } from "@/lib/auth/ensure-user"

/**
 * Auto-provisions a whitelabel `OperatorSite` row for the signed-in user
 * during their first-run onboarding wizard.
 *
 * Schema reality check (prisma/schema.prisma ~line 153):
 *   model OperatorSite {
 *     id          @id
 *     userId      @unique      // <-- owner column is userId, NOT ownerId
 *     subdomain   @unique
 *     isPublished Boolean
 *     homepageContent Json     // brand bits live here (no dedicated cols)
 *     ...
 *   }
 *
 * The user-facing "brand" fields (businessName, brandColor, tagline,
 * logoUrl) do NOT exist as top-level columns on OperatorSite — they are
 * persisted inside the `homepageContent` JSON, matching the pattern in
 * `src/lib/website/render.ts`. We merge into existing JSON on update so
 * we never clobber other template content the operator already authored.
 */

const RESERVED_SUBDOMAINS = new Set([
  "www",
  "app",
  "portal",
  "admin",
  "api",
  "auth",
])

const subdomainSchema = z
  .string()
  .regex(/^[a-z0-9-]{3,40}$/, {
    message:
      "Subdomain must be 3-40 chars, lowercase letters, numbers, or hyphens.",
  })
  .refine((v) => !RESERVED_SUBDOMAINS.has(v), {
    message: "That subdomain is reserved.",
  })

const bodySchema = z.object({
  subdomain: subdomainSchema,
  businessName: z.string().min(1).max(120),
  brandColor: z.string().max(32).optional(),
  tagline: z.string().max(280).optional(),
  logoUrl: z.string().url().max(2048).optional(),
})

type BrandPayload = {
  businessName: string
  brandColor?: string
  tagline?: string
  logoUrl?: string
}

function mergeBrand(
  existing: Prisma.JsonValue | null | undefined,
  brand: BrandPayload,
): Prisma.InputJsonValue {
  // existing homepageContent is `Json @default("{}")` — could be any
  // shape. We only merge at the top level and stamp our brand keys.
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? (existing as Record<string, unknown>)
      : {}
  return {
    ...base,
    businessName: brand.businessName,
    ...(brand.brandColor !== undefined && { brandColor: brand.brandColor }),
    ...(brand.tagline !== undefined && { tagline: brand.tagline }),
    ...(brand.logoUrl !== undefined && { logoUrl: brand.logoUrl }),
  }
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    )
  }

  const { subdomain, businessName, brandColor, tagline, logoUrl } = parsed.data

  try {
    const dbUser = await getOrCreateDbUserByClerkId(clerkId)

    const existing = await db.operatorSite.findUnique({
      where: { userId: dbUser.id },
      select: { id: true, subdomain: true, homepageContent: true },
    })

    const brand: BrandPayload = {
      businessName,
      ...(brandColor !== undefined && { brandColor }),
      ...(tagline !== undefined && { tagline }),
      ...(logoUrl !== undefined && { logoUrl }),
    }

    // Always include subdomain on update path. Previously we only set
    // it when `existing.subdomain !== subdomain` — but in the race
    // condition where two requests both saw the subdomain as free,
    // one might create with userId+subdomain and the OTHER hit the
    // update branch with `existing` still null at lookup time but a
    // row now existing by userId. Skipping the subdomain write on
    // update would silently let that second request "succeed" without
    // applying the user's typed value. Always writing the subdomain
    // means we always get a P2002 if it collides — fail loudly and
    // correctly instead of silently retaining the wrong value.
    const site = await db.operatorSite.upsert({
      where: { userId: dbUser.id },
      update: {
        subdomain,
        homepageContent: mergeBrand(existing?.homepageContent ?? null, brand),
      },
      create: {
        userId: dbUser.id,
        subdomain,
        isPublished: false,
        homepageContent: mergeBrand(null, brand),
      },
      select: { id: true, subdomain: true, isPublished: true },
    })

    return NextResponse.json({ ok: true, site })
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const target = err.meta?.target
      const hitSubdomain =
        (Array.isArray(target) && target.includes("subdomain")) ||
        (typeof target === "string" && target.includes("subdomain"))
      if (hitSubdomain) {
        return NextResponse.json(
          { error: "subdomain_taken" },
          { status: 409 },
        )
      }
    }
    logger.error("Failed to provision operator site", err, {
      endpoint: "POST /api/portal/welcome/provision-site",
      userId: clerkId,
      action: "provision-site",
    })
    return NextResponse.json(
      { error: "Failed to provision site" },
      { status: 500 },
    )
  }
}
