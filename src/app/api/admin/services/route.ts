import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger"

async function requireAdmin() {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) return null;
  return userId;
}

const querySchema = z.object({
  take: z.coerce.number().int().min(1).max(100).default(50),
  skip: z.coerce.number().int().min(0).default(0),
})

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(req.url)
    const parsed = querySchema.safeParse({
      take: searchParams.get("take") ?? undefined,
      skip: searchParams.get("skip") ?? undefined,
    })

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query params", details: parsed.error.flatten() }, { status: 400 })
    }

    const { take, skip } = parsed.data

    const [services, total] = await Promise.all([
      db.serviceArm.findMany({
        orderBy: [{ pillar: "asc" }, { sortOrder: "asc" }],
        take,
        skip,
        select: {
          id: true,
          slug: true,
          name: true,
          pillar: true,
          status: true,
          asanaProjectGid: true,
          asanaAssigneeGid: true,
          asanaTaskTemplate: true,
          ctaUrl: true,
          defaultAssignee: true,
        },
      }),
      db.serviceArm.count(),
    ])

    return NextResponse.json({ data: services, meta: { total, take, skip } });
  } catch (err) {
    logger.error("Failed to fetch service arms:", err);
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    let body
    try { body = await req.json() } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }
    const { id, asanaProjectGid, asanaAssigneeGid, asanaTaskTemplate, ctaUrl, defaultAssignee } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const updated = await db.serviceArm.update({
      where: { id },
      data: {
        asanaProjectGid: asanaProjectGid || null,
        asanaAssigneeGid: asanaAssigneeGid || null,
        asanaTaskTemplate: asanaTaskTemplate || null,
        ctaUrl: ctaUrl || null,
        defaultAssignee: defaultAssignee || null,
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    logger.error("Failed to update service arm:", err);
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 });
  }
}
