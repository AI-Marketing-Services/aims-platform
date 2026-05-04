import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { getDealById, updateDealStage } from "@/lib/db/queries"
import { db } from "@/lib/db"
import { updateCloseLeadStatus, deleteCloseLead } from "@/lib/close"
import { logger } from "@/lib/logger"

const updateDealSchema = z.object({
  stage: z.enum([
    "APPLICATION_SUBMITTED",
    "CONSULT_BOOKED",
    "CONSULT_COMPLETED",
    "MIGHTY_INVITED",
    "MEMBER_JOINED",
    "LOST",
  ]).optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().optional(),
  value: z.number().optional(),
  mrr: z.number().optional(),
  assignedTo: z.string().optional(),
  lostReason: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
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
    const deal = await getDealById(dealId)
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(deal)
  } catch (err) {
    logger.error(`Failed to fetch deal ${dealId}:`, err)
    return NextResponse.json({ error: "Failed to fetch deal" }, { status: 500 })
  }
}

export async function PATCH(
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
  const parsed = updateDealSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const { stage, ...rest } = parsed.data

    // If stage change, use the helper that logs activity
    if (stage) {
      const deal = await updateDealStage(dealId, stage, userId)
      if (Object.keys(rest).length > 0) {
        await db.deal.update({ where: { id: dealId }, data: rest })
      }
      // Sync stage to Close CRM (fire-and-forget)
      if (deal.closeLeadId) {
        updateCloseLeadStatus(deal.closeLeadId, stage).catch((err) =>
          logger.error(`Failed to sync deal ${dealId} stage to Close CRM:`, err)
        )
      }
      return NextResponse.json(deal)
    }

    const deal = await db.deal.update({
      where: { id: dealId },
      data: rest,
    })

    return NextResponse.json(deal)
  } catch (err) {
    logger.error(`Failed to update deal ${dealId}:`, err)
    return NextResponse.json({ error: "Failed to update deal" }, { status: 500 })
  }
}

/**
 * DELETE /api/deals/[dealId]
 *
 * Removes the Deal from AIMS and cascades the delete to Close CRM so
 * we don't accumulate stale leads in the shared workspace. The Close
 * delete fires BEFORE the local DB delete: if the Close call fails
 * we abort, surface the error, and leave the local Deal intact so the
 * operator can retry. This avoids the failure mode where AIMS forgets
 * the closeLeadId and Close keeps a permanent orphan.
 *
 * Caller can pass `?skipClose=1` (typically only used by automated
 * cleanup scripts) to delete the local Deal without touching Close.
 */
export async function DELETE(
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
  const url = new URL(req.url)
  const skipClose = url.searchParams.get("skipClose") === "1"

  try {
    // Look up closeLeadId + email BEFORE deleting so we can cascade the
    // delete to (a) Close CRM and (b) every locally-linked submission
    // that points at this deal — by FK or by matching contactEmail.
    const deal = await db.deal.findUnique({
      where: { id: dealId },
      select: {
        closeLeadId: true,
        contactName: true,
        contactEmail: true,
        company: true,
      },
    })
    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 })
    }

    // Cascade delete to Close. If Close has the lead, we must remove
    // it first so a Close-side failure doesn't leave us with an orphan
    // that AIMS no longer knows about.
    if (deal.closeLeadId && !skipClose) {
      const ok = await deleteCloseLead(deal.closeLeadId)
      if (!ok) {
        logger.error("Aborted Deal delete: Close cascade failed", undefined, {
          dealId,
          closeLeadId: deal.closeLeadId,
        })
        return NextResponse.json(
          {
            error:
              "Could not delete the corresponding lead in Close. Local deal kept intact. Try again or remove the Close lead manually first.",
            closeLeadId: deal.closeLeadId,
          },
          { status: 502 },
        )
      }
    }

    // Cascade local cleanup. Submissions soft-point at Deal via dealId
    // (no FK), so a naked deal.delete leaves them dangling — they keep
    // showing up on /admin/applications with no Stage. We also clean up
    // anything matching the email so a single delete clears the lead
    // out of every surface in the workspace.
    //
    // Order matters: child rows first, then the deal itself.
    const normalizedEmail = deal.contactEmail.trim().toLowerCase()
    const tx = await db.$transaction([
      db.leadMagnetSubmission.deleteMany({
        where: {
          OR: [
            { dealId },
            {
              type: "COLLECTIVE_APPLICATION",
              email: { equals: normalizedEmail, mode: "insensitive" },
            },
          ],
        },
      }),
      db.partialApplication.deleteMany({
        where: {
          OR: [
            { dealId },
            { email: { equals: normalizedEmail, mode: "insensitive" } },
          ],
        },
      }),
      db.deal.delete({ where: { id: dealId } }),
    ])
    const submissionsDeleted = tx[0]?.count ?? 0
    const partialsDeleted = tx[1]?.count ?? 0

    logger.info("Deal deleted", {
      dealId,
      closeLeadId: deal.closeLeadId,
      cascadedToClose: Boolean(deal.closeLeadId && !skipClose),
      submissionsDeleted,
      partialsDeleted,
      company: deal.company,
      deletedBy: userId,
    })

    return NextResponse.json({
      deleted: true,
      cascadedToClose: Boolean(deal.closeLeadId && !skipClose),
      submissionsDeleted,
      partialsDeleted,
    })
  } catch (err) {
    logger.error(`Failed to delete deal ${dealId}:`, err)
    return NextResponse.json({ error: "Failed to delete deal" }, { status: 500 })
  }
}
