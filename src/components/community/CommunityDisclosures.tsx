import { ShieldAlert } from "lucide-react"

const DISCLOSURES = [
  {
    title: "No Income Or Earnings Claims",
    body: "The AI Operator Collective makes no income, earnings, revenue, client, engagement, or business outcome claims of any kind. Anything stated on this page about results, retainers, or operator outcomes is descriptive of the AIMS portfolio (not member outcomes) and is not a representation of what any individual member will achieve.",
  },
  {
    title: "Results Not Typical",
    body: "Any results referenced on this page or in the program materials, including the case studies attributed to AIMS portfolio engagements, are not representative of typical outcomes. Most people who attempt to build a services business do not earn the results referenced. Your results will depend entirely on your own skill, effort, market, capital, and execution.",
  },
  {
    title: "Application-Only Program",
    body: "The Collective is application-only. Submitting your name and email is not enrollment and is not a payment. We will only accept members who, in our sole discretion, are a fit for the program. Pricing, terms, and program structure are shared over email with applicants who are offered a cohort seat, before either party commits.",
  },
  {
    title: "Forward-Looking Statements",
    body: "Some statements on this page describe how the program is structured, how we plan to run sessions, or what we intend to deliver in the founding cohort. These are forward-looking statements and may change as the cohort is finalized. The official terms of service provided at enrollment are the controlling document.",
  },
  {
    title: "Mentor & Consortium Disclosures",
    body: "Operator mentor credentials shown on this page are sourced from public profiles and internal records. Mentor availability, session formats, and one-on-one access are subject to scheduling and may vary across cohorts. No specific mentor is guaranteed to be present at any specific session.",
  },
  {
    title: "Not Legal, Tax, Or Financial Advice",
    body: "Curriculum content related to LLC formation, pricing, contracts, taxes, or financial planning is educational only and is not legal, tax, accounting, or financial advice. Members should consult their own qualified professionals for personalized guidance.",
  },
  {
    title: "Operated By Modern Amenities LLC",
    body: "The AI Operator Collective is operated by Modern Amenities LLC. Powered by AIMS. All references to the AIMS portfolio refer to the businesses operated, advised, or held by the Modern Amenities LLC team and consortium members.",
  },
]

export function CommunityDisclosures() {
  return (
    <section
      id="disclosures"
      className="relative py-20 sm:py-24 border-t border-line bg-deep"
    >
      <div className="mx-auto max-w-3xl px-4">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-sm bg-aims-gold/10 border border-aims-gold/20 mb-5">
            <ShieldAlert className="w-5 h-5 text-aims-gold" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-cream leading-tight">
            Important Disclosures
          </h2>
          <p className="mt-3 text-sm text-cream/75">
            Please read these in full before applying or making any business decision based on
            the information on this page.
          </p>
        </div>

        <div className="mt-12 space-y-5">
          {DISCLOSURES.map((d) => (
            <div
              key={d.title}
              className="rounded-md border border-line bg-surface/40 p-5 sm:p-6"
            >
              <h3 className="text-xs font-mono uppercase tracking-wider text-aims-gold mb-2">
                {d.title}
              </h3>
              <p className="text-sm text-cream/65 leading-relaxed">{d.body}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-[11px] text-cream/60 font-mono uppercase tracking-wider">
          Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" })}
        </p>
      </div>
    </section>
  )
}
