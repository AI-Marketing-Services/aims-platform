import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"

const activitySchema = z.object({
  type: z.enum([
    "EMAIL_SENT",
    "CALL_MADE",
    "DEMO_COMPLETED",
    "STAGE_CHANGE",
    "NOTE_ADDED",
    "SUBSCRIPTION_CREATED",
    "SUBSCRIPTION_CANCELLED",
    "PAYMENT_RECEIVED",
    "TASK_CREATED",
    "FORM_SUBMITTED",
  ]),
  detail: z.string().min(1).max(2000),
  authorId: z.string().optional(),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { dealId } = await params
  try {
    const activities = await db.dealActivity.findMany({
      where: { dealId },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(activities)
  } catch (err) {
    console.error(`Failed to fetch activities for deal ${dealId}:`, err)
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { dealId } = await params
  const body = await req.json()
  const parsed = activitySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const activity = await db.dealActivity.create({
      data: {
        dealId,
        type: parsed.data.type,
        detail: parsed.data.detail,
        authorId: parsed.data.authorId ?? userId,
      },
    })
    return NextResponse.json(activity, { status: 201 })
  } catch (err) {
    console.error(`Failed to create activity for deal ${dealId}:`, err)
    return NextResponse.json({ error: "Failed to create activity" }, { status: 500 })
  }
}
