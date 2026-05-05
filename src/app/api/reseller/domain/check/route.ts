import { NextResponse } from "next/server"
import { z } from "zod"
import {
  getDomainDetail,
  isVercelDomainsConfigured,
  VercelDomainsApiError,
} from "@/lib/vercel-domains"
import { checkWhitelabelAccess } from "@/lib/auth/whitelabel"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const schema = z.object({
  domain: z
    .string()
    .min(4)
    .max(253)
    .toLowerCase()
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/, "Invalid domain format"),
})

type CheckStatus =
  | "available"
  | "in_use_other_project"
  | "in_use_this_project"
  | "invalid"
  | "unknown"

interface CheckResponse {
  domain: string
  status: CheckStatus
  message: string
  canAdd: boolean
}

/**
 * GET /api/reseller/domain/check?domain=foo.com
 *
 * Lightweight pre-flight check used by the domain form to give live
 * feedback ("available" / "already in use") as the user types, without
 * mutating any state. Calls Vercel's domain detail endpoint:
 *   - 404 means the domain isn't on this project — usable (or could
 *     belong to a different team, in which case the actual add will
 *     fail with `forbidden`; we still return `available` here because
 *     we can't see across teams)
 *   - 200 with our projectId means it's already attached here
 *   - 200 with a different projectId means it's used by another project
 *     in our team and a real add would 409
 *
 * Same auth gate as the rest of the whitelabel surface.
 */
export async function GET(req: Request) {
  const access = await checkWhitelabelAccess()
  if (!access.ok) {
    return NextResponse.json(
      { error: access.error, reason: access.reason },
      { status: access.status },
    )
  }

  if (!isVercelDomainsConfigured()) {
    return NextResponse.json(
      { error: "Vercel Domains integration not configured" },
      { status: 503 },
    )
  }

  const { searchParams } = new URL(req.url)
  const parsed = schema.safeParse({ domain: searchParams.get("domain") ?? "" })
  if (!parsed.success) {
    const body: CheckResponse = {
      domain: searchParams.get("domain") ?? "",
      status: "invalid",
      message: "That doesn't look like a valid domain.",
      canAdd: false,
    }
    return NextResponse.json(body, { status: 200 })
  }

  const { domain } = parsed.data

  try {
    const detail = await getDomainDetail(domain)
    // We got 200 from Vercel — the domain is on THIS project already.
    const body: CheckResponse = {
      domain,
      status: "in_use_this_project",
      message: detail.verified
        ? `Already attached and verified for this project.`
        : `Already attached to this project (verification pending).`,
      canAdd: false,
    }
    return NextResponse.json(body, { status: 200 })
  } catch (err) {
    if (err instanceof VercelDomainsApiError) {
      // 404 from Vercel = not on this project. Could still be on a
      // sibling project in the same team — but we can only know for
      // sure by attempting the add. Treat 404 as "available enough"
      // and rely on the POST to surface team-wide conflicts cleanly.
      if (err.status === 404 || err.code === "not_found") {
        const body: CheckResponse = {
          domain,
          status: "available",
          message: "Looks available — click Add Domain to claim it.",
          canAdd: true,
        }
        return NextResponse.json(body, { status: 200 })
      }
      // 403 / forbidden often means a different team owns it.
      if (err.status === 403 || err.code === "forbidden") {
        const body: CheckResponse = {
          domain,
          status: "in_use_other_project",
          message:
            "This domain is registered to another Vercel team. Transfer it first or pick a different one.",
          canAdd: false,
        }
        return NextResponse.json(body, { status: 200 })
      }
      // Anything else — surface as unknown rather than blocking the user.
      const body: CheckResponse = {
        domain,
        status: "unknown",
        message: err.message || "Couldn't check availability — try anyway.",
        canAdd: true,
      }
      return NextResponse.json(body, { status: 200 })
    }

    const body: CheckResponse = {
      domain,
      status: "unknown",
      message: "Couldn't reach Vercel to check — try anyway.",
      canAdd: true,
    }
    return NextResponse.json(body, { status: 200 })
  }
}
