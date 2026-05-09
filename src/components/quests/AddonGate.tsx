import Link from "next/link"
import { ArrowRight, Lock, Sparkles } from "lucide-react"
import { ensureDbUser } from "@/lib/auth/ensure-user"
import { hasEntitlement } from "@/lib/entitlements"
import { getAddon } from "@/lib/plans/addons"

interface Props {
  /** A-la-carte entitlement key (e.g. "addon_voice_agent"). */
  entitlementKey: string
  /** Slug used to look up the Product / addon definition. */
  addonSlug: string
  children: React.ReactNode
}

/**
 * Server-side gate for a-la-carte tool surfaces.
 *
 * Mirrors EntitlementGate's contract but for `addon_*` entitlements
 * (granted by Product rows of type="addon"). On miss, renders a card
 * pointing the user at the marketplace card for this specific add-on
 * — not a generic "upgrade your plan" paywall, because add-ons are
 * orthogonal to plan tiers.
 *
 * ADMIN / SUPER_ADMIN bypass — same rationale as EntitlementGate.
 */
export async function AddonGate({ entitlementKey, addonSlug, children }: Props) {
  const user = await ensureDbUser()

  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
    return <>{children}</>
  }

  const granted = await hasEntitlement(user.id, entitlementKey)
  if (granted) return <>{children}</>

  const addon = getAddon(addonSlug)
  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-2xl border border-border bg-card p-8 space-y-6 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mx-auto">
          <Lock className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {addon?.name ?? "Add-on required"}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {addon?.tagline ??
              "This tool is an a-la-carte add-on. Activate it from the marketplace."}
          </p>
        </div>

        {addon?.description ? (
          <p className="text-sm text-foreground/80 leading-relaxed">{addon.description}</p>
        ) : null}

        {addon?.highlights ? (
          <ul className="text-sm text-muted-foreground space-y-1.5 text-left max-w-md mx-auto">
            {addon.highlights.slice(0, 5).map((h, i) => (
              <li key={i} className="flex items-start gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary mt-1 flex-shrink-0" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            href="/portal/marketplace#addons"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold hover:opacity-90"
          >
            {addon ? `Add ${addon.name} ($${addon.price}${addon.pricing === "recurring" ? "/mo" : ""})` : "View marketplace"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {addon?.launchStatus === "configure" ? (
          <p className="text-xs text-muted-foreground">
            DFY: our team configures + ships within 7 business days of purchase.
          </p>
        ) : null}
      </div>
    </div>
  )
}
