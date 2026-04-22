import { NextResponse } from "next/server"
import { createHash } from "crypto"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  if (!token || typeof token !== "string" || token.length < 32) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 })
  }

  const tokenHash = createHash("sha256").update(token).digest("hex")

  try {
    const access = await db.clientPortalAccess.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        guestEmail: true,
        guestName: true,
        expiresAt: true,
        userId: true,
        clientDealId: true,
      },
    })

    if (!access) {
      return NextResponse.json({ error: "expired" }, { status: 404 })
    }

    // Update lastAccessAt
    await db.clientPortalAccess.update({
      where: { id: access.id },
      data: { lastAccessAt: new Date() },
    })

    const [deal, memberProfile] = await Promise.all([
      db.clientDeal.findUnique({
        where: { id: access.clientDealId },
        select: {
          id: true,
          companyName: true,
          stage: true,
          value: true,
          currency: true,
          contacts: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              title: true,
              email: true,
              isPrimary: true,
            },
            orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
          },
          proposals: {
            select: {
              id: true,
              title: true,
              status: true,
              shareToken: true,
              totalValue: true,
              currency: true,
              sentAt: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
          },
          invoices: {
            select: {
              id: true,
              invoiceNumber: true,
              title: true,
              status: true,
              total: true,
              currency: true,
              dueAt: true,
              stripePaymentLink: true,
              shareToken: true,
            },
            where: {
              status: { not: "DRAFT" },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      }),
      db.memberProfile.findUnique({
        where: { userId: access.userId },
        select: {
          businessName: true,
          logoUrl: true,
          brandColor: true,
          tagline: true,
        },
      }),
    ])

    if (!deal) {
      return NextResponse.json({ error: "expired" }, { status: 404 })
    }

    return NextResponse.json({
      guest: {
        email: access.guestEmail,
        name: access.guestName,
      },
      operator: {
        businessName: memberProfile?.businessName ?? null,
        logoUrl: memberProfile?.logoUrl ?? null,
        brandColor: memberProfile?.brandColor ?? "#C4972A",
        tagline: memberProfile?.tagline ?? null,
      },
      deal: {
        id: deal.id,
        companyName: deal.companyName,
        stage: deal.stage,
        value: deal.value,
        currency: deal.currency,
        contacts: deal.contacts,
        proposals: deal.proposals,
        invoices: deal.invoices,
      },
    })
  } catch (err) {
    logger.error("Client portal token lookup failed", err, { token: token.slice(0, 8) + "..." })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
