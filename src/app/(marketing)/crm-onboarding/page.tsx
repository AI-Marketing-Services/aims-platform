"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Play,
  Globe,
  Calendar,
  Bot,
  PenTool,
  Workflow,
  Cpu,
  Shield,
  Star,
  Mic,
  MessageSquare,
  AlertTriangle,
  ExternalLink,
  X,
} from "lucide-react"
import { OnboardingChatWidget } from "@/components/marketing/OnboardingChatWidget"

/* ------------------------------------------------------------------ */
/*  CONSTANTS                                                          */
/* ------------------------------------------------------------------ */

const VIDEO_PART1 = "https://vimeo.com/1175573132?fl=ip&fe=ec"
const VIDEO_PART2 = "https://vimeo.com/1174987065?fl=ip&fe=ec"
const ONBOARDING_FORM = "https://app.aimanagingservices.com/v2/preview/JAPEyRSFNoFYeSIBuSPs"
const DNS_GODADDY = "https://youtu.be/CxCIPrme700?si=5oQfOTFLTdr7BYtG"
const DNS_NAMECHEAP = "https://youtu.be/p0KqYLTdKbs?si=rSsukgeb7JqwO5QN"
const DNS_CLOUDFLARE = "https://youtu.be/au4rL36eq3c?si=NXncfeioNMM2EKDR"

const CHECKLIST_PHASES = [
  {
    title: "Account & Profile",
    timeline: "Day 1",
    items: [
      "Check your inbox (and spam/junk folder) for the portal invite email from AIMS",
      "Open your welcome email and click the activation link",
      "Create your password and log in",
      "Complete two-factor authentication",
      "Go to Settings > Business Profile and fill in all fields",
      "Go to Settings > Custom Values and update every placeholder with your business info",
    ],
  },
  {
    title: "Calendar & Scheduling",
    timeline: "Day 1-2",
    items: [
      "Navigate to Calendars and activate your pre-built calendar",
      'Rename the calendar with your name (e.g., "Your Name - Consultation")',
      "Set your availability hours and appointment duration",
      "Connect Google Calendar or Outlook for sync",
      "Connect Google Meet or Zoom for automatic meeting links",
      "Test the booking flow from your website",
    ],
  },
  {
    title: "Website & Funnels",
    timeline: "Day 2-3",
    items: [
      "Go to Sites > Websites and browse all 7 templates",
      "Select and duplicate your chosen template",
      "Replace all placeholder text with your business info",
      "Upload your logo (500x500px, PNG or JPG)",
      "Customize colors to match your brand",
      "Preview and save",
    ],
  },
  {
    title: "Automations",
    timeline: "Day 3-4",
    items: [
      "Open the Calendar Booking workflow and assign yourself as active user",
      "Open the Form Submission workflow and assign yourself as active user",
      "Save both workflows",
      "Test with a real submission to verify everything fires",
    ],
  },
  {
    title: "AI Setup",
    timeline: "Day 4-5",
    items: [
      "Go to Settings > Knowledge Base and update all fields with your business details",
      "Go to Conversational AI > Agents and update the agent with your business name",
      "Update Board Training with your business name",
      "Attach your calendar to the chat bot",
      "Add the chat widget to your website",
      'Set the bot as "Primary" in Conversational AI settings',
      "Test the chat widget",
    ],
  },
  {
    title: "Domain & DNS",
    timeline: "Week 1-2",
    items: [
      "Go to Settings > Domains and add your custom domain",
      "Copy the A Record and CNAME values from GHL",
      "Log in to your domain registrar and add both DNS records",
      "Wait for propagation (15 min to 48 hours)",
      "Return to GHL and verify the connection",
      "Enable SSL certificate",
      "Assign your website template to the connected domain",
    ],
  },
  {
    title: "Advanced Setup",
    timeline: "Week 2+",
    items: [
      "Add a custom email domain with SPF, DKIM, and DMARC records",
      "Purchase a phone number if needed",
      "Start A2P 10DLC registration for SMS compliance",
      "Connect reputation management (Google Business, Facebook, Yelp)",
      "Connect Stripe for payments if applicable",
      "Configure Voice AI (Route Owners & Vending Empires only)",
    ],
  },
]

