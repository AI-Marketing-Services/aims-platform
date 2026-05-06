/**
 * Slot generator for the branded booking page.
 *
 * Given a user's BookingAvailability config + an existing list of confirmed
 * bookings, compute the next N days of bookable slots. Pure function — no
 * DB calls — so it's trivially testable + deterministic for the same input.
 *
 * NOTE: timezone handling is intentionally simple — we treat weeklyHours as
 * the operator's local time and return slots as ISO strings in UTC. The
 * public booking page renders them in the visitor's browser timezone, which
 * is the right UX for a "pick a time that works for you" surface.
 */

/** Day-keyed availability windows. Indexable by an arbitrary day key
 *  string (mon/tue/...) so it satisfies Record<string, ...> consumers. */
export type WeeklyHours = Record<string, Array<{ start: string; end: string }>>

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const

export interface ExistingBooking {
  startAt: Date
  endAt: Date
}

export interface SlotComputeArgs {
  weeklyHours: WeeklyHours
  durationMinutes: number
  bufferMinutes: number
  existingBookings: ExistingBooking[]
  /** How many days ahead to look. Default 14. */
  daysAhead?: number
  /** Earliest a slot can be — defaults to NOW() + 1 hour. */
  minLeadMinutes?: number
  /** Anchor "today" for tests. */
  now?: Date
}

export interface Slot {
  /** UTC ISO start. */
  startAt: string
  endAt: string
}

const DEFAULT_WEEKLY: WeeklyHours = {
  mon: [{ start: "09:00", end: "17:00" }],
  tue: [{ start: "09:00", end: "17:00" }],
  wed: [{ start: "09:00", end: "17:00" }],
  thu: [{ start: "09:00", end: "17:00" }],
  fri: [{ start: "09:00", end: "17:00" }],
}

export function defaultWeeklyHours(): WeeklyHours {
  return DEFAULT_WEEKLY
}

function parseHHMM(s: string): { h: number; m: number } | null {
  const m = s.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  const h = parseInt(m[1])
  const min = parseInt(m[2])
  if (h < 0 || h > 23 || min < 0 || min > 59) return null
  return { h, m: min }
}

function overlapsAnyExisting(
  start: Date,
  end: Date,
  existing: ExistingBooking[],
  bufferMs: number,
): boolean {
  for (const b of existing) {
    const startWithBuffer = new Date(b.startAt.getTime() - bufferMs)
    const endWithBuffer = new Date(b.endAt.getTime() + bufferMs)
    if (start < endWithBuffer && end > startWithBuffer) return true
  }
  return false
}

export function computeSlots(args: SlotComputeArgs): Slot[] {
  const {
    weeklyHours,
    durationMinutes,
    bufferMinutes,
    existingBookings,
    daysAhead = 14,
    minLeadMinutes = 60,
  } = args

  const now = args.now ?? new Date()
  const minStart = new Date(now.getTime() + minLeadMinutes * 60_000)
  const slots: Slot[] = []
  const slotMs = durationMinutes * 60_000
  const bufferMs = bufferMinutes * 60_000

  for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
    const day = new Date(now)
    day.setDate(day.getDate() + dayOffset)
    day.setHours(0, 0, 0, 0)

    const dayKey = DAY_KEYS[day.getDay()]
    const windows = weeklyHours[dayKey] ?? []
    if (windows.length === 0) continue

    for (const w of windows) {
      const startTime = parseHHMM(w.start)
      const endTime = parseHHMM(w.end)
      if (!startTime || !endTime) continue

      const windowStart = new Date(day)
      windowStart.setHours(startTime.h, startTime.m, 0, 0)
      const windowEnd = new Date(day)
      windowEnd.setHours(endTime.h, endTime.m, 0, 0)
      if (windowEnd <= windowStart) continue

      let cursor = new Date(windowStart)
      while (cursor.getTime() + slotMs <= windowEnd.getTime()) {
        const slotEnd = new Date(cursor.getTime() + slotMs)
        if (
          cursor >= minStart &&
          !overlapsAnyExisting(cursor, slotEnd, existingBookings, bufferMs)
        ) {
          slots.push({
            startAt: cursor.toISOString(),
            endAt: slotEnd.toISOString(),
          })
        }
        // Advance by slot duration + buffer so we don't double-book back-to-back.
        cursor = new Date(cursor.getTime() + slotMs + bufferMs)
      }
    }
  }

  return slots
}
