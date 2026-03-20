import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  Heart,
  Scale,
  Wrench,
  Home,
  UtensilsCrossed,
  Briefcase,
  ShoppingBag,
  MonitorSmartphone,
  Truck,
  Car,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Industries We Serve — AI Solutions by Sector | AIMS",
  description:
    "AIMS builds AI growth systems for healthcare, legal, home services, real estate, hospitality, professional services, e-commerce, SaaS, and more.",
}

const INDUSTRIES = [
  {
    name: "Healthcare & Medical",
    slug: "healthcare",
    description:
      "Automate patient intake, appointment reminders, and review management to fill your schedule and reduce no-shows.",
    icon: Heart,
    solution: "AI Growth Engine",
  },
  {
    name: "Legal & Law Firms",
    slug: "legal",
    description:
      "AI-powered client intake, case lead generation, and reputation management that keeps your pipeline full without billable hour trade-offs.",
    icon: Scale,
    solution: "Content & Authority Engine",
  },
  {
    name: "Home Services",
    slug: "home-services",
    description:
      "HVAC, plumbing, electrical, roofing — AI voice agents answer every call, book jobs, and reactivate past customers automatically.",
    icon: Wrench,
    solution: "Customer Reactivation Stack",
  },
  {
    name: "Real Estate",
    slug: "real-estate",
    description:
      "Automated lead nurture, listing promotion, and database reactivation that turns cold contacts into closings.",
    icon: Home,
    solution: "AI Growth Engine",
  },
  {
    name: "Restaurants & Hospitality",
    slug: "hotels-hospitality",
    description:
      "Guest communication, review generation, and reservation optimization powered by AI — so you focus on the experience.",
    icon: UtensilsCrossed,
    solution: "Customer Reactivation Stack",
  },
  {
    name: "Professional Services & Consulting",
    slug: "professional-services",
    description:
      "Position yourself as the authority in your space with AI content production, LinkedIn outbound, and SEO that compounds.",
    icon: Briefcase,
    solution: "Content & Authority Engine",
  },
  {
    name: "E-Commerce & Retail",
    slug: "ecommerce",
    description:
      "Recover abandoned carts, reactivate lapsed buyers, and drive repeat purchases with AI-powered email and SMS sequences.",
    icon: ShoppingBag,
    solution: "Customer Reactivation Stack",
  },
  {
    name: "SaaS & Technology",
    slug: "saas",
    description:
      "Outbound pipeline generation, product-led growth automation, and RevOps systems that scale with your ARR.",
    icon: MonitorSmartphone,
    solution: "Revenue Operations Suite",
  },
  {
    name: "Vendingpreneurs",
    slug: "vendingpreneurs",
    description:
      "AI voice agents, cold outbound for locations, and CRM automation built specifically for vending operators.",
    icon: Truck,
    solution: "AI Growth Engine",
  },
  {
    name: "Car Dealerships",
    slug: "car-dealerships",
    description:
      "AI recall outreach, inbound lead routing, and multi-location CRM automation for automotive dealers.",
    icon: Car,
    solution: "Revenue Operations Suite",
  },
]

export default function IndustriesPage() {
  return (
    <div className="min-h-screen bg-deep">
      {/* Hero */}
      <section className="pt-28 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground mb-4">
            AI Solutions For Every Industry
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            No matter your vertical, AIMS builds and runs AI systems that
            generate leads, close deals, and automate operations — tailored to
            how your industry actually works.
          </p>
        </div>
      </section>

      {/* Industry Grid */}
      <section className="pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {INDUSTRIES.map((industry) => (
              <Link
                key={industry.slug}
                href={`/industries/${industry.slug}`}
                className="group bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-border transition-all flex flex-col"
              >
                <div className="w-10 h-10 rounded-xl bg-deep flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                  <industry.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h2 className="text-base font-bold text-foreground mb-1">
                  {industry.name}
                </h2>
                <p className="text-sm text-muted-foreground mb-4 flex-1">
                  {industry.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Recommended: {industry.solution}
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-sm">
            <h2 className="text-xl font-bold text-foreground mb-2">
              Don&apos;t see your industry?
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              AIMS solutions work for any B2B or B2C business. Book a free
              strategy call and we will build a custom plan for your vertical.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/get-started"
                className="inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Book a Consultation
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/solutions"
                className="inline-flex items-center justify-center gap-2 rounded-sm border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-surface transition-colors"
              >
                View Solution Packages
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
