/**
 * Lead-outreach email templates — fast paste-and-send paths for the
 * Deal detail page. Distinct from:
 *   - AI follow-up draft (bespoke, Claude-generated, 3 credits)
 *   - Proposal send (heavy, formal SOW)
 *
 * Each template has a subject + body string with double-curly variable
 * placeholders. The picker substitutes from the deal+enrichment+operator
 * context client-side — no API call, no credits, instant.
 *
 * Variables (always available; templates may use a subset):
 *   {{firstName}}        recipient first name (or "there" fallback)
 *   {{fullName}}         recipient full name
 *   {{companyName}}      target company name
 *   {{industry}}         enriched industry (or operator-set tag)
 *   {{cityState}}        "Austin, TX" if present
 *   {{description}}      enrichment description (1-line trim)
 *   {{employeesRange}}   "11-50 employees" type label
 *   {{operatorName}}     sender's first name
 *   {{operatorBusiness}} sender's business name
 *   {{calendarLink}}     placeholder; operator pastes their booking URL
 *
 * If a variable resolves to an empty string, the surrounding sentence
 * is auto-cleaned in renderTemplate() (sentences with empty {{x}}
 * collapse cleanly).
 */

export interface EmailTemplate {
  id: string
  label: string
  category: "cold" | "warm" | "follow-up" | "value" | "breakup" | "post-meeting"
  description: string
  subject: string
  body: string
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  // ─── COLD OPENERS ─────────────────────────────────────────────────
  {
    id: "cold-pain-point",
    label: "Cold — pain-point opener",
    category: "cold",
    description: "Leads with a specific industry pain. Best when you have enrichment data.",
    subject: "Quick thought on {{companyName}}",
    body: `Hi {{firstName}},

Saw {{companyName}} — {{description}}

A handful of {{industry}} operators we work with have run into the same trap: leads going cold because nobody picks up after 5pm, or maintenance requests piling up while staff is double-booked. The fix isn't more headcount — it's cheap automation that handles the predictable 80% so your team can focus on the 20% that needs a human.

If that resonates, happy to send over the playbook we've used at 4–5 similar shops. No pitch, just the doc.

— {{operatorName}}{{operatorBusinessLine}}`,
  },
  {
    id: "cold-curious-question",
    label: "Cold — curious question",
    category: "cold",
    description: "Opens with a genuine question. Lower-pressure than pain-led.",
    subject: "How is {{companyName}} handling {{topicHint}}?",
    body: `Hi {{firstName}},

Quick one — curious how {{companyName}} is currently handling after-hours inbound and lead routing? Asking because we just helped a {{industry}} shop in {{cityState}} cut their response time from 4 hours to under 60 seconds with a fairly simple AI agent + scheduling stack.

Worth a 15-minute look? Happy to share what we built and you can tell me if it would map to your setup.

— {{operatorName}}{{operatorBusinessLine}}`,
  },
  {
    id: "cold-value-led",
    label: "Cold — value-led insight",
    category: "value",
    description: "Leads with a tactical observation. Best for higher-intent prospects.",
    subject: "Quick observation about {{companyName}}",
    body: `Hi {{firstName}},

Looked at {{companyName}}'s setup briefly — one thing that jumped out: most {{industry}} operators at {{employeesRange}} headcount lose ~30% of inbound to slow first-response. Companies that fix this with an AI inbound agent typically see a 15–25% lift in qualified leads in the first 60 days.

I built one of these for a similar shop last month and the playbook is documented end-to-end. Want me to send it?

— {{operatorName}}{{operatorBusinessLine}}`,
  },

  // ─── WARM OPENERS ─────────────────────────────────────────────────
  {
    id: "warm-form-reply",
    label: "Warm — replying to a form / inquiry",
    category: "warm",
    description: "When the lead came in through a contact form, audit, or lead magnet.",
    subject: "Thanks for the note — quick reply for {{companyName}}",
    body: `Hi {{firstName}},

Thanks for reaching out about {{companyName}}. I read every inquiry personally — happy to dig in.

Two questions to make sure I send the right resources:
1. What's the #1 thing you're trying to fix right now?
2. Where does your current inbound + scheduling flow break down most?

Once I know, I'll either send a playbook + tool stack you can self-implement, or set up a 20-minute call if it makes more sense to walk through it together.

— {{operatorName}}{{operatorBusinessLine}}`,
  },
  {
    id: "warm-saw-content",
    label: "Warm — saw their content / post",
    category: "warm",
    description: "Customise the first sentence to reference the specific post/article.",
    subject: "Loved your recent post — question on {{companyName}}'s ops",
    body: `Hi {{firstName}},

Saw your recent post — the take on [INSERT SPECIFIC DETAIL] resonated.

Question: at {{companyName}}'s scale ({{employeesRange}}), how are you handling the operational load behind that growth? Asking because we work with operators in {{industry}} on the boring AI plumbing — inbound routing, follow-ups, content reposts — that lets the founder keep posting without losing the lead-flow gains.

Would 20 minutes next week be useful?

— {{operatorName}}{{operatorBusinessLine}}`,
  },

