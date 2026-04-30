import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"
import { emitEvent, EVENT_TYPES } from "@/lib/events/emit"

export const dynamic = "force-dynamic"

/**
 * POST /api/portal/crm/deals/[id]/merge
 *
 * Merges a duplicate ClientDeal INTO this deal (the canonical one).
 * Body: { sourceDealId: string }
 *
 * Behavior:
 *   - All ClientContacts moved from source to target (deduped by email).
 *   - All ClientDealActivity entries moved from source to target.
 *   - All ClientDealNote entries moved from source to target.
 *   - All ClientProposal entries moved from source to target.
 *   - All ClientInvoice entries reassigned via clientDealId.
 *   - Target's notes get appended with merge marker + source's notes.
 *   - Target's tags get unioned with source's tags.
 *   - Target's value upgraded to source if source > target and target = 0.
 *   - Target's industry/website/contactPhone filled if currently null.
 *   - Source ClientDeal deleted (cascade-deletes the enrichment row).
 *
 * Idempotent because the source is fully deleted at the end.
 */

const bodySchema = z.object({
  sourceDealId: z.string().min(1),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const dbUserId = await ensureDbUserIdForApi()
  if (!dbUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: targetDealId } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const { sourceDealId } = parsed.data

  if (sourceDealId === targetDealId) {
    return NextResponse.json(
      { error: "Cannot merge a deal into itself." },
      { status: 400 },
    )
  }

  // Verify operator owns BOTH deals
  const [target, source] = await Promise.all([
    db.clientDeal.findFirst({
      where: { id: targetDealId, userId: dbUserId },
      include: { contacts: { select: { email: true } } },
    }),
    db.clientDeal.findFirst({
      where: { id: sourceDealId, userId: dbUserId },
      include: { contacts: true },
    }),
  ])
  if (!target) {
    return NextResponse.json({ error: "Target deal not found" }, { status: 404 })
  }
  if (!source) {
    return NextResponse.json({ error: "Source deal not found" }, { status: 404 })
  }

  // Build the merged-tags + merged-notes payload
  const targetEmails = new Set(
    target.contacts.map((c) => c.email?.toLowerCase()).filter(Boolean) as string[],
  )

  const mergedTags = Array.from(
    new Set([...(target.tags ?? []), ...(source.tags ?? [])]),
  )

  const mergeBanner = `\n\n---\nMerged from "${source.companyName}" on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.\n\n`
  const mergedNotes =
    source.notes && source.notes.trim()
      ? `${target.notes ?? ""}${mergeBanner}${source.notes.trim()}`
      : target.notes

  try {
    await db.$transaction(
      async (tx) => {
        // 1. Move contacts (skip dupes by email)
        for (const c of source.contacts) {
          const lowered = c.email?.toLowerCase()
          if (lowered && targetEmails.has(lowered)) {
            await tx.clientContact.delete({ where: { id: c.id } })
            continue
          }
          await tx.clientContact.update({
            where: { id: c.id },
            data: { clientDealId: targetDealId },
          })
        }

        // 2. Move activities
        await tx.clientDealActivity.updateMany({
          where: { clientDealId: sourceDealId },
          data: { clientDealId: targetDealId },
        })

        // 3. Move meeting notes
        await tx.clientDealNote.updateMany({
          where: { clientDealId: sourceDealId },
          data: { clientDealId: targetDealId },
        })

        // 4. Move proposals
        await tx.clientProposal.updateMany({
          where: { clientDealId: sourceDealId },
          data: { clientDealId: targetDealId },
        })

        // 5. Move invoices (clientDealId is nullable on this model with
        //    SetNull cascade, so a direct updateMany is fine).
        await tx.clientInvoice.updateMany({
          where: { clientDealId: sourceDealId },
          data: { clientDealId: targetDealId },
        })

        // 6. Update target with merged data
        await tx.clientDeal.update({
          where: { id: targetDealId },
          data: {
            tags: mergedTags,
            notes: mergedNotes,
            value:
              target.value === 0 && source.value > 0 ? source.value : target.value,
            industry: target.industry ?? source.industry,
            website: target.website ?? source.website,
            contactPhone: target.contactPhone ?? source.contactPhone,
            contactEmail: target.contactEmail ?? source.contactEmail,
            contactName: target.contactName ?? source.contactName,
            // Bump leadScore to the higher of the two (better signal wins)
            leadScore:
              typeof source.leadScore === "number"
                ? typeof target.leadScore === "number"
                  ? Math.max(source.leadScore, target.leadScore)
                  : source.leadScore
                : target.leadScore,
          },
        })

        // 7. Activity entry on target documenting the merge
        await tx.clientDealActivity.create({
          data: {
            clientDealId: targetDealId,
            type: "NOTE",
            description: `Merged duplicate deal "${source.companyName}" into this one.`,
            metadata: {
              mergedFromName: source.companyName,
              mergedFromId: sourceDealId,
              contactsMoved: source.contacts.length,
            },
          },
        })

        // 8. Delete the source deal. Cascades to ClientDealEnrichment.
        await tx.clientDeal.delete({ where: { id: sourceDealId } })
      },
      { timeout: 20_000 },
    )

    void emitEvent({
      actorId: dbUserId,
      type: EVENT_TYPES.DEAL_UPDATED,
      entityType: "ClientDeal",
      entityId: targetDealId,
      metadata: {
        action: "merged",
        sourceDealId,
        sourceCompanyName: source.companyName,
      },
    })

    return NextResponse.json({
      ok: true,
      targetDealId,
      mergedCompanyName: source.companyName,
    })
  } catch (err) {
    logger.error("Deal merge failed", err, {
      targetDealId,
      sourceDealId,
      userId: dbUserId,
    })
    return NextResponse.json({ error: "Merge failed" }, { status: 500 })
  }
}
