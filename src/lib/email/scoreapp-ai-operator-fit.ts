import { btn, divider, emailLayout, escapeHtml, h1, p, sendTrackedEmail } from "./index"
import { AOC_FROM_EMAIL as FROM_EMAIL, AOC_REPLY_TO as REPLY_TO, RYAN_SALES_BCC } from "./senders"

export type ScoreappArchetype =
  | "diagnostician"
  | "tinkerer"
  | "multi-threader"
  | "spectator"

export interface ScoreappDimensionScore {
  label: string
  score: number
  tier?: string
}

export interface ScoreappEmailMetadata {
  firstName?: string
  archetype: ScoreappArchetype
  archetypeLabel: string
  resultsUrl?: string
  dimensions?: ScoreappDimensionScore[]
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.aioperatorcollective.com"
const APPLY_URL = `${APP_URL}/apply`

export const SCOREAPP_SEQUENCE_KEYS = {
  diagnostician: "scoreapp-diagnostician",
  tinkerer: "scoreapp-tinkerer",
  "multi-threader": "scoreapp-multi-threader",
  spectator: "scoreapp-spectator",
} as const satisfies Record<ScoreappArchetype, string>

export const SCOREAPP_FOLLOWUP_STEPS = {
  "scoreapp-diagnostician": [
    { delay: 2, subject: "Your corporate experience is raw material", templateKey: "scoreapp-diagnostician-raw-material" },
    { delay: 4, subject: "The bridge from diagnosis to AI", templateKey: "scoreapp-diagnostician-bridge" },
    { delay: 7, subject: "This is the useful next step", templateKey: "scoreapp-diagnostician-next-step" },
    { delay: 12, subject: "Last note on your scorecard", templateKey: "scoreapp-diagnostician-close" },
  ],
  "scoreapp-tinkerer": [
    { delay: 2, subject: "The bridge from tinkering to paid work", templateKey: "scoreapp-tinkerer-paid-work" },
    { delay: 4, subject: "Tools are not the business", templateKey: "scoreapp-tinkerer-problem-first" },
    { delay: 7, subject: "This is the useful next step", templateKey: "scoreapp-tinkerer-next-step" },
    { delay: 12, subject: "Last note on your scorecard", templateKey: "scoreapp-tinkerer-close" },
  ],
  "scoreapp-multi-threader": [
    { delay: 3, subject: "The pattern your scorecard is pointing at", templateKey: "scoreapp-multi-threader-pattern" },
    { delay: 7, subject: "Why ideas die around month three", templateKey: "scoreapp-multi-threader-month-three" },
    { delay: 12, subject: "Pick one path for 90 days", templateKey: "scoreapp-multi-threader-close" },
  ],
  "scoreapp-spectator": [
    { delay: 3, subject: "How operator income actually works", templateKey: "scoreapp-spectator-operator-income" },
    { delay: 7, subject: "What real operator weeks look like", templateKey: "scoreapp-spectator-real-weeks" },
    { delay: 12, subject: "Keeping the door open", templateKey: "scoreapp-spectator-close" },
  ],
} as const

export function normalizeScoreappArchetype(value: string | undefined): ScoreappArchetype {
  const raw = value?.toLowerCase() ?? ""
  if (raw.includes("tinker")) return "tinkerer"
  if (raw.includes("multi") || raw.includes("thread")) return "multi-threader"
  if (raw.includes("spectator")) return "spectator"
  return "diagnostician"
}

export function getScoreappSequenceKey(archetype: ScoreappArchetype) {
  return SCOREAPP_SEQUENCE_KEYS[archetype]
}

export async function sendScoreappFitResultsEmail(params: {
  to: string
  metadata: ScoreappEmailMetadata
}) {
  const firstName = safeFirstName(params.metadata.firstName)
  const subject = `${firstName}, your AI Operator scorecard results`
  const body = `
    ${h1(`${firstName}, your scorecard points to ${escapeHtml(params.metadata.archetypeLabel)}.`)}
    ${p("Jess here. I wanted to send the quick read while the scorecard is still fresh. This is not a personality test. It is a signal about where your current instincts are strongest, and where the real work would need to start.")}
    ${p(archetypeRead(params.metadata.archetype))}
    ${dimensionSummary(params.metadata.dimensions)}
    ${params.metadata.resultsUrl ? btn("Open your full results", params.metadata.resultsUrl) : ""}
    ${divider()}
    ${p("If the result felt uncomfortably accurate and you want to talk through whether the next cohort is a fit, you can book a call below. No pressure. The useful outcome is clarity either way.")}
    ${btn("Book a cohort fit call", APPLY_URL)}
    <p style="margin:32px 0 0;font-size:13px;color:#4B5563;line-height:1.6;">
      Jess<br/>
      <span style="color:#9CA3AF;font-size:12px;">AI Operator Collective</span>
    </p>
    <p style="margin:24px 0 0;font-size:11px;color:#9CA3AF;line-height:1.55;font-style:italic;">
      Disclosure: The AI Operator Collective makes no income, earnings, client, placement, or W-2 replacement claims. This is a practical training path, not a guarantee.
    </p>
  `

  return sendTrackedEmail({
    from: FROM_EMAIL,
    to: params.to,
    bcc: RYAN_SALES_BCC,
    replyTo: REPLY_TO,
    subject,
    html: emailLayout(body, "Your AI Operator scorecard results.", params.to),
    serviceArm: "ai-operator-collective",
    templateKey: `scoreapp.${params.metadata.archetype}.results`,
  })
}

export function buildScoreappFitEmail(
  emailIndex: number,
  metadata: Record<string, unknown> = {}
): { subject: string; html: string } | null {
  const archetype = normalizeScoreappArchetype(String(metadata.archetype ?? ""))
  const sequenceKey = getScoreappSequenceKey(archetype)
  const step = SCOREAPP_FOLLOWUP_STEPS[sequenceKey][emailIndex]
  if (!step) return null

  const firstName = safeFirstName(metadata.firstName as string | undefined)
  const archetypeLabel = escapeHtml(
    (metadata.archetypeLabel as string | undefined) ?? labelForArchetype(archetype)
  )
  const resultsUrl = typeof metadata.resultsUrl === "string" ? metadata.resultsUrl : undefined

  return {
    subject: step.subject,
    html: `
      ${h1(`${firstName}, one more thought on ${archetypeLabel}.`)}
      ${p(followupBody(archetype, emailIndex))}
      ${resultsUrl ? p(`Your full scorecard is still here: <a href="${resultsUrl}" style="color:#981B1B;font-weight:600;text-decoration:none;">open your results</a>.`) : ""}
      ${p("If you want to talk through whether this maps to the next AIOC cohort, book a fit call. If not, keep the read and use it as a mirror.")}
      ${btn("Book a cohort fit call", APPLY_URL)}
      <p style="margin:32px 0 0;font-size:13px;color:#4B5563;line-height:1.6;">Jess</p>
      <p style="margin:24px 0 0;font-size:11px;color:#9CA3AF;line-height:1.55;font-style:italic;">
        Disclosure: The AI Operator Collective makes no income, earnings, client, placement, or W-2 replacement claims.
      </p>
    `,
  }
}

function safeFirstName(value: string | undefined) {
  const safe = escapeHtml(value ?? "").trim().split(/\s+/)[0]
  return safe || "there"
}

function labelForArchetype(archetype: ScoreappArchetype) {
  switch (archetype) {
    case "tinkerer":
      return "The Tinkerer"
    case "multi-threader":
      return "The Multi-Threader"
    case "spectator":
      return "The Spectator"
    default:
      return "The Diagnostician"
  }
}

function archetypeRead(archetype: ScoreappArchetype) {
  switch (archetype) {
    case "tinkerer":
      return "The Tinkerer has useful energy: you are already close enough to the tools to see what might be possible. The gap is usually not effort. It is learning to stop starting with the tool and start with the business problem."
    case "multi-threader":
      return "The Multi-Threader pattern is not a lack of intelligence. It is too many possible paths competing for attention. The work is choosing one useful lane long enough for the market to give you real feedback."
    case "spectator":
      return "The Spectator result usually means the desire for change is real, but the expectations may need a reset. This path is reps, diagnosis, and practice. It is not passive income in a new costume."
    default:
      return "The Diagnostician has one of the strongest raw ingredients for operator work: you notice broken systems. The gap is turning that instinct into a repeatable bridge from business problem to AI-supported solution."
  }
}

function dimensionSummary(dimensions: ScoreappDimensionScore[] | undefined) {
  if (!dimensions?.length) return ""
  const sorted = [...dimensions].sort((a, b) => b.score - a.score)
  const strongest = sorted[0]
  const weakest = sorted[sorted.length - 1]
  return `
    <div style="background:#F9FAFB;border:1px solid #F0F0F0;border-radius:8px;padding:18px 20px;margin:0 0 22px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#111827;">Your strongest signal: ${escapeHtml(strongest.label)} (${strongest.score})</p>
      <p style="margin:0;font-size:13px;color:#4B5563;line-height:1.6;">Your biggest gap: ${escapeHtml(weakest.label)} (${weakest.score}). This is the part I would pay attention to first, because gaps usually tell the truth faster than strengths do.</p>
    </div>
  `
}

function followupBody(archetype: ScoreappArchetype, emailIndex: number) {
  const copy = {
    diagnostician: [
      "Your corporate experience is not a detour from AI operator work. It is the raw material. You have seen how work actually breaks: handoffs, delays, manual patches, recurring confusion, meetings pretending to be systems.",
      "The bridge is learning to move from 'I see the problem' to 'I can shape the problem into a solution someone would pay to have fixed.' AI is useful only after the problem is clear.",
      "The next step is not buying more tools. It is testing whether your pattern-recognition can become a practical operator skill inside a focused container.",
      "Last note from me for now: if this result felt accurate, do not let it become another interesting thing you read. Make one real decision about what you want to do with it.",
    ],
    tinkerer: [
      "Tinkering is useful. It gets your hands dirty. But paid operator work starts when the build serves a business problem instead of your curiosity.",
      "Tools are not the business. The business is finding the little fires inside a company and using the right tool to put them out cleanly.",
      "The next step is learning to translate what you can build into something a business owner understands, values, and can say yes to.",
      "Last note from me for now: your curiosity is an asset. The question is whether you are ready to aim it at a real market problem.",
    ],
    "multi-threader": [
      "Your pattern is probably not laziness. It is option overload wearing a productivity costume. Lots of paths look viable before any of them have been tested against reality.",
      "Month three is where vague ideas usually die. Not because the idea is bad, but because there was no one lane, no feedback loop, and no real constraint.",
      "Pick one path for 90 days. Not forever. Long enough to learn something real. That is the beginning of operator judgment.",
    ],
    spectator: [
      "Operator income does not come from watching the market get interesting. It comes from doing the unglamorous reps: noticing problems, talking to businesses, and shaping fixes that are clear enough to buy.",
      "A real operator week has practice in it. Discovery, outreach, diagnosis, follow-up, a small build, a messy conversation. It is not just research with better tabs.",
      "The door stays open, but the expectation has to be clean: this is active work. If that still interests you, that is worth paying attention to.",
    ],
  } satisfies Record<ScoreappArchetype, string[]>

  return copy[archetype][emailIndex] ?? copy[archetype][0]
}