  // ─── FOLLOW-UPS ───────────────────────────────────────────────────
  {
    id: "followup-bump",
    label: "Follow-up — gentle bump",
    category: "follow-up",
    description: "When you sent something and got silence. Soft re-up.",
    subject: "Bumping this for {{firstName}}",
    body: `Hi {{firstName}},

Bumping my note from last week in case it slipped through. No pressure either way — just want to make sure {{companyName}} has what it needs if/when you're ready to tighten up the inbound side.

If now's not the moment, no worries. If it is, here's my calendar: {{calendarLink}}

— {{operatorName}}`,
  },
  {
    id: "followup-share-resource",
    label: "Follow-up — share a resource",
    category: "follow-up",
    description: "Drop a playbook / case study / loom. Operator pastes the link.",
    subject: "Thought you'd find this useful, {{firstName}}",
    body: `Hi {{firstName}},

Per your interest in tightening up {{companyName}}'s inbound flow — here's a quick walkthrough of the exact stack we deployed for a similar {{industry}} operator: [PASTE LINK / LOOM HERE]

It's about 6 minutes. If anything maps to what you're trying to fix, hit reply and we'll dig in.

— {{operatorName}}{{operatorBusinessLine}}`,
  },

  // ─── BREAKUP / LAST-TOUCH ─────────────────────────────────────────
  {
    id: "breakup-permission",
    label: "Breakup — permission to close",
    category: "breakup",
    description: "Last-touch email. High response rate when sent honestly.",
    subject: "Should I close the loop, {{firstName}}?",
    body: `Hi {{firstName}},

I've reached out a couple of times about {{companyName}} and haven't heard back, which usually means one of three things:

1. The timing isn't right — we'll circle back in Q2.
2. Someone else internally is owning this.
3. You decided to go a different direction.

Whichever it is, no hard feelings — just want to stop cluttering your inbox. Reply with the number that fits and I'll act accordingly.

— {{operatorName}}`,
  },

  // ─── POST-MEETING ─────────────────────────────────────────────────
  {
    id: "post-meeting-recap",
    label: "Post-meeting — recap + next steps",
    category: "post-meeting",
    description: "Send within 24h of a discovery call. Operator edits the bullet specifics.",
    subject: "Recap from our chat — {{companyName}}",
    body: `Hi {{firstName}},

Great chat earlier. Quick recap so we're aligned on next steps:

**What we discussed**
- [INSERT KEY PAIN POINT 1]
- [INSERT KEY PAIN POINT 2]
- [INSERT GOAL / OUTCOME THEY WANT]

**Proposed next step**
I'll send over a tailored proposal by [DATE] covering the specific scope we mapped. Includes timeline, monthly investment, and a fixed setup phase.

If anything in the recap is off, hit reply — I'd rather catch it now than after the proposal lands.

— {{operatorName}}{{operatorBusinessLine}}`,
  },
  {
    id: "post-meeting-no-show",
    label: "Post-meeting — no-show recovery",
    category: "post-meeting",
    description: "When the prospect missed the call. Frictionless rebook ask.",
    subject: "Missed you, {{firstName}} — happens",
    body: `Hi {{firstName}},

Looks like we got crossed up earlier — no worries, it happens.

Want to grab a quick 20 minutes this week or next? Here's my calendar so you can pick a slot that works: {{calendarLink}}

If the timing's just bad and you'd rather circle back in a few weeks, reply and I'll put it on the calendar to ping you then.

— {{operatorName}}`,
  },
] as const

/**
 * Render a template into a concrete subject + body using the deal context.
 * Resolves all {{variables}}, gracefully cleans up empty placeholders +
 * surrounding punctuation so the operator never sees "Hi  ," or "in  ."
 */
export function renderTemplate(
  template: EmailTemplate,
  vars: Record<string, string | null | undefined>,
): { subject: string; body: string } {
  // Pre-compute helpers — operatorBusinessLine prepends " at {business}"
  // when the business name exists, otherwise empty (so signature reads
  // "— Adam" not "— Adam ").
  const businessLine = vars.operatorBusiness?.trim()
    ? ` at ${vars.operatorBusiness.trim()}`
    : ""
  const topicHint = vars.industry?.trim()
    ? `${vars.industry.toLowerCase()} ops`
    : "inbound + scheduling"

  const allVars: Record<string, string> = {
    firstName: vars.firstName?.trim() || "there",
    fullName: vars.fullName?.trim() || vars.firstName?.trim() || "",
    companyName: vars.companyName?.trim() || "your team",
    industry: vars.industry?.trim() || "service",
    cityState: vars.cityState?.trim() || "",
    description: vars.description?.trim() || "",
    employeesRange: vars.employeesRange?.trim() || "your size",
    operatorName: vars.operatorName?.trim() || "",
    operatorBusiness: vars.operatorBusiness?.trim() || "",
    operatorBusinessLine: businessLine,
    topicHint,
    calendarLink: vars.calendarLink?.trim() || "[paste your calendar link]",
  }

  function fill(s: string): string {
    return s.replace(/\{\{(\w+)\}\}/g, (_, key) => allVars[key] ?? "")
  }

  let subject = fill(template.subject)
  let body = fill(template.body)

  // Clean up empty parenthetical / dash / comma fragments left behind by
  // empty variables (e.g. "in {{cityState}}" → "in " when no city).
  body = body
    .replace(/\bin\s+\.\s*/g, ". ") // "in ." after empty city
    .replace(/\bat\s+\.\s*/g, ". ") // "at ." after empty business
    .replace(/—\s*\n/g, "—\n") // trailing space after em-dash
    .replace(/  +/g, " ") // collapse multiple spaces
    .replace(/\n{3,}/g, "\n\n") // collapse 3+ newlines

  subject = subject.replace(/  +/g, " ").trim()

  return { subject, body }
}
