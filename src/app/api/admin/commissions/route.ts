import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

async function requireAdmin() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return null
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) return null
  return userId
}

const approveSchema = z.object({
  commissionId: z.string().min(1),
  action: z.enum(["approve", "reject", "paid"]),
})

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const commissions = await db.commission.findMany({
      orderBy: { createdAt: "desc" },
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
    })

    const summary = {
      totalPending: commissions.filter((c) => c.status === "PENDING").reduce((sum, c) => sum + c.amount, 0),
      totalApproved: commissions.filter((c) => c.status === "APPROVED").reduce((sum, c) => sum + c.amount, 0),
      totalPaid: commissions.filter((c) => c.status === "PAID").reduce((sum, c) => sum + c.amount, 0),
      count: commissions.length,
    }

    return NextResponse.json({ commissions, summary })
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

    const statusMap = {
      approve: "APPROVED" as const,
      reject: "REJECTED" as const,
      paid: "PAID" as const,
    }

    const newStatus = statusMap[parsed.data.action]

    const updated = await db.commission.update({
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
      await db.referral.update({
        where: { id: commission.referralId },
        data: {
          totalEarned: { increment: commission.amount },
          pendingPayout: { decrement: commission.amount },
        },
      })
    }

    // Update pending payout when approved
    if (parsed.data.action === "approve") {
      await db.referral.update({
        where: { id: commission.referralId },
        data: {
          pendingPayout: { increment: commission.amount },
        },
      })
    }

    return NextResponse.json(updated)
  } catch (err) {
    logger.error("Failed to update commission", err, { endpoint: "PATCH /api/admin/commissions" })
    return NextResponse.json({ error: "Failed to update commission" }, { status: 500 })
  }
}
