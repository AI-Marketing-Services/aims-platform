import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

const RESERVED_SUBDOMAINS = new Set([
  "www", "app", "api", "admin", "auth", "mail", "docs", "blog", "help",
  "status", "portal", "reseller", "intern", "cdn", "static",
])

const subdomainSchema = z
  .string()
  .min(3, "Minimum 3 characters")
  .max(30, "Maximum 30 characters")
  .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens")
  .refine((v) => !RESERVED_SUBDOMAINS.has(v), {
    message: "This subdomain is reserved",
  })

const patchSchema = z.object({
  subdomain: subdomainSchema.optional(),
  isPublished: z.boolean().optional(),
  seoTitle: z.string().max(120).optional(),
  seoDescription: z.string().max(300).optional(),
})

export async function PATCH(req: Request) {
  const { userId: clerkId, sessionClaims } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["RESELLER", "ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

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
    const dbUser = await db.user.findUnique({ where: { clerkId } })
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 })

    // subdomain is @unique — must be provided for create
    const existing = await db.operatorSite.findUnique({ where: { userId: dbUser.id } })

    let site
    if (existing) {
      site = await db.operatorSite.update({
        where: { userId: dbUser.id },
        data: { ...data },
      })
    } else {
      if (!data.subdomain) {
        return NextResponse.json(
          { error: "Subdomain is required to create your site." },
          { status: 422 },
        )
      }
      site = await db.operatorSite.create({
        data: {
          userId: dbUser.id,
          subdomain: data.subdomain,
          ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
          ...(data.seoTitle !== undefined && { seoTitle: data.seoTitle }),
          ...(data.seoDescription !== undefined && { seoDescription: data.seoDescription }),
        },
      })
    }

    return NextResponse.json({ ok: true, site })
  } catch (err) {
    const isUniqueViolation =
      err instanceof Error && err.message.includes("Unique constraint")
    if (isUniqueViolation) {
      return NextResponse.json(
        { error: "That subdomain is already taken. Please choose another." },
        { status: 409 },
      )
    }
    logger.error("Failed to update operator site", err, {
      endpoint: "PATCH /api/reseller/site",
      userId: clerkId,
    })
    return NextResponse.json({ error: "Failed to update site" }, { status: 500 })
  }
}
