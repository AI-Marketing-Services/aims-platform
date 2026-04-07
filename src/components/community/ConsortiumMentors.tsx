const MENTORS = [
  {
    name: "Mike Hoffmann",
    title: "Founder & Serial Entrepreneur",
    cred: "Vending, AI Services, Coaching & Community",
    badge: "YPO Member",
  },
  {
    name: "George Shanine",
    title: "Founder & CEO",
    cred: "$30M EBITDA. Multiple exits over $50M.",
    badge: "YPO Member",
  },
  {
    name: "Chuck Hare",
    title: "Founder & Entrepreneur",
    cred: "$80M+ exit. Beverage & Transportation.",
    badge: "YPO Member",
  },
  {
    name: "Dan Fischer",
    title: "Founder & Investor",
    cred: "Gaming, Entertainment, Multi-state Lottery Ops.",
    badge: "YPO Member",
  },
  {
    name: "Paul Weinhold",
    title: "President & Chairman",
    cred: "Nonprofit Leadership. Banking & Finance.",
    badge: "Operator",
  },
  {
    name: "Dick Abraham",
    title: "Founder & Investor",
    cred: "Urgent Care. Hospital Systems. Healthcare.",
    badge: "Operator",
  },
]

export function ConsortiumMentors() {
  return (
    <section id="mentors" className="relative py-24 sm:py-32 border-t border-line bg-gradient-to-b from-deep to-ink">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-cream leading-[1.1]">
            Built By{" "}
            <span className="text-aims-gold italic">Operators</span>, Not Influencers
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
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-aims-gold/30 to-aims-gold/5 border border-aims-gold/30 flex items-center justify-center">
                  <span className="font-serif text-xl text-aims-gold">
                    {mentor.name.split(" ").map((n) => n[0]).join("")}
                  </span>
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

        <div className="mt-12 text-center">
          <p className="text-sm text-cream/50 font-mono uppercase tracking-wider">
            Combined operator footprint:{" "}
            <span className="text-aims-gold">$100M+ in exits, $30M+ EBITDA portfolio</span>
          </p>
        </div>
      </div>
    </section>
  )
}
