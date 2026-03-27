import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { requireAdmin } from "@/lib/auth"

const approveSchema = z.object({
  commissionId: z.string().min(1),
  action: z.enum(["approve", "reject", "paid"]),
})

const querySchema = z.object({
  take: z.coerce.number().int().min(1).max(100).default(50),
  skip: z.coerce.number().int().min(0).default(0),
  search: z.string().optional(),
})

export async function GET(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const parsed = querySchema.safeParse({
      take: searchParams.get("take") ?? undefined,
      skip: searchParams.get("skip") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    })

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query params", details: parsed.error.flatten() }, { status: 400 })
    }

    const { take, skip, search } = parsed.data

    const where = search
      ? { referral: { referrer: { id: { contains: search, mode: "insensitive" as const } } } }
      : {}

    const [commissions, total] = await Promise.all([
      db.commission.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
        include: {
          referral: {
            select: {
              id: true,
              code: true,
              tier: true,
              referrer: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      }),
      db.commission.count({ where }),
    ])

    const summary = {
      totalPending: commissions.filter((c) => c.status === "PENDING").reduce((sum, c) => sum + c.amount, 0),
      totalApproved: commissions.filter((c) => c.status === "APPROVED").reduce((sum, c) => sum + c.amount, 0),
      totalPaid: commissions.filter((c) => c.status === "PAID").reduce((sum, c) => sum + c.amount, 0),
      count: total,
    }

    return NextResponse.json({ data: commissions, summary, meta: { total, take, skip } })
  } catch (err) {
    logger.error("Failed to fetch commissions", err, { endpoint: "GET /api/admin/commissions" })
    return NextResponse.json({ error: "Failed to fetch commissions" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const adminClerkId = await requireAdmin()
  if (!adminClerkId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = approveSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const commission = await db.commission.findUnique({
      where: { id: parsed.data.commissionId },
      include: { referral: true },
    })

    if (!commission) {
      return NextResponse.json({ error: "Commission not found" }, { status: 404 })
    }

    const VALID_TRANSITIONS: Record<string, string[]> = {
      PENDING: ["APPROVED", "REJECTED"],
      APPROVED: ["PAID", "REJECTED"],
    }

    const statusMap = {
      approve: "APPROVED" as const,
      reject: "REJECTED" as const,
      paid: "PAID" as const,
    }

    const newStatus = statusMap[parsed.data.action]
    const allowedTargets = VALID_TRANSITIONS[commission.status] ?? []

    if (!allowedTargets.includes(newStatus)) {
      return NextResponse.json(
        { error: `Cannot transition from ${commission.status} to ${newStatus}` },
        { status: 400 }
      )
    }

    const updated = await db.$transaction(async (tx) => {
      const updatedCommission = await tx.commission.update({
        where: { id: parsed.data.commissionId },
        data: {
          status: newStatus,
          approvedAt: parsed.data.action === "approve" ? new Date() : undefined,
          approvedBy: parsed.data.action === "approve" ? adminClerkId : undefined,
          paidAt: parsed.data.action === "paid" ? new Date() : undefined,
        },
      })

      // Update referral totals when paid
      if (parsed.data.action === "paid") {
        await tx.referral.update({
          where: { id: commission.referralId },
          data: {
            totalEarned: { increment: commission.amount },
            pendingPayout: { decrement: commission.amount },
          },
        })
      }

      // Update pending payout when approved
      if (parsed.data.action === "approve") {
        await tx.referral.update({
          where: { id: commission.referralId },
          data: {
            pendingPayout: { increment: commission.amount },
          },
        })
      }

      return updatedCommission
    })

    return NextResponse.json(updated)
  } catch (err) {
    logger.error("Failed to update commission", err, { endpoint: "PATCH /api/admin/commissions" })
    return NextResponse.json({ error: "Failed to update commission" }, { status: 500 })
  }
}
