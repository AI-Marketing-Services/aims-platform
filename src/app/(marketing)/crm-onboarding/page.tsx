import type { Metadata } from "next"
import Link from "next/link"
import {
  Play,
  CheckSquare,
  Rocket,
  Globe,
  ExternalLink,
  Layout,
  Calendar,
  FileText,
  Bot,
  Users,
  Mail,
  Star,
  Zap,
  Phone,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  ArrowRight,
  Check,
  X,
} from "lucide-react"
import { OnboardingChecklist } from "./OnboardingChecklist"

export const metadata: Metadata = {
  title: "CRM Onboarding",
  description:
    "Get set up with AIMS CRM. Step-by-step videos, interactive checklist, and everything you need to launch your vending business platform.",
}

const VIDEO_PART1 = "https://screen.studio/share/TdKBz4u1"
const VIDEO_PART2 = "https://vimeo.com/1174987065?fl=ip&fe=ec"
const DNS_GODADDY = "https://youtu.be/CxCIPrme700?si=5oQfOTFLTdr7BYtG"
const DNS_NAMECHEAP = "https://youtu.be/p0KqYLTdKbs?si=rSsukgeb7JqwO5QN"
const DNS_CLOUDFLARE = "https://youtu.be/au4rL36eq3c?si=NXncfeioNMM2EKDR"
const SUPPORT_EMAIL_1 = "irtaza@modern-amenities.com"
const SUPPORT_EMAIL_2 = "adam@modern-amenities.com"

const FEATURES = [
  {
    icon: Layout,
    title: "7 Website Templates",
    description:
      "Professionally designed, conversion-optimized pages ready to customize with your brand.",
  },
  {
    icon: Calendar,
    title: "Booking Calendar",
    description:
      "Embedded scheduling with automated reminders. Syncs with Google Calendar, Outlook, Zoom, and Meet.",
  },
  {
    icon: FileText,
    title: "Lead Capture Forms",
    description:
      "Pre-built forms connected to automated follow-up sequences. Every lead gets instant response.",
  },
  {
    icon: Bot,
    title: "AI Chat Assistant",
    description:
      "24/7 chatbot trained on your business info. Answers questions and books appointments while you sleep.",
  },
  {
    icon: Users,
    title: "CRM & Pipeline",
    description:
      "Unified contact database with full interaction history, opportunity tracking, and task management.",
  },
  {
    icon: Mail,
    title: "Email & SMS",
    description:
      "Built-in communication tools with custom domain support for better deliverability.",
  },
  {
    icon: Star,
    title: "Reputation Manager",
    description:
      "Automated review collection. Positive ratings go public, negative ratings stay private.",
  },
  {
    icon: Zap,
    title: "Pre-Built Automations",
    description:
      "Workflows for bookings, form leads, and follow-ups that run without you lifting a finger.",
  },
  {
    icon: Phone,
    title: "Voice AI",
    description:
      "Automated phone handling that qualifies callers and books appointments. Available on premium plans.",
  },
]

const PLANS = [
  {
    name: "Starter",
    features: [
      { label: "7 Website Templates", included: true },
      { label: "Booking Calendar", included: true },
      { label: "Lead Capture & Automations", included: true },
      { label: "CRM & Pipeline", included: true },
      { label: "Unified Inbox", included: true },
      { label: "AI Chat", included: false },
      { label: "Voice AI", included: false },
    ],
  },
  {
    name: "Premium",
    popular: true,
    features: [
      { label: "Everything in Starter", included: true },
      { label: "AI Chat Assistant", included: true },
      { label: "Knowledge Base Configuration", included: true },
      { label: "Advanced Automations", included: true },
      { label: "AI Chat", included: true },
      { label: "Voice AI", included: false },
    ],
  },
  {
    name: "Route Owner / Vending Empire",
    features: [
      { label: "Everything in Premium", included: true },
      { label: "Voice AI (Automated Phone Handling)", included: true },
      { label: "Phone Number Included", included: true },
      { label: "Advanced Integrations", included: true },
      { label: "AI Chat", included: true },
      { label: "Voice AI", included: true },
    ],
  },
]

