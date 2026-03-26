// Service Demo Section — decomposed into sub-components.
// Each demo is in its own file; the remaining smaller demos are kept inline
// in this index for practical reasons (they are under 100 lines each).
//
// Re-exports ServiceDemoSection and ServiceDemoWidget for backwards compat.

"use client"

import { WildDucksDemo } from "./WildDucksDemo"
import { SteelTrapDemo } from "./SteelTrapDemo"
import { AICallingDemo } from "./AICallingDemo"
import { ContentDemo } from "./ContentDemo"
import { ReactivationDemo } from "./ReactivationDemo"
import { DatabaseDemo } from "./DatabaseDemo"
import { WebsiteCRMDemo } from "./WebsiteCRMDemo"
import { FinanceDemo } from "./FinanceDemo"
import { AudienceDemo } from "./AudienceDemo"
import { MoneyPageDemo } from "./MoneyPageDemo"

const DEMO_MAP: Record<string, React.ComponentType> = {
  "cold-outbound": WildDucksDemo,
  "revops-pipeline": SteelTrapDemo,
  "voice-agents": AICallingDemo,
  "content-production": ContentDemo,
  "lead-reactivation": ReactivationDemo,
  "database-reactivation": DatabaseDemo,
  "website-crm-chatbot": WebsiteCRMDemo,
  "finance-automation": FinanceDemo,
  "audience-targeting": AudienceDemo,
  "seo-aeo": MoneyPageDemo,
}

export function ServiceDemoWidget({ slug }: { slug: string }) {
  const Demo = DEMO_MAP[slug]
  if (!Demo) return null
  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-md">
      <Demo />
    </div>
  )
}

export function ServiceDemoSection({ slug }: { slug: string }) {
  const Demo = DEMO_MAP[slug]
  if (!Demo) return null

  return (
    <section className="py-20 bg-deep">
      <div className="container mx-auto max-w-4xl px-4">
        <h2 className="text-2xl font-bold text-foreground mb-2">See It In Action</h2>
        <p className="text-muted-foreground mb-8">Live interactive preview - this is what we build for you.</p>
        <div className="bg-card rounded-2xl border border-border p-8 shadow-sm max-w-lg mx-auto">
          <Demo />
        </div>
      </div>
    </section>
  )
}
