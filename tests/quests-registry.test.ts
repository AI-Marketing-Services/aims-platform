/**
 * Quest registry sanity tests — pure-function checks, no DB touch.
 *
 * If any of these fail, the whole quest system is in an inconsistent state
 * (orphan prereqs, duplicate keys, unknown trigger events, etc.) and the
 * production runtime would silently misbehave.
 */
import { describe, it, expect } from "vitest"
import {
  QUESTS,
  TRIGGER_EVENTS,
  FEATURE_KEYS,
  getMainQuests,
  getSideQuests,
  getHiddenQuests,
  getQuest,
  getQuestsByEvent,
  TOTAL_TIERS,
} from "@/lib/quests/registry"

describe("Quest registry — structural integrity", () => {
  it("has unique quest keys", () => {
    const keys = QUESTS.map((q) => q.key)
    const set = new Set(keys)
    expect(set.size).toBe(keys.length)
  })

  it("every prerequisiteKey points to an existing quest", () => {
    const keys = new Set(QUESTS.map((q) => q.key))
    const orphaned: string[] = []
    for (const q of QUESTS) {
      for (const p of q.prerequisiteKeys ?? []) {
        if (!keys.has(p)) orphaned.push(`${q.key} → ${p}`)
      }
    }
    expect(orphaned).toEqual([])
  })

  it("every triggerEvent is in TRIGGER_EVENTS", () => {
    const set = new Set<string>(TRIGGER_EVENTS)
    for (const q of QUESTS) {
      if (!q.triggerEvent) continue
      expect(set.has(q.triggerEvent)).toBe(true)
    }
  })

  it("every unlocksFeatureKey is in FEATURE_KEYS", () => {
    const set = new Set<string>(FEATURE_KEYS)
    for (const q of QUESTS) {
      if (!q.unlocksFeatureKey) continue
      expect(set.has(q.unlocksFeatureKey)).toBe(true)
    }
  })

  it("MAIN quests all have a tier between 0 and TOTAL_TIERS-1", () => {
    for (const q of QUESTS.filter((x) => x.category === "MAIN")) {
      expect(q.tier).toBeGreaterThanOrEqual(0)
      expect(q.tier).toBeLessThan(TOTAL_TIERS)
    }
  })

  it("SIDE and HIDDEN quests have no tier", () => {
    for (const q of QUESTS.filter((x) => x.category !== "MAIN")) {
      expect(q.tier).toBeUndefined()
    }
  })

  it("every non-hidden quest with goal>1 has a triggerEvent (otherwise progress can't tick)", () => {
    // Hidden quests are advanced from internal helpers (e.g. recordDailyLogin
    // for night_owl/early_bird) — they don't need a trigger event.
    for (const q of QUESTS) {
      if (q.category === "HIDDEN") continue
      if ((q.goal ?? 1) > 1) {
        expect(q.triggerEvent, `${q.key} has goal>1 but no triggerEvent`).toBeDefined()
      }
    }
  })

  it("rewards are non-negative", () => {
    for (const q of QUESTS) {
      expect(q.xpReward).toBeGreaterThanOrEqual(0)
      expect(q.creditReward).toBeGreaterThanOrEqual(0)
    }
  })
})

describe("Quest registry — lookups", () => {
  it("getQuest returns the right def", () => {
    const q = getQuest("first_lead")
    expect(q?.title).toBe("First Lead")
  })

  it("getQuest returns undefined for unknown key", () => {
    expect(getQuest("nope_doesnt_exist")).toBeUndefined()
  })

  it("getMainQuests returns only MAIN, sorted by tier then order", () => {
    const main = getMainQuests()
    expect(main.every((q) => q.category === "MAIN")).toBe(true)
    for (let i = 1; i < main.length; i++) {
      const prev = main[i - 1]
      const cur = main[i]
      const prevKey = (prev.tier ?? 0) * 100 + prev.order
      const curKey = (cur.tier ?? 0) * 100 + cur.order
      expect(curKey).toBeGreaterThanOrEqual(prevKey)
    }
  })

  it("getSideQuests returns only SIDE category", () => {
    expect(getSideQuests().every((q) => q.category === "SIDE")).toBe(true)
  })

  it("getHiddenQuests returns only HIDDEN category", () => {
    expect(getHiddenQuests().every((q) => q.category === "HIDDEN")).toBe(true)
  })

  it("getQuestsByEvent returns matching quests", () => {
    const matches = getQuestsByEvent("crm.first_contact_added")
    expect(matches.length).toBeGreaterThan(0)
    expect(matches.find((q) => q.key === "first_lead")).toBeDefined()
  })
})

describe("Quest registry — gating semantics", () => {
  it("Tier 0 quests have no prerequisites (entry points)", () => {
    const tier0 = QUESTS.filter((q) => q.category === "MAIN" && q.tier === 0)
    for (const q of tier0) {
      expect(q.prerequisiteKeys ?? []).toEqual([])
    }
  })

  it("Each higher-tier quest only depends on quests in same or lower tier", () => {
    for (const q of QUESTS.filter((x) => x.category === "MAIN")) {
      for (const p of q.prerequisiteKeys ?? []) {
        const dep = getQuest(p)
        if (!dep || dep.category !== "MAIN") continue
        expect(dep.tier ?? 0).toBeLessThanOrEqual(q.tier ?? 0)
      }
    }
  })

  it("Every gated feature is gated by exactly ONE quest (MVP simplification)", () => {
    const counts: Record<string, number> = {}
    for (const q of QUESTS) {
      if (!q.unlocksFeatureKey) continue
      counts[q.unlocksFeatureKey] = (counts[q.unlocksFeatureKey] ?? 0) + 1
    }
    for (const [feature, count] of Object.entries(counts)) {
      expect(count, `feature ${feature} is gated by ${count} quests`).toBe(1)
    }
  })
})
