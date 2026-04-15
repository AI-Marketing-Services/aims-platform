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
  alternates: { canonical: "https://www.aioperatorcollective.com/tools/ai-operating-system" },
  openGraph: {
    type: "article",
    url: "https://www.aioperatorcollective.com/tools/ai-operating-system",
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
      "Map the right AI tools to each function and build automated workflows with a clear Trigger, AI, Automation, Human pattern.",
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
    <div>
      {/* HERO */}
      <section className="relative border-b border-[#E3E3E3] bg-white">
        <div className="max-w-4xl mx-auto px-6 py-16 sm:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-crimson/5 text-crimson text-xs font-mono uppercase tracking-[0.2em] rounded-full mb-6 border border-crimson/15">
            <BookOpen className="w-3.5 h-3.5" />
            Free PDF Playbook
          </div>
          <h1 className="font-playfair text-4xl sm:text-6xl text-[#1A1A1A] leading-tight mb-6">
            The AI Operating System{" "}
            <span className="block text-crimson italic">for Business Owners.</span>
          </h1>
          <p className="text-lg sm:text-xl text-[#737373] max-w-2xl mx-auto leading-relaxed mb-10">
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
                className="bg-white border border-[#E3E3E3] rounded-md p-3 flex items-center gap-2"
              >
                <item.icon className="w-4 h-4 text-crimson flex-shrink-0" />
                <span className="text-xs text-[#1A1A1A]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEM / HOOK */}
      <section className="bg-[#F5F5F5]">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-crimson mb-4 text-center">
            The reality
          </p>
          <h2 className="font-playfair text-3xl sm:text-4xl text-[#1A1A1A] leading-tight mb-6 text-center">
            Most founders buy AI like a shiny object.
          </h2>
          <div className="space-y-5 text-base sm:text-lg text-[#737373] leading-relaxed">
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
            <p className="text-[#1A1A1A] font-semibold">
              Remove costs. Move faster. Scale without adding headcount.
            </p>
          </div>
        </div>
      </section>

      {/* 4 STEPS */}
      <section className="border-t border-[#E3E3E3] bg-white">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-crimson mb-3">
              Inside the playbook
            </p>
            <h2 className="font-playfair text-3xl sm:text-5xl text-[#1A1A1A] leading-tight mb-4">
              The 4-Part AI{" "}
              <span className="text-crimson italic">Deployment Playbook.</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {STEPS.map((item) => (
              <div
                key={item.step}
                className="bg-white border border-[#E3E3E3] rounded-md p-6 hover:border-crimson/30 hover:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.1)] transition-all group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-crimson/5 rounded-md flex items-center justify-center border border-crimson/15 group-hover:bg-crimson/10 transition-colors">
                    <item.icon className="w-5 h-5 text-crimson" />
                  </div>
                  <span className="text-xs font-mono uppercase tracking-[0.2em] text-crimson">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">{item.title}</h3>
                <p className="text-sm text-[#737373] leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROMPT LIBRARY PREVIEW */}
      <section className="border-t border-[#E3E3E3] bg-[#F5F5F5]">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-crimson mb-3">
              Also included
            </p>
            <h2 className="font-playfair text-3xl sm:text-5xl text-[#1A1A1A] leading-tight mb-4">
              30+ Ready-to-Deploy{" "}
              <span className="text-crimson italic">Business Prompts.</span>
            </h2>
            <p className="text-base text-[#737373] max-w-2xl mx-auto">
              Each prompt uses the RCCF format (Role, Context, Command, Format) for
              consistent, high-quality AI output. Copy, customize, and ship.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PROMPT_SECTIONS.map((section) => (
              <div
                key={section.title}
                className="bg-white border border-[#E3E3E3] rounded-md p-5 hover:border-crimson/30 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <section.icon className="w-5 h-5 text-crimson" />
                  <h3 className="font-semibold text-[#1A1A1A]">{section.title}</h3>
                  <span className="ml-auto text-xs font-mono text-crimson bg-crimson/5 px-2 py-0.5 rounded-full border border-crimson/15">
                    {section.count}
                  </span>
                </div>
                <p className="text-xs text-[#737373] leading-relaxed">
                  {section.examples}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT AIMS DOES */}
      <section className="border-y border-crimson/20 bg-crimson/5">
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-crimson mb-3">
            Or let us handle it
          </p>
          <h3 className="font-playfair text-2xl sm:text-4xl text-[#1A1A1A] leading-tight mb-4">
            Want AIMS to deploy this for you?
          </h3>
          <p className="text-base text-[#737373] mb-6 max-w-xl mx-auto">
            AIMS builds AI infrastructure for businesses. We audit your operations,
            deploy the right tools, and manage the workflows — so you get the results
            without the learning curve.
          </p>
          <Link
            href="/apply"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-crimson text-white font-bold text-sm uppercase tracking-wider rounded-md hover:bg-crimson-dark transition-all shadow-[0_8px_24px_-4px_rgba(153,27,27,0.35)]"
          >
            Book a Free Strategy Call <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-[#737373] mt-4">
            No pitch. Just a working session to map AI to your business.
          </p>
        </div>
      </section>

      {/* FINAL CTA + EMAIL CAPTURE */}
      <section className="bg-white">
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <Sparkles className="w-10 h-10 text-crimson mx-auto mb-5" />
          <h2 className="font-playfair text-3xl sm:text-5xl text-[#1A1A1A] leading-tight mb-5">
            Get the playbook. Ship today.
          </h2>
          <p className="text-base text-[#737373] max-w-xl mx-auto mb-10">
            Drop your email and we will send the full AI Operating System Playbook
            PDF to your inbox. Pick one department, paste the Master Prompt, run
            one RCCF prompt, and ship one asset today.
          </p>

          <AIPlaybookCapture variant="footer" />

          <div className="mt-12 pt-10 border-t border-[#E3E3E3]">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#737373] mb-4">
              Or skip the email
            </p>
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white border border-crimson/30 text-crimson font-semibold rounded-md hover:border-crimson hover:bg-crimson/5 transition-colors"
            >
              Talk to AIMS directly <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* DISCLOSURES */}
      <section className="border-t border-[#E3E3E3] bg-[#F5F5F5]">
        <div className="max-w-3xl mx-auto px-6 py-10 text-center">
          <p className="text-xs text-[#737373] leading-relaxed">
            AIMS (AI Managing Services) makes no income, earnings, or outcome
            claims. This playbook is educational. Any results referenced are
            illustrative and not representative of typical outcomes. Your results
            depend on your own execution, market, and effort.
          </p>
        </div>
      </section>
    </div>
  )
}
