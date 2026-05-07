import { ShieldAlert } from "lucide-react"

const DISCLOSURES = [
  {
    title: "No outcome guarantees",
    body: "The AI Operator Collective makes no income, earnings, revenue, client, placement, employment, subcontractor, or business outcome guarantees.",
  },
  {
    title: "AIMS context is background, not a promise",
    body: "Any references to AIMS, operator experience, implementation work, app infrastructure, or company revenue ranges describe the background and operating context behind the Collective. They are not promises of member outcomes.",
  },
  {
    title: "Results depend on you",
    body: "Member results depend on individual effort, skill, market, relationships, timing, execution, and starting point.",
  },
  {
    title: "Application-only",
    body: "Submitting an application is not enrollment and does not guarantee acceptance. Pricing, terms, cohort dates, and application requirements are shared with qualified applicants before any enrollment decision is made.",
  },
  {
    title: "Powered by AIMS",
    body: "The AI Operator Collective is powered by AI Managing Services (AIMS).",
  },
]

export function CommunityDisclosures() {
  return (
    <section
      id="disclosures"
      className="relative py-20 sm:py-24 border-t border-[#E3E3E3] bg-white texture-light"
    >
      <div className="relative z-10 mx-auto max-w-3xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-crimson/5 border border-crimson/15 mb-5">
            <ShieldAlert className="w-5 h-5 text-crimson" />
          </div>
          <h2 className="font-playfair text-2xl sm:text-3xl text-[#1A1A1A] leading-tight">
            Important disclosures
          </h2>
          <p className="mt-3 text-sm text-[#737373]">
            Please read these in full before applying or making any business
            decision based on the information on this page.
          </p>
        </div>

        <div className="mt-12 space-y-5">
          {DISCLOSURES.map((d) => (
            <div
              key={d.title}
              className="rounded-md border border-[#E3E3E3] bg-[#F5F5F5] p-5 sm:p-6"
            >
              <h3 className="text-xs font-mono uppercase tracking-wider text-crimson mb-2">
                {d.title}
              </h3>
              <p className="text-sm text-[#737373] leading-relaxed">{d.body}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-[11px] text-[#737373]/60 font-mono uppercase tracking-wider">
          Last updated:{" "}
          {new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
          })}
        </p>
      </div>
    </section>
  )
}