const MISTAKES = [
  {
    title: "Not assigning yourself in workflows",
    description:
      "Both pre-built automations require you to assign yourself as active user. Without this, no notifications or tasks get created. This is the number one setup issue.",
  },
  {
    title: "Editing the original template",
    description:
      "Always duplicate the template before customizing. If you edit the original and break something, you lose the clean starting point.",
  },
  {
    title: "Skipping Custom Values",
    description:
      'If you don\'t update Custom Values in Settings, placeholder text like "Your Business Name" will show up across your entire CRM, emails, and website.',
  },
  {
    title: "Not setting the AI bot as Primary",
    description:
      'The chat widget won\'t respond to messages unless the Conversational AI bot is toggled to "Primary." This is a one-click fix most people miss.',
  },
  {
    title: "Forgetting DNS records",
    description:
      "Your custom domain won't connect without both the A Record and CNAME added at your registrar. Use the DNS tutorial videos above for your specific provider.",
  },
]

const FAQS = [
  {
    q: "How long does setup take?",
    a: "Most users complete basic setup in 1-2 days. Full configuration with DNS, AI, and advanced features takes about a week.",
  },
  {
    q: "Do I need technical skills?",
    a: "No. Everything is pre-built and ready to customize. The setup videos walk you through every step.",
  },
  {
    q: "Can I use my existing domain?",
    a: "Yes. Connect it through Settings > Domains and add the required DNS records at your registrar.",
  },
  {
    q: "What if I don't have a domain?",
    a: "You can purchase one directly within AIMS CRM through Settings > Domains.",
  },
  {
    q: "Why isn't my AI chat responding?",
    a: 'Make sure the bot is set as "Primary" in Conversational AI settings. Also verify the Knowledge Base is filled out and Board Training has your business name.',
  },
  {
    q: "What is A2P 10DLC?",
    a: "A carrier-mandated registration required to send SMS at scale in the US. You'll need your EIN and business documentation. Contact support for help with this.",
  },
  {
    q: "Can I upgrade my plan later?",
    a: "Yes. Contact support anytime to upgrade to a higher tier.",
  },
  {
    q: "What happens when someone fills out my form?",
    a: "The automation creates a CRM contact, tags them as a lead, creates a pipeline opportunity, sends them a confirmation email, and notifies you with their details.",
  },
]

