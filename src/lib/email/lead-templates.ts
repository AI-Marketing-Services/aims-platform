/**
 * Lead-outreach email templates. Fast paste-and-send paths for the
 * Deal detail page. Distinct from:
 *   1. AI follow-up draft (bespoke, Claude-generated, 3 credits)
 *   2. Proposal send (heavy, formal SOW)
 *
 * Each template has a subject + body string with double-curly variable
 * placeholders. The picker substitutes from the deal+enrichment+operator
 * context client-side. No API call, no credits, instant.
 *
 * STYLE: zero em dashes anywhere. Use periods, commas, or colons instead.
 * Reads like a real human wrote it, not an AI-generated form letter.
 *
 * Variables (always available; templates may use a subset):
 *   {{firstName}}        recipient first name (or "there" fallback)
 *   {{fullName}}         recipient full name
 *   {{companyName}}      target company name
 *   {{industry}}         enriched industry
 *   {{cityState}}        "Austin, TX" if present
 *   {{description}}      enrichment description (1-line trim)
 *   {{employeesRange}}   "11-50 employees" type label
 *   {{operatorName}}     sender's first name
 *   {{operatorBusiness}} sender's business name
 *   {{calendarLink}}     placeholder; operator pastes their booking URL
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
  // COLD OPENERS
  {
    id: "cold-pain-point",
    label: "Cold opener: pain point",
    category: "cold",
    description: "Leads with a specific industry pain. Best when you have enrichment data.",
    subject: "Quick thought on {{companyName}}",
    body: `Hi {{firstName}},

Saw {{companyName}}. {{description}}

A handful of {{industry}} operators we work with have run into the same trap. Leads going cold because nobody picks up after 5pm, or maintenance requests piling up while the team is double booked. The fix isn't more headcount, it's cheap automation that handles the predictable 80% so the team can focus on the 20% that actually needs a human.

If that resonates, happy to send over the playbook we've used at a few similar shops. No pitch, just the doc.

Best,
{{operatorName}}{{operatorBusinessLine}}`,
  },
  {
    id: "cold-curious-question",
    label: "Cold opener: curious question",
    category: "cold",
    description: "Opens with a genuine question. Lower-pressure than pain-led.",
    subject: "How is {{companyName}} handling {{topicHint}}?",
    body: `Hi {{firstName}},

Quick one. Curious how {{companyName}} is currently handling after-hours inbound and lead routing.

Asking because we just helped a {{industry}} shop in {{cityState}} cut their response time from four hours to under sixty seconds with a fairly simple AI agent and scheduling stack.

Worth a 15-minute look? Happy to share what we built and you can tell me if it would map to your setup.

Best,
{{operatorName}}{{operatorBusinessLine}}`,
  },
  {
    id: "cold-value-led",
    label: "Cold opener: value led",
    category: "value",
    description: "Leads with a tactical observation. Best for higher-intent prospects.",
    subject: "Quick observation about {{companyName}}",
    body: `Hi {{firstName}},

Looked at {{companyName}}'s setup briefly. One thing that jumped out: most {{industry}} operators at {{employeesRange}} headcount lose roughly 30% of inbound to slow first-response. Companies that fix this with an AI inbound agent typically see a 15 to 25% lift in qualified leads in the first 60 days.

I built one of these for a similar shop last month and the playbook is documented end to end. Want me to send it?

Best,
{{operatorName}}{{operatorBusinessLine}}`,
  },

  // WARM OPENERS
  {
    id: "warm-form-reply",
    label: "Warm opener: replying to inquiry",
    category: "warm",
    description: "When the lead came in through a contact form, audit, or lead magnet.",
    subject: "Thanks for the note. Quick reply for {{companyName}}",
    body: `Hi {{firstName}},

Thanks for reaching out about {{companyName}}. I read every inquiry personally, happy to dig in.

Two questions to make sure I send the right resources:

1. What's the number-one thing you're trying to fix right now?
2. Where does your current inbound and scheduling flow break down most?

Once I know, I'll either send a playbook + tool stack you can self-implement, or set up a 20-minute call if it makes more sense to walk through it together.

Best,
{{operatorName}}{{operatorBusinessLine}}`,
  },
  {
    id: "warm-saw-content",
    label: "Warm opener: saw their content",
    category: "warm",
    description: "Customise the first sentence to reference the specific post or article.",
    subject: "Loved your recent post. Question on {{companyName}}'s ops",
    body: `Hi {{firstName}},

Saw your recent post. The take on [INSERT SPECIFIC DETAIL] resonated.

Question: at {{companyName}}'s scale ({{employeesRange}}), how are you handling the operational load behind that growth? Asking because we work with operators in {{industry}} on the boring AI plumbing. Inbound routing, follow-ups, content reposts. The stuff that lets the founder keep posting without losing the lead-flow gains.

Would 20 minutes next week be useful?

Best,
{{operatorName}}{{operatorBusinessLine}}`,
  },

  // FOLLOW-UPS
  {
    id: "followup-bump",
    label: "Follow-up: gentle bump",
    category: "follow-up",
    description: "When you sent something and got silence. Soft re-up.",
    subject: "Bumping this for {{firstName}}",
    body: `Hi {{firstName}},

Bumping my note from last week in case it slipped through. No pressure either way, just want to make sure {{companyName}} has what it needs if and when you're ready to tighten up the inbound side.

If now's not the moment, no worries. If it is, here's my calendar: {{calendarLink}}

Best,
{{operatorName}}`,
  },
  {
    id: "followup-share-resource",
    label: "Follow-up: share a resource",
    category: "follow-up",
    description: "Drop a playbook, case study, or Loom. Operator pastes the link.",
    subject: "Thought you'd find this useful, {{firstName}}",
    body: `Hi {{firstName}},

Per your interest in tightening up {{companyName}}'s inbound flow, here's a quick walkthrough of the exact stack we deployed for a similar {{industry}} operator: [PASTE LINK OR LOOM HERE]

It's about six minutes. If anything maps to what you're trying to fix, hit reply and we'll dig in.

Best,
{{operatorName}}{{operatorBusinessLine}}`,
  },

  // BREAKUP
  {
    id: "breakup-permission",
    label: "Breakup: permission to close",
    category: "breakup",
    description: "Last-touch email. High response rate when sent honestly.",
    subject: "Should I close the loop, {{firstName}}?",
    body: `Hi {{firstName}},

I've reached out a couple of times about {{companyName}} and haven't heard back, which usually means one of three things:

1. The timing isn't right and we'll circle back in Q2.
2. Someone else internally is owning this.
3. You decided to go a different direction.

Whichever it is, no hard feelings. Just want to stop cluttering your inbox. Reply with the number that fits and I'll act accordingly.

Best,
{{operatorName}}`,
  },

  // POST-MEETING
  {
    id: "post-meeting-recap",
    label: "Post-meeting: recap and next steps",
    category: "post-meeting",
    description: "Send within 24h of a discovery call. Operator edits the bullet specifics.",
    subject: "Recap from our chat. {{companyName}}",
    body: `Hi {{firstName}},

Great chat earlier. Quick recap so we're aligned on next steps.

**What we discussed**

1. [INSERT KEY PAIN POINT 1]
2. [INSERT KEY PAIN POINT 2]
3. [INSERT GOAL OR OUTCOME THEY WANT]

**Proposed next step**

I'll send over a tailored proposal by [DATE] covering the specific scope we mapped. It includes timeline, monthly investment, and a fixed setup phase.

If anything in the recap is off, hit reply. I'd rather catch it now than after the proposal lands.

Best,
{{operatorName}}{{operatorBusinessLine}}`,
  },
  {
    id: "post-meeting-no-show",
    label: "Post-meeting: no-show recovery",
    category: "post-meeting",
    description: "When the prospect missed the call. Frictionless rebook ask.",
    subject: "Missed you, {{firstName}}. Happens",
    body: `Hi {{firstName}},

Looks like we got crossed up earlier. No worries, it happens.

Want to grab a quick 20 minutes this week or next? Here's my calendar so you can pick a slot that works: {{calendarLink}}

If the timing's just bad and you'd rather circle back in a few weeks, reply and I'll put it on the calendar to ping you then.

Best,
{{operatorName}}`,
  },
] as const

/**
 * Render a template into a concrete subject + body using the deal context.
 * Resolves all {{variables}}, strips any em-dashes that slip in via future
 * edits or AI-generated content, and cleans up empty placeholders.
 */