const BENTO_FEATURES = [
  { icon: Globe, title: "CRM & Website", features: ["Unlimited contacts & locations", "7 website templates ready to launch", "Smart tagging & segmentation"] },
  { icon: PenTool, title: "Sales Pipeline", features: ["Drag-and-drop deal management", "Automated follow-up sequences", "Revenue tracking & forecasting"] },
  { icon: Workflow, title: "Automations", features: ["Pre-built email & SMS workflows", "Booking automation with reminders", "New lead alerts & auto-tagging"] },
  { icon: Bot, title: "AI Chat Agent", features: ["Trained on your business info", "Books appointments 24/7", "Knowledge Base you control"] },
  { icon: MessageSquare, title: "Unified Inbox", features: ["SMS, email, chat, social DMs", "Two-way texting & call logs", "Custom email domain support"] },
  { icon: Star, title: "Reputation Manager", features: ["Automated review requests", "Positive ratings go public", "Negative feedback stays private"] },
  { icon: Calendar, title: "Booking Calendar", features: ["Google Calendar & Outlook sync", "Zoom & Meet integration", "Embedded on your website"] },
  { icon: Mic, title: "Voice AI", features: ["Automated phone handling", "Qualifies callers & books appts", "Premium plans only"] },
  { icon: Shield, title: "Compliance & SMS", features: ["A2P 10DLC registration support", "Phone number included (premium)", "Carrier-compliant messaging"] },
]

const PLANS = [
  {
    name: "Starter",
    features: [
      { name: "7 Website Templates", included: true },
      { name: "Booking Calendar", included: true },
      { name: "Lead Capture & Automations", included: true },
      { name: "CRM & Pipeline", included: true },
      { name: "Unified Inbox", included: true },
      { name: "AI Chat", included: false },
      { name: "Voice AI", included: false },
    ],
  },
  {
    name: "Premium",
    popular: true,
    features: [
      { name: "Everything in Starter", included: true },
      { name: "AI Chat Assistant", included: true },
      { name: "Knowledge Base Configuration", included: true },
      { name: "Advanced Automations", included: true },
      { name: "AI Chat", included: true },
      { name: "Voice AI", included: false },
    ],
  },
  {
    name: "Route Owner / Vending Empire",
    features: [
      { name: "Everything in Premium", included: true },
      { name: "Voice AI (Automated Phone Handling)", included: true },
      { name: "Phone Number Included", included: true },
      { name: "Advanced Integrations", included: true },
      { name: "AI Chat", included: true },
      { name: "Voice AI", included: true },
    ],
  },
]

const MISTAKES = [
  { title: "Not assigning yourself in workflows", desc: "Both pre-built automations require you to assign yourself as active user. Without this, no notifications or tasks get created. This is the number one setup issue." },
  { title: "Editing the original template", desc: "Always duplicate the template before customizing. If you edit the original and break something, you lose the clean starting point." },
  { title: "Skipping Custom Values", desc: 'If you don\'t update Custom Values in Settings, placeholder text like "Your Business Name" will show up across your entire CRM, emails, and website.' },
  { title: "Not setting the AI bot as Primary", desc: 'The chat widget won\'t respond to messages unless the Conversational AI bot is toggled to "Primary." This is a one-click fix most people miss.' },
  { title: "Forgetting DNS records", desc: "Your custom domain won't connect without both the A Record and CNAME added at your registrar. Use the DNS tutorial videos above for your specific provider." },
]

const FAQS = [
  { q: "How long does setup take?", a: "Most users complete basic setup in 1-2 days. Full configuration with DNS, AI, and advanced features takes about a week." },
  { q: "Do I need technical skills?", a: "No. Everything is pre-built and ready to customize. The setup videos walk you through every step." },
  { q: "Can I use my existing domain?", a: "Yes. Connect it through Settings > Domains and add the required DNS records at your registrar." },
  { q: "What if I don't have a domain?", a: "You can purchase one directly within AIMS CRM through Settings > Domains." },
  { q: "Why isn't my AI chat responding?", a: 'Make sure the bot is set as "Primary" in Conversational AI settings. Also verify the Knowledge Base is filled out and Board Training has your business name.' },
  { q: "What is A2P 10DLC?", a: "A carrier-mandated registration required to send SMS at scale in the US. You'll need your EIN and business documentation. Contact support for help with this." },
  { q: "Can I upgrade my plan later?", a: "Yes. Contact support anytime to upgrade to a higher tier." },
  { q: "What happens when someone fills out my form?", a: "The automation creates a CRM contact, tags them as a lead, creates a pipeline opportunity, sends them a confirmation email, and notifies you with their details." },
]

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "aims-onboarding-checklist"

