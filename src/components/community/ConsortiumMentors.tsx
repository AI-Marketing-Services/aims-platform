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
      className="relative py-24 sm:py-32 border-t border-line bg-gradient-to-b from-deep to-ink"
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-cream leading-[1.25] pb-2">
            Not Built By Influencers.
            <span className="block text-aims-gold italic">Built By Operators.</span>
          </h2>
          <p className="mt-6 text-lg text-cream/65">
            These aren&apos;t coaches who read about business. They built, scaled, and exited
            real companies. They deploy the same AI systems inside their own portfolio that
            you&apos;ll learn to build for clients.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MENTORS.map((mentor) => (
            <div
              key={mentor.name}
              className="group relative rounded-md border border-line bg-panel/60 p-6 hover:border-aims-gold/40 hover:bg-panel transition-all"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="relative w-20 h-20 rounded-full overflow-hidden ring-2 ring-aims-gold/40 ring-offset-2 ring-offset-panel shadow-[0_0_25px_rgba(196,151,42,0.25)]">
                  <Image
                    src={mentor.img}
                    alt={mentor.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
                <span className="text-[10px] uppercase tracking-wider font-mono text-aims-gold border border-aims-gold/30 bg-aims-gold/5 px-2 py-1 rounded-sm">
                  {mentor.badge}
                </span>
              </div>
              <h3 className="font-serif text-xl text-cream leading-tight">{mentor.name}</h3>
              <p className="text-xs text-aims-gold/80 font-mono uppercase tracking-wider mt-1">
                {mentor.title}
              </p>
              <p className="mt-3 text-sm text-cream/60 leading-relaxed">{mentor.cred}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center max-w-2xl mx-auto">
          <p className="text-xs text-cream/70 font-mono uppercase tracking-wider">
            Mentor credentials sourced from public profiles and internal records
          </p>
          <p className="mt-3 text-xs text-cream/65 leading-relaxed">
            Mentor availability and session formats are subject to scheduling. No specific
            mentor is guaranteed at any specific session.
          </p>
        </div>
      </div>
    </section>
  )
}