export function renderTemplate(
  template: EmailTemplate,
  vars: Record<string, string | null | undefined>,
): { subject: string; body: string } {
  const businessLine = vars.operatorBusiness?.trim()
    ? ` at ${vars.operatorBusiness.trim()}`
    : ""
  const topicHint = vars.industry?.trim()
    ? `${vars.industry.toLowerCase()} ops`
    : "inbound and scheduling"

  const allVars: Record<string, string> = {
    firstName: vars.firstName?.trim() || "there",
    fullName: vars.fullName?.trim() || vars.firstName?.trim() || "",
    companyName: vars.companyName?.trim() || "your team",
    industry: vars.industry?.trim() || "service",
    cityState: vars.cityState?.trim() || "your area",
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

  // Defensive em-dash sweep at render time. Even if a future edit
  // reintroduces an em-dash anywhere in the source, this strips it
  // before the operator ever sees it. Replace with a period+space so
  // sentence boundaries stay clean.
  subject = subject.replace(/\s*—\s*/g, ". ")
  body = body.replace(/\s*—\s*/g, ". ")

  // Clean up trailing artifacts.
  body = body
    .replace(/  +/g, " ")
    .replace(/\.\s*\./g, ".")
    .replace(/\n{3,}/g, "\n\n")

  subject = subject
    .replace(/  +/g, " ")
    .replace(/\.\s*\.$/, ".")
    .trim()

  return { subject, body }
}
