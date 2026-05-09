import { NextResponse } from "next/server"
import { z } from "zod"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"
import { hasEntitlement } from "@/lib/entitlements"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { getAddon } from "@/lib/plans/addons"
import { notify } from "@/lib/notifications"

export const dynamic = "force-dynamic"

const bodySchema = z.object({
  slug: z.string().min(1).max(100),
  // Free-form configuration. We don't constrain the shape because each
  // add-on has its own fields; we just cap each value to keep one bad
  // actor from filling the JSON column with megabytes.
  data: z.record(z.string(), z.string().max(5000)),
})

/**
 * POST /api/portal/addons/intake
 *
 * Captures configuration submissions from the AddonConfigCard for any
 * "configure-only" add-on. We only accept submissions from users who
 * actually own the add-on — verified via hasEntitlement — to avoid
 * scraping the JSON column with throwaway accounts.
 *
 * Submissions are stored on a SupportTicket row tagged with
 * `category="addon-intake"` so they show up in /admin/support inbox
 * alongside everything else the services team works through. Each
 * intake also Slack-pings the team.
 */
export async function POST(req: Request) {
  const userId = await ensureDbUserIdForApi()
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const addon = getAddon(parsed.data.slug)
  if (!addon) {
    return NextResponse.json({ error: "unknown_addon" }, { status: 404 })
  }

  // Verify the user actually owns this add-on. ADMINs bypass since they
  // submit test intakes during QA.
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, role: true, company: true },
  })
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"
  if (!isAdmin) {
    const owns = await Promise.all(
      addon.entitlements.map((k) => hasEntitlement(userId, k)),
    )
    if (!owns.some(Boolean)) {
      return NextResponse.json({ error: "addon_not_owned" }, { status: 403 })
    }
  }

  // Persist as a SupportTicket so the existing /admin/support inbox
  // surfaces it. Adding a dedicated table would be premature.
  const summary = `${addon.name} setup intake — ${user?.email ?? userId}`
  const details = Object.entries(parsed.data.data)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n")

  await db.supportTicket
    .create({
      data: {
        userId,
        subject: summary,
        priority: "normal",
        status: "open",
        // SupportTicket has `message` (Text) — embed both the human-
        // readable details + a JSON tag-line so the admin inbox can
        // filter by "category=addon-intake" without a schema change.
        message: `[addon-intake] slug=${addon.slug} name=${addon.name}\n\n${details}`,
      },
    })
    .catch((err) =>
      logger.error("addon-intake supportTicket.create failed", err, {
        userId,
        slug: addon.slug,
      }),
    )

  // Non-blocking Slack + internal email ping so the services team gets a heads-up.
  notify({
    type: "addon_intake",
    title: `New add-on intake — ${addon.name}`,
    message: `Customer: ${user?.email ?? userId} (${user?.company ?? "—"})\nSlug: ${addon.slug}`,
    channel: "ALL",
    urgency: "normal",
    metadata: { addonSlug: addon.slug, userId },
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
