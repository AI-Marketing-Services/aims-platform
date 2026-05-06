import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"
import { hasEntitlement } from "@/lib/entitlements"
import { FEATURE_ENTITLEMENTS } from "@/lib/plans/registry"

export const dynamic = "force-dynamic"

const TEMPLATE_TYPES = ["email", "proposal", "script", "content", "snippet"] as const

const createSchema = z.object({
  type: z.enum(TEMPLATE_TYPES),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(20_000),
  variables: z.array(z.string().max(80)).max(40).optional(),
  tags: z.array(z.string().max(40)).max(20).optional(),
})

async function checkAccess(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  if (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") return true
  return hasEntitlement(userId, FEATURE_ENTITLEMENTS.TEMPLATES)
}

/** GET /api/portal/templates?type=email — list user's + public templates. */
export async function GET(req: Request) {
  const userId = await ensureDbUserIdForApi()
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const allowed = await checkAccess(userId)
  if (!allowed) {
    return NextResponse.json(
      { error: "upgrade_required", entitlement: FEATURE_ENTITLEMENTS.TEMPLATES },
      { status: 402 },
    )
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")
  const typeFilter =
    type && (TEMPLATE_TYPES as readonly string[]).includes(type)
      ? { type }
      : {}

  const templates = await db.userTemplate.findMany({
    where: {
      OR: [{ userId }, { isPublic: true }],
      ...typeFilter,
    },
    orderBy: [{ isPublic: "asc" }, { updatedAt: "desc" }],
    take: 200,
  })
  return NextResponse.json({ templates })
}

/** POST /api/portal/templates — create a new private template. */
export async function POST(req: Request) {
  const userId = await ensureDbUserIdForApi()
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const allowed = await checkAccess(userId)
  if (!allowed) {
    return NextResponse.json(
      { error: "upgrade_required", entitlement: FEATURE_ENTITLEMENTS.TEMPLATES },
      { status: 402 },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const created = await db.userTemplate.create({
    data: {
      userId,
      type: parsed.data.type,
      title: parsed.data.title,
      body: parsed.data.body,
      variables: parsed.data.variables ?? [],
      tags: parsed.data.tags ?? [],
      isPublic: false,
    },
  })
  return NextResponse.json({ template: created }, { status: 201 })
}
