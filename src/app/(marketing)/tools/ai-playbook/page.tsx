import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Sparkles, BookOpen, Zap, Building2, Briefcase } from "lucide-react"
import { W2_PLAYS } from "@/lib/content/w2-playbook-plays"
import { PlayCard } from "@/components/tools/ai-playbook/PlayCard"
import { PlaybookEmailCapture } from "@/components/tools/ai-playbook/PlaybookEmailCapture"

export const metadata: Metadata = {
  title: "The AI Operator Playbook | 12 Plays for W-2 Professionals",
  description:
    "Twelve specific AI plays for corporate professionals — turn your W-2 expertise into an AI services business or become the AI champion at your day job. Free playbook, no fluff.",
  alternates: { canonical: "https://aioperatorcollective.com/tools/ai-playbook" },
  openGraph: {
    type: "article",
    url: "https://aioperatorcollective.com/tools/ai-playbook",
    title: "The AI Operator Playbook — 12 Plays for Corporate Operators",
    description:
      "Twelve specific AI plays for W-2 professionals. Turn your job expertise into an AI services business or become the AI champion at work. Free, no fluff.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
}

const APPLY_URL = "/#apply"

export default function AIPlaybookPage() {
  const buildPlays = W2_PLAYS.filter((p) => p.category === "build-a-business")
  const transformPlays = W2_PLAYS.filter((p) => p.category === "transform-from-within")

  return (
    <div className="min-h-screen bg-deep">
      {/* HERO */}
      <section className="relative border-b border-border bg-gradient-to-b from-card to-deep">
        <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-xs font-mono uppercase tracking-wider rounded-full mb-6">
            <BookOpen className="w-3.5 h-3.5" />
            Free · No payment required
          </div>
          <h1 className="font-serif text-4xl sm:text-6xl text-foreground leading-tight mb-6">
            The AI Operator{" "}
            <span className="block text-primary italic">Playbook.</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
            Twelve specific AI plays for corporate professionals. Turn your W-2 expertise
            into an AI services business — or become the AI champion at your day job.
            Plain English, real tools, real examples.
          </p>

          <PlaybookEmailCapture variant="hero" />

          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 max-w-2xl mx-auto">
            {[
              { icon: Briefcase, label: "Built for W-2 operators" },
              { icon: Zap, label: "12 specific plays" },
              { icon: Building2, label: "Real tools, real prices" },
              { icon: BookOpen, label: "Read online anytime" },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-card border border-border rounded-md p-3 flex items-center gap-2"
              >
                <item.icon className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-xs text-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INTRO */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <p className="text-xs font-mono uppercase tracking-wider text-primary mb-4 text-center">
          Read this first
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl text-foreground leading-tight mb-6 text-center">
          The honest framing.
        </h2>
        <div className="space-y-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
          <p>
            Most AI &quot;business&quot; advice on the internet is written by people
            who&apos;ve never built one. This playbook is the opposite: twelve plays
            we&apos;ve actually watched corporate operators run inside the AI Operator
            Collective. Some of them quit their W-2. Some of them stayed and became the
            AI person at work. Both are valid endgames.
          </p>
          <p>
            Each play below is structured the same way: the hook, the steps, the tools,
            and a real-world example from someone who actually shipped it. No theory.
            No fluff. No &quot;you should think about leveraging AI for your business&quot;
            generic garbage.
          </p>
          <p className="text-foreground font-semibold">
            The hard part isn&apos;t reading this playbook. It&apos;s running it. The
            Collective is the community where members workshop these plays together — but
            you don&apos;t need to apply to use the playbook. It&apos;s yours either way.
          </p>
        </div>
      </section>

      {/* BUILD-A-BUSINESS PLAYS */}
      <section className="border-t border-border bg-gradient-to-b from-deep to-card/30">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <p className="text-xs font-mono uppercase tracking-wider text-primary mb-3">
              Track 1 · Build Your Own
            </p>
            <h2 className="font-serif text-3xl sm:text-5xl text-foreground leading-tight mb-4">
              Turn your W-2 into an{" "}
              <span className="block text-primary italic">AI services business.</span>
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              Nine specific plays for the corporate operator who wants to build their own
              thing. Run them in order, run them in parallel, or pick the one that fits
              your week.
            </p>
          </div>

          <div className="space-y-4">
            {buildPlays.map((play) => (
              <PlayCard key={play.id} play={play} applyUrl={APPLY_URL} />
            ))}
          </div>
        </div>
      </section>

      {/* MID-PAGE CTA BANNER */}
      <section className="border-y border-primary/30 bg-gradient-to-r from-primary/10 via-card to-primary/10">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <p className="text-xs font-mono uppercase tracking-wider text-primary mb-3">
            Pause for a sec
          </p>
          <h3 className="font-serif text-2xl sm:text-4xl text-foreground leading-tight mb-4">
            Reading is the easy part.
          </h3>
          <p className="text-base text-muted-foreground mb-6 max-w-xl mx-auto">
            The Collective is where operators workshop these plays in real time with each
            other. If you want feedback on which one fits your situation, that&apos;s
            what the community is for.
          </p>
          <Link
            href={APPLY_URL}
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-white font-semibold rounded-md hover:bg-primary/90 transition-colors"
          >
            Apply to the AI Operator Collective <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-muted-foreground mt-4">
            Application-only · Reviewed by a real operator · No pitch calls
          </p>
        </div>
      </section>

      {/* TRANSFORM-FROM-WITHIN PLAYS */}
      <section className="border-t border-border">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <p className="text-xs font-mono uppercase tracking-wider text-primary mb-3">
              Track 2 · Transform From Within
            </p>
            <h2 className="font-serif text-3xl sm:text-5xl text-foreground leading-tight mb-4">
              Or become the{" "}
              <span className="block text-primary italic">AI person at work.</span>
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              Three plays for the operator who wants to stay W-2 — but be the one who
              shipped AI inside their company before anyone else figured it out.
            </p>
          </div>

          <div className="space-y-4">
            {transformPlays.map((play) => (
              <PlayCard key={play.id} play={play} applyUrl={APPLY_URL} />
            ))}
          </div>
        </div>
      </section>

      {/* WHAT'S MISSING SECTION */}
      <section className="border-t border-border bg-card/30">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <p className="text-xs font-mono uppercase tracking-wider text-primary mb-3 text-center">
            The honest part
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl text-foreground leading-tight mb-6 text-center">
            What this playbook can&apos;t do for you.
          </h2>
          <div className="space-y-5 text-base text-muted-foreground leading-relaxed">
            <p>
              A playbook is a map. It can show you where to go. It can&apos;t walk the
              steps for you. The reason most people who download AI playbooks never run
              them is the same reason most people who buy gym memberships don&apos;t go:
              there&apos;s no community, no accountability, no one workshopping the parts
              you get stuck on.
            </p>
            <p>
              The AI Operator Collective is the part of this that the playbook can&apos;t
              be. It&apos;s the working community where members workshop each other&apos;s
              audits, offers, deployments, and first conversations in real time. Hot
              seats every week. A library of every prompt, every workflow, every Cursor
              workspace someone shipped. And operators who&apos;ve already run these plays
              tearing apart your version of them.
            </p>
            <p className="text-foreground font-semibold">
              Whether or not you apply, the playbook is yours forever. Bookmark this
              page. Run the plays. We&apos;re here when you want help compressing the
              learning curve.
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CTA + EMAIL CAPTURE */}
      <section className="border-t border-primary/30 bg-gradient-to-b from-card to-deep">
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <Sparkles className="w-10 h-10 text-primary mx-auto mb-5" />
          <h2 className="font-serif text-3xl sm:text-5xl text-foreground leading-tight mb-5">
            Save your spot in the playbook.
          </h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto mb-10">
            Drop your email and we&apos;ll send you the welcome email with this page
            bookmarked, plus two follow-up emails over the next two weeks with the
            deeper plays we don&apos;t publish here. Then we stop emailing.
          </p>

          <PlaybookEmailCapture variant="footer" />

          <div className="mt-12 pt-10 border-t border-border">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
              Or skip the email
            </p>
            <Link
              href={APPLY_URL}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-card border border-primary/40 text-primary font-semibold rounded-md hover:border-primary hover:bg-primary/10 transition-colors"
            >
              Apply to the AI Operator Collective directly <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* DISCLOSURES */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 py-10 text-center">
          <p className="text-xs text-muted-foreground leading-relaxed">
            The AI Operator Collective makes no income, earnings, or client outcome
            claims. The plays in this playbook are educational. Any results referenced
            are descriptive of operators inside the Collective and are not representative
            of typical outcomes. Your results depend entirely on your own execution,
            market, and effort.
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            Operated by Modern Amenities LLC · Powered by AIMS
          </p>
        </div>
      </footer>
    </div>
  )
}
