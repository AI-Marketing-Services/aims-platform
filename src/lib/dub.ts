import { Dub } from "dub"

/**
 * Lazy-singleton Dub.co client.
 *
 * All partner/referral link operations go through this. Gracefully degrades
 * when DUB_API_KEY is not set — callers should null-check getDubClient().
 */

let _dub: Dub | null = null

export function getDubClient(): Dub | null {
  if (!process.env.DUB_API_KEY) return null
  if (!_dub) {
    _dub = new Dub({ token: process.env.DUB_API_KEY })
  }
  return _dub
}

/** Workspace ID for the AIMS Dub.co workspace */
export function getDubWorkspaceId(): string | null {
  return process.env.DUB_WORKSPACE_ID ?? null
}

/** Program ID for the AIMS partner program within Dub.co */
export function getDubProgramId(): string | null {
  return process.env.DUB_PROGRAM_ID ?? null
}

/** Webhook secret for verifying incoming Dub.co webhook payloads */
export function getDubWebhookSecret(): string | null {
  return process.env.DUB_WEBHOOK_SECRET ?? null
}
