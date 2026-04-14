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
      className="relative py-24 sm:py-32 border-t border-white/10 bg-[#383838] text-white texture-dark dot-grid-dark"
    >
      <div className="relative z-10 mx-auto max-w-[1280px] px-6">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-playfair text-4xl sm:text-5xl md:text-6xl text-white leading-[1.25] pb-2">
            Not influencers.{" "}
            <span className="block text-crimson-light italic">
              People who&apos;ve actually built companies.
            </span>
          </h2>
          <p className="mt-6 text-lg text-white/65">
            They deploy the same AI systems inside their own portfolios that you&apos;ll
            learn to build for clients.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MENTORS.map((mentor) => (
            <div
              key={mentor.name}
              className="group relative rounded-md border border-white/10 bg-[#4A4A4A] p-6 hover:border-crimson/40 transition-all"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="relative w-20 h-20 rounded-full overflow-hidden ring-2 ring-crimson/40 ring-offset-2 ring-offset-[#4A4A4A] shadow-[0_0_25px_rgba(153,27,27,0.2)]">
                  <Image
                    src={mentor.img}
                    alt={mentor.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
                <span className="text-[10px] uppercase tracking-wider font-mono text-crimson-light border border-crimson/30 bg-crimson/10 px-2 py-1 rounded-sm">
                  {mentor.badge}
                </span>
              </div>
              <h3 className="font-playfair text-xl text-white leading-tight">{mentor.name}</h3>
              <p className="text-xs text-crimson-light/80 font-mono uppercase tracking-wider mt-1">
                {mentor.title}
              </p>
              <p className="mt-3 text-sm text-white/60 leading-relaxed">{mentor.cred}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center max-w-2xl mx-auto">
          <p className="text-xs text-white/50 font-mono uppercase tracking-wider">
            Mentor credentials sourced from public profiles and internal records
          </p>
          <p className="mt-3 text-xs text-white/45 leading-relaxed">
            Mentor availability and session formats are subject to scheduling. No specific
            mentor is guaranteed at any specific session.
          </p>
        </div>
      </div>
    </section>
  )
}