function loadChecked(): Record<string, boolean> {
  if (typeof window === "undefined") return {}
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
  } catch {
    return {}
  }
}

function saveChecked(state: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch { /* noop */ }
}

/* ------------------------------------------------------------------ */
/*  MAIN PAGE                                                          */
/* ------------------------------------------------------------------ */

export default function CRMOnboardingPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [openPhases, setOpenPhases] = useState<Record<number, boolean>>({ 0: true })
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // Load checklist state from localStorage
  useEffect(() => {
    setChecked(loadChecked())
  }, [])

  const toggleCheck = (key: string) => {
    const next = { ...checked, [key]: !checked[key] }
    setChecked(next)
    saveChecked(next)
  }

  const togglePhase = (i: number) => {
    setOpenPhases((prev) => ({ ...prev, [i]: !prev[i] }))
  }

  // Calculate overall progress
  const totalItems = CHECKLIST_PHASES.reduce((sum, p) => sum + p.items.length, 0)
  const checkedCount = Object.values(checked).filter(Boolean).length
  const progress = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0

  return (
    <div className="min-h-screen bg-background">

      {/* ============================================================ */}
      {/*  SECTION 1: HERO                                             */}
      {/* ============================================================ */}
      <section className="pt-28 pb-16 bg-gradient-to-b from-background to-deep">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-6">
            <Cpu className="w-3.5 h-3.5" />
            AIMS CRM Onboarding
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight text-foreground">
            Welcome to AIMS CRM
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your all-in-one vending business platform. Everything you need to launch, manage, and grow - set up and ready to go.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={ONBOARDING_FORM}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-sm hover:bg-primary/90 transition-colors"
            >
              Get Started - Purchase Your Plan
              <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="#setup-videos"
              className="inline-flex items-center gap-2 px-8 py-4 border border-border bg-card text-foreground font-semibold rounded-sm hover:bg-deep transition-colors"
            >
              <Play className="w-5 h-5" />
              Watch the Setup Videos
            </a>
          </div>

          {/* Progress bar */}
          {checkedCount > 0 && (
            <div className="mt-10 max-w-md mx-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Setup Progress</span>
                <span className="text-sm font-mono text-primary">{progress}%</span>
              </div>
              <div className="h-2 bg-deep rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{checkedCount} of {totalItems} items complete</p>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 2: HOW TO GET STARTED                               */}
      {/* ============================================================ */}
      <section className="py-16 px-4 bg-card border-b border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">Get Set Up in 3 Steps</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Watch the Videos", desc: "Two walkthroughs cover everything from first login to going live. Start with Part 1 and follow along.", icon: Play },
              { step: "2", title: "Complete the Checklist", desc: "Work through each phase at your own pace. Most users finish basic setup in 1-2 days.", icon: CheckCircle2 },
              { step: "3", title: "Go Live", desc: "Connect your domain, test everything, and start capturing leads on autopilot.", icon: Globe },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <s.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-xs font-mono text-primary uppercase tracking-wider mb-2">Step {s.step}</div>
                <h3 className="text-lg font-bold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 3: SETUP VIDEOS                                     */}
      {/* ============================================================ */}
      <section id="setup-videos" className="py-16 px-4 bg-deep scroll-mt-24">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">Setup Videos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                label: "Part 1",
                title: "Introduction & Overview",
                desc: "Account activation, dashboard navigation, custom values, calendar setup, website templates, automations, AI agents, and chat widget installation.",
                embedUrl: "https://player.vimeo.com/video/1175573132?title=0&byline=0&portrait=0",
                fallbackUrl: VIDEO_PART1,
              },
              {
                label: "Part 2",
                title: "Technical Setup",
                desc: "DNS configuration, domain connection, email services, phone system setup, A2P registration, and advanced features.",
                embedUrl: "https://player.vimeo.com/video/1174987065?title=0&byline=0&portrait=0",
                fallbackUrl: VIDEO_PART2,
              },
            ].map((v) => (
              <div key={v.label} className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
                <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                  <iframe
                    src={v.embedUrl}
                    className="absolute inset-0 w-full h-full"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    title={`${v.label}: ${v.title}`}
                  />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-primary uppercase tracking-wider">{v.label}</span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{v.title}</h3>
                  <p className="text-sm text-muted-foreground flex-1">{v.desc}</p>
                  <a
                    href={v.fallbackUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-3"
                  >
                    Open in new tab
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 4: ONBOARDING CHECKLIST                             */}
      {/* ============================================================ */}
      <section className="py-16 px-4 bg-card">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-3">Your Setup Checklist</h2>
            <p className="text-muted-foreground">Work through each phase in order. Check off items as you go.</p>
          </div>

          {/* Overall progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Overall Progress</span>
              <span className="text-sm font-mono text-primary">{checkedCount}/{totalItems}</span>
            </div>
            <div className="h-2.5 bg-deep rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="space-y-3">
            {CHECKLIST_PHASES.map((phase, pi) => {
              const phaseItems = phase.items.map((_, ii) => `${pi}-${ii}`)
              const phaseChecked = phaseItems.filter((k) => checked[k]).length
              const phaseComplete = phaseChecked === phase.items.length
              const isOpen = openPhases[pi] ?? false

              return (
                <div key={pi} className="border border-border rounded-xl overflow-hidden bg-background">
                  <button
                    onClick={() => togglePhase(pi)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-deep/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                        phaseComplete ? "bg-green-900/30 text-green-400" : "bg-deep text-muted-foreground"
                      }`}>
                        {phaseComplete ? <Check className="w-4 h-4" /> : <span className="text-xs font-mono">{pi + 1}</span>}
                      </div>
                      <div className="text-left">
                        <span className="text-sm font-semibold text-foreground">{phase.title}</span>
                        <span className="text-xs text-muted-foreground ml-2">({phaseChecked}/{phase.items.length})</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground hidden sm:block">{phase.timeline}</span>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-4 space-y-2 border-t border-border pt-3">
                      {phase.items.map((item, ii) => {
                        const key = `${pi}-${ii}`
                        const isChecked = checked[key] ?? false
                        return (
                          <label
                            key={ii}
                            className={`flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                              isChecked ? "bg-green-900/10" : "hover:bg-deep/50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleCheck(key)}
                              className="mt-0.5 h-4 w-4 rounded border-border bg-deep text-primary accent-primary flex-shrink-0"
                            />
                            <span className={`text-sm leading-relaxed ${isChecked ? "text-muted-foreground line-through" : "text-foreground"}`}>
                              {item}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 5: DNS HELP VIDEOS                                  */}
      {/* ============================================================ */}
      <section className="py-16 px-4 bg-deep">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-3">Domain Setup Help</h2>
            <p className="text-muted-foreground">Connecting your domain? Watch the tutorial for your registrar.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { name: "GoDaddy", link: DNS_GODADDY },
              { name: "Namecheap", link: DNS_NAMECHEAP },
              { name: "Cloudflare", link: DNS_CLOUDFLARE },
            ].map((r) => (
              <a
                key={r.name}
                href={r.link}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-card border border-border rounded-xl p-5 flex flex-col items-center gap-3 hover:border-primary/40 transition-colors group"
              >
                <Globe className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="font-semibold text-foreground">{r.name}</span>
                <span className="inline-flex items-center gap-1 text-sm text-primary font-medium">
                  Watch Tutorial <ExternalLink className="w-3 h-3" />
                </span>
              </a>
            ))}
          </div>

          {/* DNS Reference */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">DNS Records Reference</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-deep rounded-lg p-3">
                <span className="text-xs font-mono text-primary">A Record</span>
                <p className="text-sm text-muted-foreground mt-1">Host: <span className="text-foreground font-mono">@</span> (or yourdomain.com)</p>
                <p className="text-sm text-muted-foreground">Points to: <span className="text-foreground font-mono">IP address shown in GHL</span></p>
              </div>
              <div className="bg-deep rounded-lg p-3">
                <span className="text-xs font-mono text-primary">CNAME</span>
                <p className="text-sm text-muted-foreground mt-1">Host: <span className="text-foreground font-mono">www</span></p>
                <p className="text-sm text-muted-foreground">Points to: <span className="text-foreground font-mono">CNAME value shown in GHL</span></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 6: WHAT YOU'RE GETTING - BENTO GRID                 */}
      {/* ============================================================ */}
      <section className="py-16 px-4 bg-card">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-3">Everything Inside Your AIMS CRM</h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">One platform replaces your website builder, CRM, email tool, scheduler, chatbot, review manager, and phone system.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {BENTO_FEATURES.map((f) => (
              <div key={f.title} className="bg-background border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <f.icon className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{f.title}</h3>
                </div>
                <ul className="space-y-1.5">
                  {f.features.map((item) => (
                    <li key={item} className="flex items-start gap-1.5">
                      <Check className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-muted-foreground leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 7: PACKAGE COMPARISON                               */}
      {/* ============================================================ */}
      <section className="py-16 px-4 bg-deep">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">Choose Your Plan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`bg-card border rounded-2xl p-6 flex flex-col ${
                  plan.popular ? "border-primary shadow-md" : "border-border"
                }`}
              >
                {plan.popular && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary mb-3">Most Popular</span>
                )}
                <h3 className="text-lg font-bold text-foreground mb-4">{plan.name}</h3>
                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f.name} className="flex items-start gap-2">
                      {f.included ? (
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground/40 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={`text-sm ${f.included ? "text-foreground" : "text-muted-foreground/40"}`}>
                        {f.name}
                      </span>
                    </li>
                  ))}
                </ul>
                <a
                  href={ONBOARDING_FORM}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-5 w-full text-center rounded-sm px-4 py-3 text-sm font-semibold transition-colors inline-block ${
                    plan.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border border-border text-foreground hover:bg-deep"
                  }`}
                >
                  Get Started
                </a>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Not sure which plan fits? Use the chatbot below and we&apos;ll recommend the right starting point.
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 8: COMMON MISTAKES                                  */}
      {/* ============================================================ */}
      <section className="py-16 px-4 bg-card">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">Avoid These Setup Mistakes</h2>
          <div className="space-y-4">
            {MISTAKES.map((m, i) => (
              <div key={i} className="bg-background border border-border rounded-xl p-5 flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-1">{m.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 9: FAQ                                              */}
      {/* ============================================================ */}
      <section className="py-16 px-4 bg-deep">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-border rounded-xl overflow-hidden bg-card">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-deep/30 transition-colors"
                >
                  <span className="text-sm font-semibold text-foreground pr-4">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 border-t border-border pt-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 10: SUPPORT                                         */}
      {/* ============================================================ */}
      <section className="py-16 px-4 bg-card">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-3">Need Help?</h2>
            <p className="text-muted-foreground">Our team is here to make sure your setup goes smoothly.</p>
          </div>

          <div className="max-w-md mx-auto mb-8">
            <button
              onClick={() => {
                const chatBtn = document.querySelector("[aria-label='Chat with Setup Assistant']") as HTMLButtonElement | null
                chatBtn?.click()
              }}
              className="w-full bg-background border border-border rounded-xl p-6 text-center hover:border-primary/40 transition-colors group"
            >
              <MessageSquare className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors mx-auto mb-3" />
              <p className="text-base font-semibold text-foreground mb-1">Chat with our AI Help Agent</p>
              <p className="text-sm text-muted-foreground mb-2">Get instant answers to setup questions</p>
              <p className="text-xs text-primary">Open Chat</p>
            </button>
            <p className="text-xs text-muted-foreground text-center mt-3">
              Still need help? The chatbot can connect you with our support team.
            </p>
          </div>

          <div className="bg-background border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">The chatbot can help with:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                "Technical errors or bugs",
                "DNS configuration help",
                "A2P 10DLC registration",
                "Custom automation requests",
                "Package upgrades or billing",
                "General questions",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <ChevronRight className="w-3 h-3 text-primary flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              If the chatbot can&apos;t resolve your issue, it will connect you with our support team.
            </p>
          </div>
        </div>
      </section>

      {/* Onboarding Chatbot */}
      <OnboardingChatWidget />
    </div>
  )
}
