/**
 * Week-boundary helpers for the operator scorecard.
 *
 * Convention: each "week" is anchored to Monday 00:00 in the operator's
 * local timezone. We pass the timezone offset (in minutes from UTC, as
 * returned by `Date.prototype.getTimezoneOffset()`) from the client so
 * server logic stays deterministic without depending on the server's
 * own timezone.
 *
 * Storage: `OperatorWeeklyScorecard.weekStart` is a `@db.Date` column,
 * so we always normalise to UTC midnight on the calendar date the
 * Monday falls on. Keeps queries free of TZ ambiguity.
 */

const DAY_MS = 24 * 60 * 60 * 1000

/** Round a Date to UTC midnight on its calendar date. */
function toUtcMidnight(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  )
}

/**
 * Compute the Monday-anchored week-start `Date` for `now` in the
 * operator's local timezone, normalised to UTC midnight.
 *
 * @param now      Reference instant (defaults to current time).
 * @param tzOffsetMinutes  Operator's `getTimezoneOffset()` value
 *                          (positive = behind UTC). Defaults to UTC.
 */
export function startOfLocalWeek(
  now: Date = new Date(),
  tzOffsetMinutes = 0,
): Date {
  // Shift the instant into the operator's local clock so day-of-week
  // and the calendar-day boundary line up with how the operator
  // perceives "Monday morning". `tzOffsetMinutes` is positive when the
  // local TZ is BEHIND UTC (e.g. PST = +480), so we subtract it.
  const localMs = now.getTime() - tzOffsetMinutes * 60_000
  const local = new Date(localMs)
  // Sunday = 0, Monday = 1, … in JS. Roll back to the most recent Monday.
  const dayOfWeek = local.getUTCDay()
  const daysSinceMonday = (dayOfWeek + 6) % 7 // Mon -> 0, Sun -> 6
  const mondayLocalMs = localMs - daysSinceMonday * DAY_MS
  return toUtcMidnight(new Date(mondayLocalMs))
}

/** End of week (exclusive) — Monday 00:00 UTC of the following week. */
export function endOfLocalWeek(
  now: Date = new Date(),
  tzOffsetMinutes = 0,
): Date {
  return new Date(startOfLocalWeek(now, tzOffsetMinutes).getTime() + 7 * DAY_MS)
}

/**
 * Validate + normalise a `weekStart` value submitted by the client.
 * Accepts a YYYY-MM-DD string OR a Date — returns the Monday-anchored
 * Date or `null` if input is invalid / not a Monday.
 */
export function parseWeekStart(input: unknown): Date | null {
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) return null
    const normalised = toUtcMidnight(input)
    return isMonday(normalised) ? normalised : null
  }
  if (typeof input !== "string") return null
  // Accept YYYY-MM-DD only — anything else is a typing mistake.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return null
  const parsed = new Date(`${input}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime())) return null
  // Round-trip check rejects calendar-impossible inputs that JS silently
  // normalises (e.g. "2026-02-30" → 2026-03-02). Without this the parser
  // would happily accept a fictitious date and stamp it onto the row.
  if (toIsoDate(parsed) !== input) return null
  return isMonday(parsed) ? parsed : null
}

function isMonday(date: Date): boolean {
  return date.getUTCDay() === 1
}

/** Return YYYY-MM-DD format suitable for a Postgres `DATE` column. */
export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Subtract `weeks` weeks from a week-start Date. */
export function subtractWeeks(weekStart: Date, weeks: number): Date {
  return new Date(weekStart.getTime() - weeks * 7 * DAY_MS)
}
