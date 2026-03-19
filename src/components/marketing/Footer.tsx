import Link from "next/link"
import Image from "next/image"

const FOOTER_LINKS = {
  Services: [
    { label: "Outbound Campaigns", href: "/services/cold-outbound" },
    { label: "AI Voice Agents", href: "/services/voice-agents" },
    { label: "SEO & AEO", href: "/services/seo-aeo" },
    { label: "RevOps Pipeline", href: "/services/revops-pipeline" },
    { label: "Lead Reactivation", href: "/services/lead-reactivation" },
    { label: "Website + CRM + Chat", href: "/services/website-crm-chatbot" },
    { label: "View All Services", href: "/marketplace" },
  ],
  "Free Tools": [
    { label: "AI Readiness Quiz", href: "/tools/ai-readiness-quiz" },
    { label: "ROI Calculator", href: "/tools/roi-calculator" },
    { label: "Free Website Audit", href: "/tools/website-audit" },
    { label: "Segment Explorer", href: "/tools/segment-explorer" },
    { label: "Stack Configurator", href: "/tools/stack-configurator" },
  ],
  Industries: [
    { label: "Vendingpreneurs", href: "/industries/vendingpreneurs" },
    { label: "Car Dealerships", href: "/industries/car-dealerships" },
    { label: "Small Business", href: "/industries/small-business" },
    { label: "Hotels & Hospitality", href: "/industries/hotels-hospitality" },
    { label: "Enterprise", href: "/industries/enterprise" },
  ],
  Company: [
    { label: "About AIMS", href: "/about" },
    { label: "Case Studies", href: "/case-studies" },
    { label: "Blog", href: "/blog" },
    { label: "Pricing", href: "/pricing" },
    { label: "Get Started", href: "/get-started" },
  ],
} as const

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main footer */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 py-12 lg:py-16">
          {/* Brand column */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center">
              <Image src="/logo.png" alt="AIMS" width={100} height={40} className="object-contain h-8 w-auto" />
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground leading-relaxed">
              AI-powered business infrastructure. Built once. Runs forever.
              More qualified meetings. Less wasted ad spend.
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href="https://linkedin.com/company/aimanagingservices"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                aria-label="LinkedIn"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a
                href="https://twitter.com/aimanagingsvcs"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                aria-label="Twitter"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border py-6">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} AI Managing Services. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/about" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="/get-started" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
