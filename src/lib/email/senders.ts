/**
 * Canonical sender addresses for every outbound email.
 *
 * Change these in ONE place — everything else imports from here.
 * The domain (aioperatorcollective.com) must be verified on Resend
 * for emails to deliver: https://resend.com/domains
 */

// Sending address used as `from:` in sendTrackedEmail
export const AOC_FROM_EMAIL =
  "AI Operator Collective <noreply@aioperatorcollective.com>"

export const AIMS_FROM_EMAIL =
  "AI Operator Collective <noreply@aioperatorcollective.com>"

// Reply-to address. Intentionally the same as from by default — override
// per-email (e.g. to a monitored inbox) where replies matter.
export const AOC_REPLY_TO = "noreply@aioperatorcollective.com"
export const AIMS_REPLY_TO = "noreply@aioperatorcollective.com"
