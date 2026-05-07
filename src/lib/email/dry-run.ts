/**
 * Dry-run capture for email templates.
 *
 * Lets the admin editor render the EXACT subject + html a production
 * send would produce — without actually sending. We wrap a call to
 * one of the catalog send wrappers in `withDryRun(...)`, then
 * `sendTrackedEmail` notices we're inside a dry-run scope and pushes
 * the payload into a captured array instead of calling Resend.
 *
 * This is server-only (uses AsyncLocalStorage). Never call from the
 * client.
 */
import { AsyncLocalStorage } from "node:async_hooks"

export interface CapturedSend {
  subject?: string
  html?: string
  to?: string | string[]
  from?: string
  templateKey?: string
}

interface DryRunStore {
  captured: CapturedSend[]
  /** When true, applyTemplateOverride is skipped so we get the
   *  pristine code default — useful for the editor's "show what the
   *  codebase ships" baseline even when an override exists. */
  skipOverride?: boolean
}

const store = new AsyncLocalStorage<DryRunStore>()

export function isDryRun(): boolean {
  return store.getStore() !== undefined
}

export function shouldSkipOverride(): boolean {
  return store.getStore()?.skipOverride === true
}

export function captureDryRun(payload: CapturedSend): void {
  const s = store.getStore()
  if (s) s.captured.push(payload)
}

/**
 * Run `fn` in a dry-run scope. Any sendTrackedEmail call inside
 * resolves immediately (no Resend, no DB log) and gets captured.
 *
 * @param opts.skipOverride - when true, sendTrackedEmail skips the
 *   override merge so we render the pure code default. Default false
 *   (matches what production would actually send).
 */
export async function withDryRun<T>(
  fn: () => Promise<T>,
  opts: { skipOverride?: boolean } = {},
): Promise<{ result: T; captured: CapturedSend[] }> {
  const captured: CapturedSend[] = []
  const result = await store.run(
    { captured, skipOverride: opts.skipOverride },
    fn,
  )
  return { result, captured }
}
