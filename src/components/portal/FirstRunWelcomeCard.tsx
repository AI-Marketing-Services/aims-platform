/**
 * FirstRunWelcomeCard — only renders for operators who haven't yet:
 *   - run an enrichment
 *   - imported a Scout deal
 *   - drafted a follow-up
 *   - used a playbook
 *
 * Shows a 4-step "your first hour on AIMS" path with one-click CTAs
 * deep-linking to each surface. Disappears the moment the operator
 * completes any of the actions — momentum-respecting (we don't want
 * to nag people who've started using the product).
 */
import Link from "next/link"
import {
  Sparkles,
  MapPin,
  Search,
  BookOpen,
  MessageSquare,
  ArrowRight,
} from "lucide-react"
import { db } from "@/lib/db"
import { EVENT_TYPES } from "@/lib/events/emit"

interface FirstRunWelcomeCardProps {
  userId: string
  firstName: string
}

export async function FirstRunWelcomeCard({ userId, firstName }: FirstRunWelcomeCardProps) {
  // Check if the operator has done ANY of the key first-week actions.
  // If they have, hide this card entirely.
  const sentinelEvents = await db.operatorEvent.count({
    where: {
      actorId: userId,
      type: {
        in: [
          EVENT_TYPES.DEAL_ENRICHED,
          EVENT_TYPES.SCOUT_DEAL_IMPORTED,
          EVENT_TYPES.PLAYBOOK_USED,
          EVENT_TYPES.AUDIT_COMPLETED,
        ],
      },
    },
  })

  // Also check for any ClientDeal (manual or scout) — if they've created
  // even one deal, they're past first-run.
  const dealCount = await db.clientDeal.count({ where: { userId } })

  if (sentinelEvents > 0 || dealCount > 0) return null

  return (
    <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Welcome to your AI operations hub, {firstName}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pick any of these to start your first hour. The platform gets more
            valuable the more leads + plays you run through it.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FirstRunStep
          icon={<MapPin className="h-4 w-4" />}
          title="Discover prospects via Google Maps"
          description="Search any business type + location. Results dedup against your CRM. Try 'HVAC companies in Austin TX'."
          href="/portal/crm/scout"
          cta="Open Scout"
          time="2 min"
        />
        <FirstRunStep
          icon={<Search className="h-4 w-4" />}
          title="Enrich a lead's full profile"
          description="Add a Deal manually or import via Scout, then click Enrich. AI fills company description, employees, revenue, contacts."
          href="/portal/crm"
          cta="Open CRM"
          time="3 min"
        />
        <FirstRunStep
          icon={<BookOpen className="h-4 w-4" />}
          title="Browse the playbook library"
          description="40+ proven AI service plays organized by industry. Each has a pitch line, tools, monthly value, and difficulty."
          href="/portal/playbooks"
          cta="See playbooks"
          time="5 min"
        />
        <FirstRunStep
          icon={<MessageSquare className="h-4 w-4" />}
          title="Try the AI proposal generator"
          description="On any enriched Deal, click 'Generate AI Proposal' → 'Recommend' and watch a tailored pitch fill in."
          href="/portal/crm"
          cta="Open CRM"
          time="2 min"
        />
      </div>

      <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground border-t border-border/50">
        <span>This card disappears as soon as you complete any of these.</span>
        <Link
          href="/portal/billing"
          className="inline-flex items-center gap-1 hover:text-primary"
        >
          Manage credits
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </section>
  )
}

function FirstRunStep({
  icon,
  title,
  description,
  href,
  cta,
  time,
}: {
  icon: React.ReactNode
  title: string
  description: string
  href: string
  cta: string
  time: string
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-border bg-background hover:border-primary/40 hover:bg-primary/5 transition-all p-4"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
          <p className="text-sm font-bold text-foreground">{title}</p>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider shrink-0">
          {time}
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed mb-2.5">
        {description}
      </p>
      <span className="text-xs text-primary font-semibold inline-flex items-center gap-1 group-hover:gap-2 transition-all">
        {cta}
        <ArrowRight className="h-3 w-3" />
      </span>
    </Link>
  )
}
