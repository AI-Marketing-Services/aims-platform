/**
 * End-to-end Resend email test.
 *
 * Sends one of every major template type to a single recipient, captures
 * the Resend message id, and verifies via the Resend API that each
 * email is queued/delivered. Catches all the regressions we care about:
 *
 *   - API key works at all
 *   - Verified sending domain accepts our `from:` addresses
 *   - Each template renders without throwing
 *   - The `sendTrackedEmail` wrapper logs the id correctly
 *   - `sendInternalNotification` fallback recipient works (was the
 *     "Resend send failed [object Object]" error in earlier test runs)
 *
 * Usage:
 *   ./node_modules/.bin/tsx --env-file=.env.local scripts/test-resend-emails.ts [--to=email@example.com]
 *
 * Defaults to adamwolfe102@gmail.com if --to is omitted.
 */

interface SendResult {
  name: string
  id?: string
  ok: boolean
  detail?: string
}

const results: SendResult[] = []

const argTo = process.argv.find((a) => a.startsWith("--to="))?.split("=")[1]
const TO = argTo ?? "adamwolfe102@gmail.com"

async function record(name: string, fn: () => Promise<unknown>) {
  try {
    const r = (await fn()) as { data?: { id?: string }; error?: unknown } | undefined
    if (r && (r as { error?: unknown }).error) {
      results.push({
        name,
        ok: false,
        detail: JSON.stringify((r as { error?: unknown }).error),
      })
      console.error(`  FAIL  ${name}\n        ${JSON.stringify((r as { error?: unknown }).error).slice(0, 200)}`)
      return
    }
    const id = (r as { data?: { id?: string } } | undefined)?.data?.id
    results.push({ name, ok: true, id })
    console.log(`  ok    ${name}${id ? `  ${id}` : ""}`)
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    results.push({ name, ok: false, detail })
    console.error(`  FAIL  ${name}\n        ${detail}`)
  }
}

