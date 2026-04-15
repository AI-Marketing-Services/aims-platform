import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  Sparkles,
  BookOpen,
  Zap,
  Target,
  BarChart3,
  Workflow,
  Users,
  DollarSign,
  MessageSquare,
  FileText,
  Megaphone,
  Briefcase,
  Code,
  Settings,
} from "lucide-react"
import { AIPlaybookCapture } from "@/components/tools/ai-operating-system/AIPlaybookCapture"

export const metadata: Metadata = {
  title: "The AI Operating System for Business Owners | AIMS Playbook",
  description:
    "Deploy AI across every department without hiring or getting technical. A 4-part playbook with 30+ ready-to-use prompts for Marketing, Sales, Customer Success, Product, Engineering, and Operations.",
  alternates: { canonical: "https://aimseos.com/tools/ai-operating-system" },
  openGraph: {
    type: "article",
    url: "https://aimseos.com/tools/ai-operating-system",
    title: "The AI Operating System for Business Owners",
    description:
      "Deploy AI across every department. 4-part playbook + 30 ready-to-run prompts. Free PDF, no fluff.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
}

const STEPS = [
  {
    icon: Target,
    step: "Step 1",
    title: "Audit the Business",
    description:
      "Pinpoint where AI can immediately reclaim time, eliminate errors, and multiply output across Sales, Ops, Marketing, Finance, HR, and Customer Success.",
  },
  {
    icon: Workflow,
    step: "Step 2",
    title: "Choose Tools and Build Workflows",
    description:
      "Map the right AI tools to each function and build automated workflows with a clear Trigger → AI → Automation → Human pattern.",
  },
  {
    icon: BarChart3,
    step: "Step 3",
    title: "Test, Automate, and Measure",
    description:
      "Start with one high-value process, prove ROI fast, and track time saved, cost, output consistency, and overall ROI.",
  },
  {
    icon: Sparkles,
    step: "Step 4",
    title: "Scale Your AI Deployment",
    description:
      "Standardize winning workflows into SOPs, build a team that thinks in automations, and turn AI into a company-wide operating system.",
  },
]

const PROMPT_SECTIONS = [
  {
    icon: Megaphone,
    title: "Marketing",
    count: 5,
    examples: "Short-form scripts, YouTube outlines, hook banks, ad angles, newsletter builder",
  },
  {
    icon: DollarSign,
    title: "Sales",
    count: 4,
    examples: "Speed-to-lead scripts, DM starters, discovery call prep, objection handling",
  },
  {
    icon: Users,
    title: "Customer Success",
    count: 4,
    examples: "Day-0 quick-start, risk radar, QBR outlines, expansion scripts",
  },
  {
    icon: FileText,
    title: "Product",
    count: 5,
    examples: "Opportunity ranking, one-page specs, experiment design, VoC digests, release notes",
  },
  {
    icon: Code,
    title: "Engineering",
    count: 5,
    examples: "PR review summaries, bug triage, doc updates, test plan scaffolds, release checklists",
  },
  {
    icon: Settings,
    title: "Operations",
    count: 3,
    examples: "Weekly KPI packs, month-end close checklists, daily cash and anomaly reports",
  },
]

export default function AIOperatingSystemPage() {
  return (
    <div className="min-h-screen bg-deep">
      {/* HERO */}
      <section className="relative border-b border-border bg-gradient-to-b from-card to-deep">
        <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-xs font-mono uppercase tracking-wider rounded-full mb-6">
            <BookOpen className="w-3.5 h-3.5" />
            Free PDF Playbook
          </div>
          <h1 className="font-serif text-4xl sm:text-6xl text-foreground leading-tight mb-6">
            The AI Operating System{" "}
            <span className="block text-primary italic">for Business Owners.</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
            Roll out AI across every department without hiring or getting technical.
            A 4-part deployment playbook with 30+ ready-to-use prompts.
            Copy, paste, ship.
          </p>

          <AIPlaybookCapture variant="hero" />

          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 max-w-2xl mx-auto">
            {[
              { icon: Briefcase, label: "4-part playbook" },
              { icon: Zap, label: "30+ ready prompts" },
              { icon: MessageSquare, label: "Master prompt template" },
              { icon: BookOpen, label: "PDF delivered instantly" },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-card border border-border rounded-md p-3 flex items-center gap-2"
              >
                <item.icon className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-xs text-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEM / HOOK */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <p className="text-xs font-mono uppercase tracking-wider text-primary mb-4 text-center">
          The reality
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl text-foreground leading-tight mb-6 text-center">
          Most founders buy AI like a shiny object.
        </h2>
        <div className="space-y-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
          <p>
            Smart founders use AI like a competitive weapon. The difference is not the tools — it is the system.
            This playbook gives you the exact process for integrating AI across your business without needing to
            hire additional staff, learn technical skills, or build complex systems.
          </p>
          <p>
            Our approach implements AI in a simple, practical way that enhances your existing operations, team,
            and workflows. Not just automation — an operating system where AI works alongside your team, driving
            results that feel effortless and sustainable.
          </p>
          <p className="text-foreground font-semibold">
            Remove costs. Move faster. Scale without adding headcount.
          </p>
        </div>
      </section>

      {/* 4 STEPS */}
      <section className="border-t border-border bg-gradient-to-b from-deep to-card/30">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <p className="text-xs font-mono uppercase tracking-wider text-primary mb-3">
              Inside the playbook
            </p>
            <h2 className="font-serif text-3xl sm:text-5xl text-foreground leading-tight mb-4">
              The 4-Part AI{" "}
              <span className="text-primary italic">Deployment Playbook.</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {STEPS.map((item) => (
              <div
                key={item.step}
                className="bg-card border border-border rounded-lg p-6 hover:border-primary/40 transition-colors group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs font-mono uppercase tracking-wider text-primary">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROMPT LIBRARY PREVIEW */}
      <section className="border-t border-border">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <p className="text-xs font-mono uppercase tracking-wider text-primary mb-3">
              Also included
            </p>
            <h2 className="font-serif text-3xl sm:text-5xl text-foreground leading-tight mb-4">
              30+ Ready-to-Deploy{" "}
              <span className="text-primary italic">Business Prompts.</span>
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              Each prompt uses the RCCF format (Role, Context, Command, Format) for
              consistent, high-quality AI output. Copy, customize, and ship.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PROMPT_SECTIONS.map((section) => (
              <div
                key={section.title}
                className="bg-card border border-border rounded-lg p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <section.icon className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">{section.title}</h3>
                  <span className="ml-auto text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {section.count}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {section.examples}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT AIMS DOES */}
      <section className="border-y border-primary/30 bg-gradient-to-r from-primary/10 via-card to-primary/10">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <p className="text-xs font-mono uppercase tracking-wider text-primary mb-3">
            Or let us handle it
          </p>
          <h3 className="font-serif text-2xl sm:text-4xl text-foreground leading-tight mb-4">
            Want AIMS to deploy this for you?
          </h3>
          <p className="text-base text-muted-foreground mb-6 max-w-xl mx-auto">
            AIMS builds AI infrastructure for businesses. We audit your operations,
            deploy the right tools, and manage the workflows — so you get the results
            without the learning curve.
          </p>
          <Link
            href="/get-started"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-white font-semibold rounded-md hover:bg-primary/90 transition-colors"
          >
            Book a Free Strategy Call <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-muted-foreground mt-4">
            No pitch. Just a working session to map AI to your business.
          </p>
        </div>
      </section>

      {/* FINAL CTA + EMAIL CAPTURE */}
      <section className="border-t border-primary/30 bg-gradient-to-b from-card to-deep">
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <Sparkles className="w-10 h-10 text-primary mx-auto mb-5" />
          <h2 className="font-serif text-3xl sm:text-5xl text-foreground leading-tight mb-5">
            Get the playbook. Ship today.
          </h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto mb-10">
            Drop your email and we will send the full AI Operating System Playbook
            PDF to your inbox. Pick one department, paste the Master Prompt, run
            one RCCF prompt, and ship one asset today.
          </p>

          <AIPlaybookCapture variant="footer" />

          <div className="mt-12 pt-10 border-t border-border">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
              Or skip the email
            </p>
            <Link
              href="/get-started"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-card border border-primary/40 text-primary font-semibold rounded-md hover:border-primary hover:bg-primary/10 transition-colors"
            >
              Talk to AIMS directly <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* DISCLOSURES */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 py-10 text-center">
          <p className="text-xs text-muted-foreground leading-relaxed">
            AIMS (AI Managing Services) makes no income, earnings, or outcome
            claims. This playbook is educational. Any results referenced are
            illustrative and not representative of typical outcomes. Your results
            depend on your own execution, market, and effort.
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            Operated by Modern Amenities LLC · Powered by AIMS
          </p>
        </div>
      </footer>
    </div>
  )
}
