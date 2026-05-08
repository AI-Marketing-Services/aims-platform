import type { Template } from "./types"

/**
 * Template manifests. Each template defines an ordered, fixed list of
 * sections + opinionated default content. The defaults are written to
 * be production-ready out of the box — operators only edit what they
 * want to override; everything else renders the default copy.
 *
 * Defaults are intentionally generic (vs niche-specific) so the same
 * template works for an HVAC contractor, an AI consultant, or a
 * marketing agency. Niche-specific copy is the operator's job.
 *
 * To add a template:
 * 1. Push a new entry into TEMPLATES.
 * 2. Drop a thumbnail SVG/PNG into /public/website-templates/.
 * 3. Done — it appears in the editor's picker automatically.
 */
export const TEMPLATES: readonly Template[] = [
  // ──────────────────────────────────────────────────────────────────
  // SERVICE PRO — clean, conversion-focused, light mode. Default pick
  // for service-business operators (HVAC, plumbing, agencies, consulting).
  // ──────────────────────────────────────────────────────────────────
  {
    id: "service-pro",
    name: "Service Pro",
    tagline:
      "Clean, conversion-focused. The default for service businesses + agencies.",
    bestFor: "Agencies, consultants, contractors, B2B services",
    thumbnailUrl: "/website-templates/service-pro.svg",
    mode: "light",
    sections: [
      {
        id: "navbar",
        type: "navbar",
        defaults: {
          links: [
            { label: "Services", href: "#features" },
            { label: "How it works", href: "#how-it-works" },
            { label: "Pricing", href: "#pricing" },
            { label: "FAQ", href: "#faq" },
          ],
          ctaLabel: "Book a call",
        },
      },
      {
        id: "hero",
        type: "hero-center",
        defaults: {
          eyebrow: "AI-powered for service businesses",
          headline: "Spend less time on busywork. Win more clients.",
          subheadline:
            "We deploy AI workflows that handle lead intake, follow-up, and reporting — so your team focuses on closing, not chasing.",
          primaryCtaLabel: "Book a free consult",
          secondaryCtaLabel: "See what we do",
        },
      },
      {
        id: "logos",
        type: "logo-bar",
        // Default to empty so the section auto-hides until the operator
        // adds their own real client logos. The renderer returns null
        // when logos.length === 0 — visitors never see fake placeholder
        // brands like "Acme Co", "Globex" etc. Operators add real
        // proof when they have it.
        defaults: {
          caption: "Trusted by teams at",
          logos: [],
        },
      },
      {
        id: "features",
        type: "feature-grid-3",
        defaults: {
          eyebrow: "What we do",
          heading: "Done-for-you AI workflows that compound",
          subheading:
            "Three pillars. Every engagement maps to one of them — so you always know what you're paying for and what to expect.",
          items: [
            {
              iconName: "Bot",
              title: "Lead intake automation",
              description:
                "AI agents that qualify inbound leads in real time and route hot prospects to your inbox already pre-summarized.",
            },
            {
              iconName: "Workflow",
              title: "Follow-up sequences",
              description:
                "Multi-channel nurture across email, SMS, and call — personalized to each prospect's signal, never robotic.",
            },
            {
              iconName: "BarChart3",
              title: "Operational reporting",
              description:
                "Weekly automated reports on pipeline, conversion, and rep activity — so your leadership team sees what matters.",
            },
          ],
        },
      },
      {
        id: "process",
        type: "feature-split",
        defaults: {
          eyebrow: "Engagement model",
          heading: "Built around how you actually work",
          rows: [
            {
              title: "We map your current funnel.",
              body: "Two-week diagnostic. We sit with your team, document every handoff, and identify the leaks where AI can pay for itself in week one.",
              bullets: [
                "Workflow mapping (CRM, email, calls)",
                "Identify highest-leverage automations",
                "Prioritized 90-day roadmap",
              ],
            },
            {
              title: "We deploy and integrate.",
              body: "Done-for-you. We write the prompts, train the agents, wire the integrations, and test it under real load before handing keys.",
              bullets: [
                "Native integrations with your stack",
                "Custom AI agent prompts + guardrails",
                "Full QA before go-live",
              ],
            },
          ],
        },
      },
      {
        id: "testimonials",
        type: "testimonial-grid",
        // Empty by default — section auto-hides until the operator adds
        // real client quotes. No fake testimonials with invented names
        // ship to the live site.
        defaults: {
          eyebrow: "Proof",
          heading: "Operators who hired us once keep hiring us",
          items: [],
        },
      },
      {
        id: "pricing",
        type: "pricing-3",
        // Empty tiers — pricing varies wildly by operator (HVAC vs.
        // consultancy vs. real estate). Section auto-hides until the
        // operator adds their tiers. No invented dollar amounts ship
        // to the live site.
        defaults: {
          eyebrow: "Pricing",
          heading: "Simple, transparent pricing",
          subheading: "",
          tiers: [],
        },
      },
      {
        id: "faq",
        type: "faq",
        defaults: {
          eyebrow: "Questions",
          heading: "Things people always ask",
          items: [
            {
              question: "How long does a build sprint take?",
              answer:
                "Two weeks of diagnostic + four to six weeks of build, depending on integrations. We're rarely the slow part — usually it's getting access to your tools.",
            },
            {
              question: "Will we own what you build?",
              answer:
                "Yes. Every prompt, agent definition, and integration is deployed in your accounts. If you stop working with us, the automations keep running.",
            },
            {
              question: "What if we don't have a CRM yet?",
              answer:
                "We've stood up CRMs (HubSpot, Close, Pipedrive) for clients before — that work is part of the build sprint when needed, no extra fee.",
            },
            {
              question: "Do you work with our existing tools?",
              answer:
                "Yes. We integrate with whatever you're using. The diagnostic includes a tooling audit so we know what we're working with going in.",
            },
          ],
        },
      },
      {
        id: "cta",
        type: "cta-form",
        defaults: {
          eyebrow: "Ready to compound time?",
          heading: "Tell us where you're stuck.",
          subheading:
            "We'll come back within one business day with a 15-minute thought on whether we're the right fit.",
          buttonLabel: "Send message",
          successMessage:
            "Got it — we'll be in touch within one business day.",
        },
      },
      {
        id: "footer",
        type: "footer",
        defaults: {
          links: [
            { label: "Privacy", href: "/privacy" },
            { label: "Terms", href: "/terms" },
            { label: "Contact", href: "#contact" },
          ],
          socialLinks: [],
        },
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────
  // MODERN SAAS — feature-heavy, bold typography, bento grid. Default
  // pick for AI tools / B2B software operators with multiple capabilities.
  // ──────────────────────────────────────────────────────────────────
  {
    id: "modern-saas",
    name: "Modern SaaS",
    tagline:
      "Bold typography, bento features, screenshot-first. For AI tools + product-led services.",
    bestFor: "AI products, B2B software, technical services",
    thumbnailUrl: "/website-templates/modern-saas.svg",
    mode: "light",
    sections: [
      {
        id: "navbar",
        type: "navbar",
        defaults: {
          links: [
            { label: "Capabilities", href: "#capabilities" },
            { label: "How it works", href: "#how-it-works" },
            { label: "Pricing", href: "#pricing" },
          ],
          ctaLabel: "Get started",
        },
      },
      {
        id: "hero",
        type: "hero-split",
        defaults: {
          eyebrow: "Built for modern operators",
          headline: "AI workflows that work the way your team already works.",
          subheadline:
            "Skip the rip-and-replace pitch. We integrate with your existing tools, deploy in days, and prove ROI in weeks.",
          primaryCtaLabel: "See it in action",
          secondaryCtaLabel: "Book a demo",
        },
      },
      {
        id: "logos",
        type: "logo-bar",
        // Empty by default — the section auto-hides until the operator
        // adds their own real partner/customer logos. No fake brand
        // placeholders ever ship to the live site.
        defaults: {
          caption: "Powering teams at",
          logos: [],
        },
      },
      {
        id: "capabilities",
        type: "feature-grid-6",
        defaults: {
          eyebrow: "Capabilities",
          heading: "Everything an AI operator should ship.",
          subheading:
            "Six pillars. Mix and match by engagement — every deployment is built around what your team actually needs.",
          items: [
            {
              iconName: "Bot",
              title: "Conversational agents",
              description:
                "Voice + text agents that qualify, schedule, and follow up — 24/7, on-brand.",
            },
            {
              iconName: "Workflow",
              title: "Pipeline automation",
              description:
                "Multi-step flows that move data between your tools without the Zapier sprawl.",
            },
            {
              iconName: "BarChart3",
              title: "Reporting + insights",
              description:
                "Weekly auto-generated executive briefings — no more dashboard refresh roulette.",
            },
            {
              iconName: "Search",
              title: "Lead enrichment",
              description:
                "Every prospect arrives with company context, contact intel, and a recommended angle.",
            },
            {
              iconName: "MessageSquare",
              title: "Outbound personalization",
              description:
                "Cold emails written from real signal — opens 3× higher than generic templates.",
            },
            {
              iconName: "Shield",
              title: "Security + governance",
              description:
                "SOC 2 patterns. Your data stays in your accounts; we just orchestrate.",
            },
          ],
        },
      },
      {
        id: "process",
        type: "how-it-works",
        defaults: {
          eyebrow: "Engagement",
          heading: "Three steps. Then you're live.",
          steps: [
            {
              title: "Diagnose",
              description:
                "Two-week audit. We map your funnel, identify leaks, and prioritize by ROI.",
            },
            {
              title: "Build",
              description:
                "Done-for-you deployment. Native integrations. We handle prompts, guardrails, QA.",
            },
            {
              title: "Operate",
              description:
                "Weekly reviews. Monthly improvements. Quarterly strategy. We don't disappear after go-live.",
            },
          ],
        },
      },
      {
        id: "testimonials",
        type: "testimonial-grid",
        // Empty by default — section auto-hides until the operator adds
        // real client quotes. Replaces the previous testimonial-single
        // that shipped with a fake-named author.
        defaults: {
          eyebrow: "What operators say",
          heading: "Real outcomes from teams who shipped",
          items: [],
        },
      },
      {
        id: "pricing",
        type: "pricing-3",
        // Empty tiers — pricing varies by operator. Section auto-hides
        // until tiers are added. No invented dollar amounts ship live.
        defaults: {
          eyebrow: "Pricing",
          heading: "Simple, transparent pricing",
          subheading: "",
          tiers: [],
        },
      },
      {
        id: "cta",
        type: "cta-form",
        defaults: {
          eyebrow: "Start a conversation",
          heading: "Tell us what you're trying to ship.",
          subheading: "We'll come back with a 15-minute thought on fit.",
          buttonLabel: "Get in touch",
        },
      },
      {
        id: "footer",
        type: "footer",
        defaults: {
          links: [
            { label: "Privacy", href: "/privacy" },
            { label: "Terms", href: "/terms" },
          ],
          socialLinks: [],
        },
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────
  // LUXURY STUDIO — premium, restrained, white space-heavy. Default
  // pick for high-ticket coaches, premium agencies, design studios.
  // ──────────────────────────────────────────────────────────────────
  {
    id: "luxury-studio",
    name: "Luxury Studio",
    tagline:
      "Premium, restrained, generous white space. For high-ticket coaches + design studios.",
    bestFor: "High-ticket coaching, premium agencies, design studios",
    thumbnailUrl: "/website-templates/luxury-studio.svg",
    mode: "light",
    sections: [
      {
        id: "navbar",
        type: "navbar",
        defaults: {
          links: [
            { label: "Work", href: "#features" },
            { label: "Approach", href: "#how-it-works" },
            { label: "Studio", href: "#testimonials" },
          ],
          ctaLabel: "Begin a project",
        },
      },
      {
        id: "hero",
        type: "hero-center",
        defaults: {
          eyebrow: "Studio",
          headline: "Quietly excellent work for ambitious operators.",
          subheadline:
            "Selective engagements. Considered process. We take three projects per quarter — that's how we keep the work this good.",
          primaryCtaLabel: "Inquire",
        },
      },
      {
        id: "process",
        type: "feature-split",
        defaults: {
          eyebrow: "Approach",
          heading: "Few clients. Real partnership.",
          rows: [
            {
              title: "We say no a lot.",
              body: "Three engagements per quarter. The math forces us to pick the work that aligns with how we want to spend our weeks — and gives our clients more of our attention than any agency can.",
              bullets: [
                "Selective intake every quarter",
                "Direct access to senior team",
                "Capped client load by design",
              ],
            },
            {
              title: "We finish what we start.",
              body: "Most studios disappear after launch. We stay around — every engagement includes 90 days of post-launch optimization built in. The work has to actually perform, not just exist.",
              bullets: [
                "90-day post-launch optimization",
                "Quarterly strategy reviews built in",
                "On-call for ad-hoc questions",
              ],
            },
          ],
        },
      },
      {
        id: "testimonials",
        type: "testimonial-grid",
        // Empty by default — section auto-hides until the operator
        // adds real testimonials. No fake-named studio quotes ship.
        defaults: {
          eyebrow: "Testimonials",
          heading: "What clients have said",
          items: [],
        },
      },
      {
        id: "cta",
        type: "cta-form",
        defaults: {
          eyebrow: "Selective intake",
          heading: "Tell us about your project.",
          subheading:
            "We'll respond within one business day. Most engagements begin three weeks after the first conversation.",
          buttonLabel: "Submit inquiry",
          successMessage:
            "Thank you. We'll be in touch within one business day.",
        },
      },
      {
        id: "footer",
        type: "footer",
        defaults: {
          links: [
            { label: "Privacy", href: "/privacy" },
            { label: "Press", href: "#" },
          ],
          socialLinks: [],
        },
      },
    ],
  },
] as const

const TEMPLATES_BY_ID = Object.fromEntries(
  TEMPLATES.map((t) => [t.id, t]),
) as Record<string, Template>

export function getTemplate(id: string | null | undefined): Template | null {
  if (!id) return null
  return TEMPLATES_BY_ID[id] ?? null
}

/** Default template when an operator hasn't picked one yet. */
export const DEFAULT_TEMPLATE_ID = "service-pro"
