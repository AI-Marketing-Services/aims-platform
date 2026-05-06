import Image from "next/image"

const MENTORS = [
  {
    name: "Mike Hoffmann",
    title: "Founder & Serial Entrepreneur",
    cred: "Vending, AI Services, Coaching & Community",
    badge: "YPO Member",
    img: "/operators/mike-hoffmann.jpg",
  },
  {
    name: "George Shanine",
    title: "Founder & CEO",
    cred: "$30M EBITDA. Multiple exits over $50M.",
    badge: "YPO Member",
    img: "/operators/george-shanine.jpg",
  },
  {
    name: "Charles Hare",
    title: "Founder & Entrepreneur",
    cred: "$80M+ exit. Beverage & Transportation.",
    badge: "YPO Member",
    img: "/operators/charles-hare.png",
  },
  {
    name: "Dan Fischer",
    title: "Founder & Investor",
    cred: "Gaming, Entertainment, Multi-state Lottery Ops.",
    badge: "YPO Member",
    img: "/operators/dan-fischer.jpg",
  },
  {
    name: "Paul Weinhold",
    title: "President & Chairman",
    cred: "Nonprofit Leadership. Banking & Finance.",
    badge: "Operator",
    img: "/operators/paul-weinhold.jpg",
  },
  {
    name: "Dick Abraham",
    title: "Founder & Investor",
    cred: "Urgent Care. Hospital Systems. Healthcare.",
    badge: "Operator",
    img: "/operators/dick-abraham.jpg",
  },
]

export function ConsortiumMentors() {
  return (
    <section
      id="mentors"
      className="relative py-24 sm:py-32 border-t border-[#E3E3E3] bg-[#F5F5F5] texture-light dot-grid-light"
    >
      <div className="relative z-10 mx-auto max-w-[1280px] px-6">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-playfair text-4xl sm:text-5xl md:text-6xl text-[#1A1A1A] leading-[1.2] pb-2">
            Built by operators{" "}
            <span className="block text-crimson italic">
              for future operators.
            </span>
          </h2>
          <p className="mt-6 text-base sm:text-lg text-[#737373] leading-relaxed">
            AIOC is powered by AI Managing Services (AIMS), an operator-led AI
            implementation company. That matters because the internet is full of AI
            education made by people who are good at content, not necessarily
            operations.
          </p>
          <p className="mt-4 text-base sm:text-lg text-[#737373] leading-relaxed">
            AIMS works from the operating-company layer: real workflows, messy
            handoffs, imperfect data, humans in the loop, budget constraints, and
            the unglamorous details that determine whether an AI idea becomes useful
            or decorative.
          </p>
          <p className="mt-4 text-base sm:text-lg text-[#737373] leading-relaxed">
            AIOC brings that operating lens into a cohort-based environment for
            people who want to become credible AI Operators.
          </p>
        </div>

        {/* AIMS operating context */}
        <div className="mt-12 max-w-3xl mx-auto rounded-md border border-[#E3E3E3] bg-white p-6 sm:p-7">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-crimson mb-4">
            AIMS brings operating context from
          </p>
          <ul className="space-y-2 text-sm sm:text-base text-[#383838] leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-crimson mt-1 flex-shrink-0">•</span>
              <span>AIMS is operator-led.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-crimson mt-1 flex-shrink-0">•</span>
              <span>
                AIMS is backed by founders, investors, executives, and business
                builders.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-crimson mt-1 flex-shrink-0">•</span>
              <span>
                AIMS works with operator-led businesses with roughly $30M–$80M+ in
                annual revenue.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-crimson mt-1 flex-shrink-0">•</span>
              <span>AIMS builds app infrastructure for operator workflows.</span>
            </li>
          </ul>
          <p className="mt-5 pt-5 border-t border-[#E3E3E3] text-xs text-[#737373] leading-relaxed italic">
            This does not mean members are guaranteed clients, placements,
            subcontractor work, access to AIMS companies, or access to anyone&apos;s
            personal network. It means the community is built from operator pattern
            recognition, not tool demos alone.
          </p>
        </div>

        <p className="mt-16 text-center text-xs font-mono uppercase tracking-[0.2em] text-crimson">
          Operators behind AIMS
        </p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MENTORS.map((mentor) => (
            <div
              key={mentor.name}
              className="group relative rounded-md border border-[#E3E3E3] bg-white p-6 hover:border-crimson/30 hover:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.1),0_4px_12px_-4px_rgba(0,0,0,0.06)] transition-all"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="relative w-20 h-20 rounded-full overflow-hidden ring-2 ring-crimson/20 ring-offset-2 ring-offset-white">
                  <Image
                    src={mentor.img}
                    alt={mentor.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
                <span className="text-[10px] uppercase tracking-wider font-mono text-crimson border border-crimson/20 bg-crimson/5 px-2 py-1 rounded-sm">
                  {mentor.badge}
                </span>
              </div>
              <h3 className="font-playfair text-xl text-[#1A1A1A] leading-tight">{mentor.name}</h3>
              <p className="text-xs text-crimson/80 font-mono uppercase tracking-wider mt-1">
                {mentor.title}
              </p>
              <p className="mt-3 text-sm text-[#737373] leading-relaxed">{mentor.cred}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
