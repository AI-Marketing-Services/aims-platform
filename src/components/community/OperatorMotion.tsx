import { Check } from "lucide-react"

const POINTS = [
  {
    title: "How to tell whether a business is worth approaching",
    body: "before you waste the conversation.",
  },
  {
    title: "The discovery rule that keeps new operators",
    body: "from promising a solution too early.",
  },
  {
    title: "How to spot little fires",
    body: "hiding in handoffs, follow-up, reporting, repeated questions, and manual work nobody owns.",
  },
  {
    title: "Why the 3-tier solutioning model matters",
    body: "when a problem could be solved with training, integration, or a deeper build.",
  },
  {
    title: "How to translate messy context",
    body: "into a business-facing next move without sounding like an AI gimmick.",
  },
  {
    title: "What has to be set up around the work",
    body: "so the business side does not become the bottleneck.",
  },
]

export function OperatorMotion() {
  return (
    <section
      id="how-it-works"
      className="relative py-24 sm:py-32 border-t border-[#E3E3E3] bg-[#F5F5F5] texture-light dot-grid-light"
    >
      <div className="relative z-10 mx-auto max-w-[1280px] px-6">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-playfair text-4xl sm:text-5xl md:text-6xl text-[#1A1A1A] leading-[1.2] pb-2">
            The work most AI content
            <span className="block text-crimson italic">skips.</span>
          </h2>
          <p className="mt-6 text-base sm:text-lg text-[#737373] leading-relaxed">
            AIOC is not here to hand you another pile of tutorials. Inside the cohort,
            members practice the operating motion behind credible AI work:
            prospecting, discovery, diagnosis, scoping, setup, and delivery.
          </p>
        </div>

        <div className="mt-12 max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
          {POINTS.map((p) => (
            <div
              key={p.title}
              className="rounded-md border border-[#E3E3E3] bg-white p-5 sm:p-6 hover:border-crimson/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                <Check className="w-4 h-4 text-crimson mt-1 flex-shrink-0" />
                <div className="text-sm text-[#383838] leading-relaxed">
                  <span className="font-medium text-[#1A1A1A]">{p.title}</span>{" "}
                  <span className="text-[#737373]">{p.body}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 max-w-3xl mx-auto text-center space-y-2 text-base text-[#737373]">
          <p>Some of this is AI.</p>
          <p>Some of it is prospecting.</p>
          <p>Some of it is sales.</p>
          <p className="font-medium text-[#1A1A1A]">Some of it is restraint.</p>
          <p className="pt-2 text-sm text-[#737373] italic max-w-xl mx-auto">
            That last part matters more than people think. AI is gasoline. Without a
            real problem underneath it, AI is just noise. The leverage comes from the
            problem, not the tool.
          </p>
        </div>
      </div>
    </section>
  )
}
