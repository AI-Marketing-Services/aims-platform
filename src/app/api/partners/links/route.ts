import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { getDubClient } from "@/lib/dub"

/**
 * GET /api/partners/links
 *
 * Returns referral links for the current partner.
 * - If Dub.co is configured + partner is registered → returns Dub short links.
 * - Otherwise → returns legacy ?ref= links.
 */
export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const dbUser = await db.user.findUnique({ where: { clerkId } })
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const referral = await db.referral.findFirst({
      where: { referrerId: dbUser.id },
    })

    if (!referral) {
      return NextResponse.json({ error: "No referral record. Register as a partner first." }, { status: 404 })
    }

    const dub = await getDubClient()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.aioperatorcollective.com"

    // If Dub is configured and partner has a Dub ID, use Dub links
    if (dub && referral.dubPartnerId) {
      try {
        // Try to retrieve existing links first
        const links = await dub.partners.retrieveLinks({
          partnerId: referral.dubPartnerId,
        })

        if (links.length > 0) {
          const primary = links[0]
          return NextResponse.json({
            ok: true,
            links: {
              primary: primary.shortLink,
              marketplace: `${primary.shortLink}?page=marketplace`,
              quiz: `${primary.shortLink}?page=quiz`,
              calculator: `${primary.shortLink}?page=calculator`,
            },
            source: "dub",
          })
        }

        // No links yet — create one
        const link = await dub.partners.createLink({
          partnerId: referral.dubPartnerId,
          url: baseUrl,
        })

        // Cache the link ID
        await db.referral.update({
          where: { id: referral.id },
          data: { dubLinkId: link.id },
        })

        return NextResponse.json({
          ok: true,
          links: {
            primary: link.shortLink,
            marketplace: `${link.shortLink}?page=marketplace`,
            quiz: `${link.shortLink}?page=quiz`,
            calculator: `${link.shortLink}?page=calculator`,
          },
          source: "dub",
        })
      } catch (dubErr) {
        logger.error("Failed to get/create Dub link", dubErr, {
          endpoint: "GET /api/partners/links",
          userId: dbUser.id,
        })
        // Fall through to legacy links
      }
    }

    // Legacy link format
    const refCode = referral.code
    const slug = referral.landingPageSlug ?? refCode
    return NextResponse.json({
      ok: true,
      links: {
        primary: `${baseUrl}/for/${slug}?ref=${refCode}`,
        marketplace: `${baseUrl}/marketplace?ref=${refCode}`,
        quiz: `${baseUrl}/tools/ai-readiness-quiz?ref=${refCode}`,
        calculator: `${baseUrl}/tools/roi-calculator?ref=${refCode}`,
      },
      source: "legacy",
    })
  } catch (err) {
    logger.error("Failed to fetch partner links", err, {
      endpoint: "GET /api/partners/links",
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