export default function CRMOnboardingPage() {
  return (
    <div className="bg-card">
      {/* ───── SECTION 1: HERO ───── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary to-primary/90 text-white py-24">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="container mx-auto max-w-4xl px-4 text-center relative">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            Welcome to AIMS CRM
          </h1>
          <p className="mt-4 text-lg text-primary-foreground/80 max-w-2xl mx-auto leading-relaxed">
            Your all-in-one vending business platform. Everything you need to
            launch, manage, and grow — set up and ready to go.
          </p>
          <a
            href="#setup-videos"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-card text-primary px-8 py-3.5 text-sm font-semibold hover:bg-primary/10 transition-colors"
          >
            <Play className="h-4 w-4" />
            Watch the Setup Videos Below to Get Started
          </a>
        </div>
      </section>

      {/* ───── SECTION 2: HOW TO GET STARTED ───── */}
      <section className="py-20 bg-deep">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-bold text-foreground text-center">
            Get Set Up in 3 Steps
          </h2>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                icon: Play,
                step: "1",
                title: "Watch the Videos",
                description:
                  "Two walkthroughs cover everything from first login to going live. Start with Part 1 and follow along.",
              },
              {
                icon: CheckSquare,
                step: "2",
                title: "Complete the Checklist",
                description:
                  "Work through each phase at your own pace. Most users finish basic setup in 1-2 days.",
              },
              {
                icon: Rocket,
                step: "3",
                title: "Go Live",
                description:
                  "Connect your domain, test everything, and start capturing leads on autopilot.",
              },
            ].map(({ icon: Icon, step, title, description }) => (
              <div key={step} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div className="mt-4 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">
                  {step}
                </div>
                <h3 className="mt-3 text-base font-semibold text-foreground">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── SECTION 3: SETUP VIDEOS ───── */}
      <section id="setup-videos" className="py-20 scroll-mt-20">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-bold text-foreground text-center">
            Setup Videos
          </h2>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                label: "Part 1",
                title: "Introduction & Overview",
                duration: "Full Walkthrough",
                description:
                  "Account activation, dashboard navigation, custom values, calendar setup, website templates, automations, AI agents, and chat widget installation.",
                link: VIDEO_PART1,
                buttonText: "Watch Part 1",
              },
              {
                label: "Part 2",
                title: "Technical Setup",
                duration: "Full Walkthrough",
                description:
                  "DNS configuration, domain connection, email services, phone system setup, A2P registration, and advanced features.",
                link: VIDEO_PART2,
                buttonText: "Watch Part 2",
              },
            ].map((video) => (
              <div
                key={video.label}
                className="rounded-sm border border-border bg-card p-6 flex flex-col"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {video.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {video.duration}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {video.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1">
                  {video.description}
                </p>
                <a
                  href={video.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-sm bg-primary text-white px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Play className="h-4 w-4" />
                  {video.buttonText}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── SECTION 4: ONBOARDING CHECKLIST ───── */}
      <section className="py-20 bg-deep">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-foreground">
              Your Setup Checklist
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Work through each phase in order. Check off items as you go.
            </p>
          </div>
          <OnboardingChecklist />
        </div>
      </section>

      {/* ───── SECTION 5: DNS HELP VIDEOS ───── */}
      <section className="py-20">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-foreground">
              Domain Setup Help
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Connecting your domain? Watch the tutorial for your registrar.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                registrar: "GoDaddy",
                link: DNS_GODADDY,
                buttonText: "Watch GoDaddy Tutorial",
              },
              {
                registrar: "Namecheap",
                link: DNS_NAMECHEAP,
                buttonText: "Watch Namecheap Tutorial",
              },
              {
                registrar: "Cloudflare",
                link: DNS_CLOUDFLARE,
                buttonText: "Watch Cloudflare Tutorial",
              },
            ].map((dns) => (
              <a
                key={dns.registrar}
                href={dns.link}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm border border-border bg-card p-5 flex flex-col items-center gap-3 hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <Globe className="h-8 w-8 text-primary" />
                <p className="text-sm font-semibold text-foreground">
                  {dns.registrar}
                </p>
                <span className="text-xs text-primary font-medium flex items-center gap-1">
                  {dns.buttonText}
                  <ExternalLink className="h-3 w-3" />
                </span>
              </a>
            ))}
          </div>

          {/* DNS Reference */}
          <div className="mt-8 rounded-sm border border-border bg-deep p-5">
            <p className="text-sm font-semibold text-foreground mb-3">
              DNS Records Reference
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg bg-card border border-border px-4 py-3">
                <p className="text-xs font-bold text-primary mb-1">
                  A Record
                </p>
                <p className="text-xs text-muted-foreground">
                  Host: <code className="font-mono bg-deep px-1 rounded">@</code> (or yourdomain.com)
                </p>
                <p className="text-xs text-muted-foreground">
                  Points to: IP address shown in GHL
                </p>
              </div>
              <div className="rounded-lg bg-card border border-border px-4 py-3">
                <p className="text-xs font-bold text-primary mb-1">CNAME</p>
                <p className="text-xs text-muted-foreground">
                  Host: <code className="font-mono bg-deep px-1 rounded">www</code>
                </p>
                <p className="text-xs text-muted-foreground">
                  Points to: CNAME value shown in GHL
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── SECTION 6: WHAT'S INCLUDED ───── */}
      <section className="py-20 bg-deep">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-bold text-foreground text-center">
            What You Get
          </h2>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-sm border border-border bg-card p-5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-foreground">
                  {title}
                </h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── SECTION 7: PACKAGE COMPARISON ───── */}
      <section className="py-20">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-bold text-foreground text-center">
            Choose Your Plan
          </h2>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border-2 bg-card p-6 flex flex-col ${
                  plan.popular
                    ? "border-primary shadow-lg relative"
                    : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="text-lg font-bold text-foreground">
                  {plan.name}
                </h3>
                <ul className="mt-5 space-y-2.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f.label} className="flex items-start gap-2 text-sm">
                      {f.included ? (
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      )}
                      <span
                        className={
                          f.included ? "text-foreground" : "text-muted-foreground"
                        }
                      >
                        {f.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── SECTION 8: COMMON MISTAKES ───── */}
      <section className="py-20 bg-deep">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="text-2xl font-bold text-foreground text-center">
            Avoid These Setup Mistakes
          </h2>
          <div className="mt-10 space-y-4">
            {MISTAKES.map((mistake, i) => (
              <div
                key={i}
                className="rounded-xl border border-orange-800 bg-orange-50/50 px-5 py-4 flex items-start gap-3"
              >
                <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {mistake.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {mistake.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── SECTION 9: FAQ ───── */}
      <section className="py-20">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="text-2xl font-bold text-foreground text-center">
            Frequently Asked Questions
          </h2>
          <div className="mt-10 divide-y divide-border rounded-sm border border-border bg-card overflow-hidden">
            {FAQS.map((faq, i) => (
              <details key={i} className="group">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none hover:bg-surface transition-colors">
                  <span className="text-sm font-medium text-foreground pr-4">
                    {faq.q}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-5 pb-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ───── SECTION 10: SUPPORT ───── */}
      <section className="py-20 bg-deep">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-foreground">Need Help?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Our team is here to make sure your setup goes smoothly.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a
              href={`mailto:${SUPPORT_EMAIL_1}`}
              className="rounded-sm border border-border bg-card p-5 text-center hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <Mail className="h-8 w-8 text-primary mx-auto" />
              <p className="mt-3 text-sm font-semibold text-foreground">
                Irtaza
              </p>
              <p className="text-xs text-muted-foreground">
                Technical Support
              </p>
              <p className="mt-2 text-xs text-primary font-medium">
                {SUPPORT_EMAIL_1}
              </p>
            </a>
            <a
              href={`mailto:${SUPPORT_EMAIL_2}`}
              className="rounded-sm border border-border bg-card p-5 text-center hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <Mail className="h-8 w-8 text-primary mx-auto" />
              <p className="mt-3 text-sm font-semibold text-foreground">Adam</p>
              <p className="text-xs text-muted-foreground">General Support</p>
              <p className="mt-2 text-xs text-primary font-medium">
                {SUPPORT_EMAIL_2}
              </p>
            </a>
            <div className="rounded-sm border border-border bg-card p-5 text-center">
              <Bot className="h-8 w-8 text-primary mx-auto" />
              <p className="mt-3 text-sm font-semibold text-foreground">
                AI Help Agent
              </p>
              <p className="text-xs text-muted-foreground">Instant Answers</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Use the chat widget on this page
              </p>
            </div>
          </div>

          {/* When to reach out */}
          <div className="mt-8 rounded-sm border border-border bg-card p-5">
            <p className="text-sm font-semibold text-foreground mb-3">
              When to reach out:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                "Technical errors or bugs",
                "DNS configuration help",
                "A2P 10DLC registration",
                "Custom automation requests",
                "Package upgrades or billing",
                "General questions",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ArrowRight className="h-3 w-3 text-primary flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───── SECTION 11: FOOTER ───── */}
      <section className="py-12 bg-primary text-white text-center">
        <div className="container mx-auto max-w-4xl px-4">
          <p className="text-lg font-semibold">
            Welcome to the AIMS CRM family. Let&apos;s grow your vending business.
          </p>
          <p className="mt-2 text-sm text-primary-foreground/80">— The AIMS Creative Team</p>
        </div>
      </section>
    </div>
  )
}
