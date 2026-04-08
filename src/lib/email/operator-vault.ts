import { sendTrackedEmail, escapeHtml, emailLayout, h1, p, btn, divider } from "./index"
import { getCommunityInviteUrl } from "./community-sequence"

const FROM_EMAIL = "AI Operator Collective <irtaza@modern-amenities.com>"
const REPLY_TO = "irtaza@modern-amenities.com"

function playCard(num: string, title: string, body: string) {
  return `
    <div style="background:#F9FAFB;border-left:3px solid #C4972A;border-radius:6px;padding:18px 22px;margin:0 0 14px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#C4972A;text-transform:uppercase;letter-spacing:0.08em;">Play ${num}</p>
      <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#111827;">${title}</p>
      <p style="margin:0;font-size:13px;color:#4B5563;line-height:1.65;">${body}</p>
    </div>
  `
}

export async function sendOperatorVaultEmail(params: { to: string; name: string }) {
  const safeName = escapeHtml(params.name || "").trim()
  const greeting = safeName ? `${safeName.split(" ")[0]}, welcome in.` : "Welcome in."
  const applyUrl = "https://aioperatorcollective.com/#apply"
  const inviteUrl = getCommunityInviteUrl()

  const body = `
    ${h1(greeting)}
    ${p(
      "You just requested the AI Operator Playbook Vault. It's below — no gate, no upsell. Whether you end up applying to the cohort or not, these are the exact plays we use inside the AIMS portfolio to find, close, and deliver AI services work. Save this email. You'll come back to it."
    )}

    <div style="background:#0b0d12;border:1px solid #C4972A;border-radius:10px;padding:22px 24px;margin:24px 0;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#C4972A;text-transform:uppercase;letter-spacing:0.12em;">The Vault · Chapter 1</p>
      <p style="margin:0;font-size:22px;font-weight:800;color:#F0EBE0;line-height:1.25;">Your First 5 Operator Moves</p>
      <p style="margin:6px 0 0;font-size:13px;color:#9CA3AF;">Do these in order. Every one of them is a week's work or less.</p>
    </div>

    ${playCard(
      "01",
      "Write your offer in one sentence, then in one paragraph.",
      "Fill in: <em>I help [ICP] [outcome] by [mechanism] so they can [business result].</em> If you can't say it in one sentence, you don't have an offer yet — you have a job title. Don't build a website, don't register an LLC, don't buy tools. Write the sentence first. Every operator in the AIMS network ran this drill before anything else."
    )}

    ${playCard(
      "02",
      "Build a 50-person dream ICP list before any tooling.",
      "No databases, no scrapers, no AI yet. Open LinkedIn, open a Google sheet, and hand-build a list of 50 real companies that would benefit from your offer. Name, title, company, one sentence on why they fit. This is the highest-leverage hour you'll spend all week — it's also the step 95% of people skip straight past."
    )}

    ${playCard(
      "03",
      "Price in ranges, never in single numbers.",
      "When a prospect asks what it costs, the weakest thing you can say is a single number. The strongest thing you can say: <em>\"Engagements in this space typically range from $X to $Y depending on scope — let's scope yours before I quote.\"</em> That sentence alone has closed more AIMS deals than any proposal template. It moves you from vendor to advisor in one line."
    )}

    ${playCard(
      "04",
      "Lead with a diagnosis, not a demo.",
      "The discovery call is a diagnosis appointment, not a product demo. Before you pitch anything, spend 20 minutes asking about their workflow, their KPIs, and the specific task that's bleeding time. When you finally describe your service, describe it as a prescription for what they just told you. Close rate doubles when you reorder these."
    )}

    ${playCard(
      "05",
      "Deploy the client ROI calculator live in the meeting.",
      "When it's time to close, open a shared screen and calculate ROI <em>with</em> the prospect — hours saved × blended cost per hour × months of payback, minus your fee. You're not selling price. You're selling a number they just computed with you. That's not a sales tactic. That's math the prospect did themselves."
    )}

    ${divider()}

    <div style="background:#0b0d12;border:1px solid #C4972A;border-radius:10px;padding:24px 26px;margin:0 0 24px;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:800;color:#C4972A;text-transform:uppercase;letter-spacing:0.12em;">Your community invite</p>
      <p style="margin:0 0 12px;font-size:19px;font-weight:800;color:#F0EBE0;line-height:1.3;">Jump into the operator community.</p>
      <p style="margin:0 0 18px;font-size:14px;color:#9CA3AF;line-height:1.65;">
        This is where the active cohort members, the consortium operators, and the admin team live day-to-day.
        Bring a question, a half-built offer, or just lurk until you're ready to post. You're in.
      </p>
      <a href="${inviteUrl}" style="display:inline-block;background:#C4972A;color:#0b0d12;padding:13px 28px;border-radius:6px;text-decoration:none;font-weight:800;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;">Accept my invite</a>
      <p style="margin:12px 0 0;font-size:11px;color:#6B7280;font-style:italic;">Save this email — the invite link works any time.</p>
    </div>

    <div style="background:#FEF2F2;border-radius:8px;padding:22px 24px;margin:0 0 24px;">
      <p style="margin:0 0 10px;font-size:13px;font-weight:800;color:#C4972A;text-transform:uppercase;letter-spacing:0.08em;">Chapter 2 drops tomorrow</p>
      <p style="margin:0;font-size:14px;color:#4B5563;line-height:1.65;">
        Tomorrow we release Chapter 2: the exact cold email sequence structure the AIMS team uses. Then Chapters
        3–5 over the next 10 days — discovery scripts, the pre-filled MSA, and the delivery playbook. You don't
        have to do anything. It all lands in your inbox automatically.
      </p>
    </div>

    ${p(
      "While you wait, the fastest thing you can do is apply to the alpha cohort. A real operator reviews every application within 24 hours. If there's fit, we'll book a 30-minute strategy call — no pitch — to walk through your background and whether the program is right for you."
    )}

    ${btn("Apply to the Alpha Cohort", applyUrl)}

    ${divider()}

    <p style="margin:0 0 6px;font-size:13px;color:#4B5563;line-height:1.65;">
      Questions? Just reply to this email — it goes straight to me, not a ticket queue.
    </p>
    <p style="margin:0;font-size:13px;color:#4B5563;line-height:1.65;">
      — The AI Operator Collective Team<br />
      <span style="color:#9CA3AF;font-size:12px;">Powered by AIMS · Operated by Modern Amenities LLC</span>
    </p>

    <p style="margin:24px 0 0;font-size:11px;color:#9CA3AF;line-height:1.55;font-style:italic;">
      Disclosure: The AI Operator Collective makes no income, earnings, or client outcome claims. The plays above
      are descriptive of how the AIMS portfolio operates and are not a promise of results. Your outcomes depend
      entirely on your own execution, market, and effort.
    </p>
  `

  return sendTrackedEmail({
    from: FROM_EMAIL,
    to: params.to,
    replyTo: REPLY_TO,
    subject: "The AI Operator Playbook Vault — Chapter 1 is inside",
    html: emailLayout(body, "Your first 5 operator moves, pulled straight from the AIMS portfolio playbook."),
    serviceArm: "ai-operator-collective",
  })
}
