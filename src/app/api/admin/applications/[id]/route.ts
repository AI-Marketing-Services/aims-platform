import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { deleteCloseLead } from "@/lib/close"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

/**
 * DELETE /api/admin/applications/[id]
 *
 * Removes a Collective Application submission from every surface in the
 * workspace — local DB (LeadMagnetSubmission + matching PartialApplication
 * rows), the linked Deal in the CRM Kanban, and the corresponding lead in
 * Close CRM. Used by the trash button on /admin/applications.
 *
 * Behavior:
 *  - Looks up the submission by id
 *  - Resolves any matching Deal: by submission.dealId AND by email match
 *    (covers the case where dealId points at a row that was already
 *    deleted but the cascade never ran)
 *  - For each matching Deal that has a closeLeadId, deletes from Close.
 *    If Close fails, the entire delete aborts so we don't desync the
 *    workspace.
 *  - Deletes Deal rows, all matching submissions, and matching partial
 *    applications in one transaction.
 *
 * Caller can pass `?skipClose=1` to skip the Close cascade.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, sessionClaims } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const url = new URL(req.url)
  const skipClose = url.searchParams.get("skipClose") === "1"

  try {
    const submission = await db.leadMagnetSubmission.findUnique({
      where: { id },
      select: { id: true, email: true, dealId: true, type: true },
    })
    if (!submission) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      )
    }

    const normalizedEmail = submission.email.trim().toLowerCase()

    // Find every Deal we should cascade-delete: the one this submission
    // points at, plus any other Deal sharing the email (handles the
    // legacy orphan case where dealId is stale).
    const deals = await db.deal.findMany({
      where: {
        OR: [
          submission.dealId ? { id: submission.dealId } : { id: "__never__" },
          { contactEmail: { equals: normalizedEmail, mode: "insensitive" } },
        ],
      },
      select: { id: true, closeLeadId: true },
    })

    // Cascade to Close FIRST. If any Close call fails, abort — the
    // shared Vendingpreneurs workspace must stay in lockstep with AIMS.
    const closeFailures: string[] = []
    if (!skipClose) {
      for (const d of deals) {
        if (!d.closeLeadId) continue
        const ok = await deleteCloseLead(d.closeLeadId)
        if (!ok) closeFailures.push(d.closeLeadId)
      }
    }

    if (closeFailures.length > 0) {
      logger.error("Application delete aborted: Close cascade failed", undefined, {
        submissionId: id,
        closeFailures,
      })
      return NextResponse.json(
        {
          error:
            "Could not delete the corresponding lead(s) in Close CRM. Local data kept intact so the two systems stay in sync. Remove the Close lead manually and retry.",
          closeFailures,
        },
        { status: 502 },
      )
    }

    const dealIds = deals.map((d) => d.id)
    const tx = await db.$transaction([
      // Wipe every submission tied to this email so the Applications
      // page actually empties out on delete (the user's primary ask).
      db.leadMagnetSubmission.deleteMany({
        where: {
          OR: [
            { id },
            {
              type: "COLLECTIVE_APPLICATION",
              email: { equals: normalizedEmail, mode: "insensitive" },
            },
            ...(dealIds.length > 0 ? [{ dealId: { in: dealIds } }] : []),
          ],
        },
      }),
      db.partialApplication.deleteMany({
        where: {
          OR: [
            { email: { equals: normalizedEmail, mode: "insensitive" } },
            ...(dealIds.length > 0 ? [{ dealId: { in: dealIds } }] : []),
          ],
        },
      }),
      ...(dealIds.length > 0
        ? [db.deal.deleteMany({ where: { id: { in: dealIds } } })]
        : []),
    ])

    const submissionsDeleted = tx[0]?.count ?? 0
    const partialsDeleted = tx[1]?.count ?? 0
    const dealsDeleted = dealIds.length > 0 ? tx[2]?.count ?? 0 : 0

    logger.info("Application deleted", {
      submissionId: id,
      email: normalizedEmail,
      submissionsDeleted,
      partialsDeleted,
      dealsDeleted,
      closeLeadsDeleted: deals.filter((d) => d.closeLeadId && !skipClose).length,
      deletedBy: userId,
    })

    return NextResponse.json({
      deleted: true,
      submissionsDeleted,
      partialsDeleted,
      dealsDeleted,
      cascadedToClose: !skipClose && deals.some((d) => d.closeLeadId),
    })
  } catch (err) {
    logger.error(`Failed to delete application ${id}:`, err)
    const message = err instanceof Error ? err.message : "Failed to delete"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
