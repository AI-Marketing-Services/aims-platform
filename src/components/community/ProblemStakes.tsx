/**
 * Problem / Stakes section. Replaces the old YouTube-vs-Collective
 * comparison table. Frames why the gap most AI education leaves open
 * is the operator motion — knowing which businesses to approach, what
 * to ask, when to stop talking about tools.
 */
export function ProblemStakes() {
  return (
    <section
      className="relative py-20 sm:py-24 border-t border-neutral-200 bg-white texture-light dot-grid-light"
    >
      <div className="relative z-10 mx-auto max-w-3xl px-6">
        <h2 className="font-playfair text-3xl sm:text-4xl md:text-5xl text-neutral-900 leading-[1.15] tracking-tight text-balance pb-2">
          Learning AI is not the same as{" "}
          <span className="md:block text-crimson italic">
            becoming useful with it.
          </span>
        </h2>

        <div className="mt-8 space-y-5 text-base sm:text-lg text-neutral-600 leading-relaxed">
          <p>AI tutorials show clean examples.</p>
          <p>
            Real businesses hand you messy ones: the report nobody trusts, the handoff
            that keeps breaking, the follow-up that never happens, the customer
            question answered from scratch again.
          </p>
          <p>
            Most businesses do not know which of those problems AI can help fix yet.
          </p>
          <p className="text-neutral-900 font-medium">That is where operators matter.</p>
          <p>
            They know which businesses are worth approaching, what to ask in
            discovery, when to stop talking about tools, and how to scope the first
            practical move without overpromising.
          </p>
          <p>That is the gap most AI education leaves open.</p>
          <p className="text-neutral-900">
            The opportunity is not &ldquo;learn AI.&rdquo; The opportunity is becoming
            the operator a business can trust to find the right problem, run the right
            conversation, and scope the right solution.
          </p>
        </div>
      </div>
    </section>
  )
}
