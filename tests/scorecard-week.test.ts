import { describe, expect, it } from "vitest"
import {
  endOfLocalWeek,
  parseWeekStart,
  startOfLocalWeek,
  subtractWeeks,
  toIsoDate,
} from "@/lib/scorecard/week"

describe("startOfLocalWeek", () => {
  it("returns Monday for a Tuesday in UTC", () => {
    // Tuesday 2026-05-12 12:00 UTC → Monday 2026-05-11
    const tue = new Date("2026-05-12T12:00:00.000Z")
    const monday = startOfLocalWeek(tue, 0)
    expect(toIsoDate(monday)).toBe("2026-05-11")
    expect(monday.getUTCDay()).toBe(1) // Monday
  })

  it("returns the same day for a Monday", () => {
    const mon = new Date("2026-05-11T15:00:00.000Z")
    expect(toIsoDate(startOfLocalWeek(mon, 0))).toBe("2026-05-11")
  })

  it("rolls back to the previous Monday for a Sunday", () => {
    // Sunday 2026-05-17 → previous Monday 2026-05-11
    const sun = new Date("2026-05-17T22:00:00.000Z")
    expect(toIsoDate(startOfLocalWeek(sun, 0))).toBe("2026-05-11")
  })

  it("respects a positive timezone offset (US Eastern, UTC-5)", () => {
    // 2026-05-11 03:30 UTC = 2026-05-10 22:30 EST (Sunday locally)
    // Local Monday should be the previous Monday: 2026-05-04.
    const ref = new Date("2026-05-11T03:30:00.000Z")
    const result = startOfLocalWeek(ref, 300) // EST = UTC-5 = 300 min ahead in the JS sense
    expect(toIsoDate(result)).toBe("2026-05-04")
  })

  it("respects a negative timezone offset (Sydney, UTC+10)", () => {
    // 2026-05-10 23:00 UTC = 2026-05-11 09:00 AEST (Monday locally)
    // So the local week starts 2026-05-11.
    const ref = new Date("2026-05-10T23:00:00.000Z")
    const result = startOfLocalWeek(ref, -600)
    expect(toIsoDate(result)).toBe("2026-05-11")
  })
})

describe("endOfLocalWeek", () => {
  it("returns next Monday — exclusive end", () => {
    const ref = new Date("2026-05-12T00:00:00.000Z") // Tue
    const end = endOfLocalWeek(ref, 0)
    expect(toIsoDate(end)).toBe("2026-05-18")
  })
})

describe("parseWeekStart", () => {
  it("accepts a Monday in YYYY-MM-DD format", () => {
    const result = parseWeekStart("2026-05-11")
    expect(result).not.toBeNull()
    expect(result?.getUTCDay()).toBe(1)
  })

  it("rejects non-Monday dates", () => {
    expect(parseWeekStart("2026-05-12")).toBeNull() // Tue
    expect(parseWeekStart("2026-05-17")).toBeNull() // Sun
  })

  it("rejects malformed strings", () => {
    expect(parseWeekStart("not-a-date")).toBeNull()
    expect(parseWeekStart("2026-13-01")).toBeNull()
    expect(parseWeekStart(null)).toBeNull()
    expect(parseWeekStart(undefined)).toBeNull()
    expect(parseWeekStart(42)).toBeNull()
  })

  it("rejects calendar-impossible dates that JS would silently normalise", () => {
    // JS would normalise these to the following month, which used to
    // sneak through the parser before we added the round-trip check.
    expect(parseWeekStart("2026-02-30")).toBeNull()
    expect(parseWeekStart("2026-04-31")).toBeNull()
  })
})

describe("subtractWeeks", () => {
  it("subtracts whole weeks", () => {
    const start = new Date("2026-05-11T00:00:00.000Z")
    expect(toIsoDate(subtractWeeks(start, 1))).toBe("2026-05-04")
    expect(toIsoDate(subtractWeeks(start, 4))).toBe("2026-04-13")
  })
})