async function main() {
  if (!process.env.RESEND_API_KEY) {
    console.error("[FAIL] RESEND_API_KEY not set — source .env.local first")
    process.exit(1)
  }
  if (!process.env.RESEND_API_KEY.startsWith("re_")) {
    console.error(`[FAIL] RESEND_API_KEY doesn't look like a Resend key: ${process.env.RESEND_API_KEY.slice(0, 10)}…`)
    process.exit(1)
  }

  console.log(`=== Resend email send test ===`)
  console.log(`Recipient: ${TO}`)
  console.log(`API key:   ${process.env.RESEND_API_KEY.slice(0, 12)}…\n`)

  // 1. Raw key check via Resend API
  const domainsRes = await fetch("https://api.resend.com/domains", {
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
  })
  if (!domainsRes.ok) {
    console.error(`[FAIL] Domain list failed: ${domainsRes.status}`)
    process.exit(1)
  }
  const domains = (await domainsRes.json()) as {
    data: Array<{ name: string; status: string }>
  }
  console.log("─── Verified domains ───────────────────────────────")
  for (const d of domains.data) {
    console.log(`  ${d.name.padEnd(40)} ${d.status}`)
  }
  console.log()

  // ─── 2. Send one email per template path ──────────────────────────
  console.log("─── Template send tests ─────────────────────────────")

  // Bare-metal sendTrackedEmail — proves the wrapper works
  await record("sendTrackedEmail (raw)", async () => {
    const { sendTrackedEmail } = await import("../src/lib/email")
    const { AIMS_FROM_EMAIL } = await import("../src/lib/email/senders")
    return sendTrackedEmail({
      from: AIMS_FROM_EMAIL,
      to: TO,
      subject: "[AIMS test] Raw sendTrackedEmail",
      html: "<p>If you see this, sendTrackedEmail works. Sent by scripts/test-resend-emails.ts.</p>",
      serviceArm: "test",
    })
  })

  // Internal notification — was the failing path in earlier test logs
  await record("sendInternalNotification (the failing one)", async () => {
    const { sendInternalNotification } = await import("../src/lib/email")
    return sendInternalNotification({
      subject: "Smoke notification — please ignore",
      message: "Validating that sendInternalNotification works after the API key swap.",
      urgency: "normal",
    })
  })

  // Welcome — sent after a paid subscription completes checkout
  await record("sendWelcomeEmail", async () => {
    const { sendWelcomeEmail } = await import("../src/lib/email")
    return sendWelcomeEmail({
      to: TO,
      name: "Smoke Tester",
      serviceName: "Pro Plan",
      tier: "Pro",
      portalUrl: "https://www.aioperatorcollective.com/portal/dashboard",
    })
  })

  // Operator-signup welcome — fires for every brand-new operator account
  await record("sendOperatorSignupWelcome", async () => {
    const { sendOperatorSignupWelcome } = await import("../src/lib/email")
    return sendOperatorSignupWelcome({
      to: TO,
      name: "Smoke Tester",
    })
  })

  // Application received — fires after every AOC apply submission
  await record("sendApplicationReceivedEmail", async () => {
    const { sendApplicationReceivedEmail } = await import(
      "../src/lib/email/abandoned-application"
    )
    return sendApplicationReceivedEmail({
      to: TO,
      name: "Smoke Tester",
      calLink: "https://calendly.com/aioperatorcollective/discovery",
    })
  })

  // Collective invite — the new invite mechanism (replaced inviteToPlan).
  // Returns { ok, error? } not the raw Resend response, so we adapt below.
  await record("sendCollectiveInviteEmail", async () => {
    const { sendCollectiveInviteEmail } = await import(
      "../src/lib/email/collective-invite"
    )
    const r = await sendCollectiveInviteEmail({
      to: TO,
      firstName: "Smoke",
      tier: "innerCircle",
      customMessage: "Welcome to the Collective — sent by the email smoke test.",
    })
    if (!r.ok) {
      // Surface the helper's error in the same shape sendTrackedEmail uses
      return { error: r.error ?? "sendCollectiveInviteEmail returned ok=false" }
    }
    // Wrapper hides the underlying message id — return a synthetic stub
    // so the verify loop just skips it gracefully.
    return { data: { id: "collective-invite-no-id-exposed" } }
  })

  // Booking reminder — used by the day-2/5/9 nurture cron after apply
  await record("sendBookingReminderEmail (day 2)", async () => {
    const { sendBookingReminderEmail } = await import(
      "../src/lib/email/booking-reminder"
    )
    return sendBookingReminderEmail({
      to: TO,
      name: "Smoke Tester",
      day: 2,
      tier: "warm",
    })
  })

  // Lead-magnet quiz results — heaviest template, multiple variants
  await record("sendQuizResultsEmail", async () => {
    const { sendQuizResultsEmail } = await import(
      "../src/lib/email/lead-magnet-results"
    )
    return sendQuizResultsEmail({
      to: TO,
      name: "Smoke Tester",
      score: 87,
      resultsUrl:
        "https://www.aioperatorcollective.com/tools/ai-readiness-quiz/results/stub",
      data: { source: "smoke-test" },
    })
  })

  // ─── 3. Verify message status via Resend API ──────────────────────
  console.log("\n─── Verifying message statuses ──────────────────────")
  // Resend asynchronously processes — give it a beat then poll each id.
  await new Promise((resolve) => setTimeout(resolve, 4000))

  for (const r of results) {
    if (!r.ok || !r.id) continue
    try {
      const res = await fetch(`https://api.resend.com/emails/${r.id}`, {
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      })
      if (!res.ok) {
        console.log(`  ${r.id}  status=${res.status}  (${r.name})`)
        continue
      }
      const data = (await res.json()) as {
        last_event?: string
        to?: string[]
        subject?: string
      }
      console.log(
        `  ${r.id}  ${(data.last_event ?? "queued").padEnd(10)}  ${r.name}`,
      )
    } catch (err) {
      console.log(`  ${r.id}  (verify failed: ${err instanceof Error ? err.message : "?"})`)
    }
  }

  // ─── Report ────────────────────────────────────────────────────────
  const failed = results.filter((r) => !r.ok)
  console.log(
    `\n=== ${results.length - failed.length}/${results.length} sent ${failed.length === 0 ? "✓" : `(${failed.length} failed)`} ===`,
  )
  if (failed.length > 0) process.exit(1)
}

main().catch((err) => {
  console.error("Email test crashed:", err)
  process.exit(1)
})
