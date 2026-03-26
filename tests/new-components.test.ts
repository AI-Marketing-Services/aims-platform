/**
 * New Components Tests
 * Verifies that all new shared and marketing components exist,
 * export correctly, and follow proper patterns.
 */
import { describe, it, expect } from "vitest"
import { existsSync, readFileSync } from "fs"
import { join } from "path"

const SRC = join(__dirname, "..", "src")

// ─── Shared components existence and export ─────────────────────────────────

describe("Shared component: PageTransition", () => {
  const path = join(SRC, "components/shared/PageTransition.tsx")

  it("file exists", () => {
    expect(existsSync(path)).toBe(true)
  })

  it("is a client component", () => {
    const content = readFileSync(path, "utf-8")
    expect(content).toContain('"use client"')
  })

  it("exports PageTransition", () => {
    const content = readFileSync(path, "utf-8")
    expect(content).toContain("export")
    expect(content).toContain("PageTransition")
  })

  it("uses framer-motion", () => {
    const content = readFileSync(path, "utf-8")
    expect(content).toContain("framer-motion")
  })
})

describe("Shared component: Breadcrumbs", () => {
  const path = join(SRC, "components/shared/Breadcrumbs.tsx")

  it("file exists", () => {
    expect(existsSync(path)).toBe(true)
  })

  it("is a client component", () => {
    const content = readFileSync(path, "utf-8")
    expect(content).toContain('"use client"')
  })

  it("exports Breadcrumbs", () => {
    const content = readFileSync(path, "utf-8")
    expect(content).toContain("export")
    expect(content).toContain("Breadcrumbs")
  })

  it("uses Next.js Link for navigation", () => {
    const content = readFileSync(path, "utf-8")
    expect(content).toContain("next/link")
  })
})

describe("Shared component: KeyboardShortcuts", () => {
  const path = join(SRC, "components/shared/KeyboardShortcuts.tsx")

  it("file exists", () => {
    expect(existsSync(path)).toBe(true)
  })

  it("is a client component", () => {
    const content = readFileSync(path, "utf-8")
    expect(content).toContain('"use client"')
  })

  it("exports KeyboardShortcuts", () => {
    const content = readFileSync(path, "utf-8")
    expect(content).toContain("export")
    expect(content).toContain("KeyboardShortcuts")
  })

  it("uses keyboard event listeners", () => {
    const content = readFileSync(path, "utf-8")
    expect(content).toContain("useEffect")
    expect(content).toContain("useCallback")
  })
})

describe("Shared component: Sparkline", () => {
  const path = join(SRC, "components/shared/Sparkline.tsx")

  it("file exists", () => {
    expect(existsSync(path)).toBe(true)
  })

  it("is a client component", () => {
    const content = readFileSync(path, "utf-8")
    expect(content).toContain('"use client"')
  })

  it("exports Sparkline", () => {
    const content = readFileSync(path, "utf-8")
    expect(content).toContain("export")
    expect(content).toContain("Sparkline")
  })

  it("uses recharts", () => {
    const content = readFileSync(path, "utf-8")
    expect(content).toContain("recharts")
  })
})

describe("Shared component: RelativeTime", () => {
  const path = join(SRC, "components/shared/RelativeTime.tsx")

  it("file exists", () => {
    expect(existsSync(path)).toBe(true)
  })

  it("is a client component", () => {
    const content = readFileSync(path, "utf-8")
    expect(content).toContain('"use client"')
  })

  it("exports RelativeTime", () => {
    const content = readFileSync(path, "utf-8")
    expect(content).toContain("export")
    expect(content).toContain("RelativeTime")
  })

  it("uses date-fns formatDistanceToNow", () => {
    const content = readFileSync(path, "utf-8")
    expect(content).toContain("formatDistanceToNow")
    expect(content).toContain("date-fns")
  })
})

describe("Shared component: SortableTableHeader", () => {
  const path = join(SRC, "components/shared/SortableTableHeader.tsx")

  it("file exists", () => {
    expect(existsSync(path)).toBe(true)
  })

  it("is a client component", () => {
    const content = readFileSync(path, "utf-8")
    expect(content).toContain('"use client"')
  })

  it("exports SortableTableHeader", () => {
    const content = readFileSync(path, "utf-8")
    expect(content).toContain("export")
    expect(content).toContain("SortableTableHeader")
  })

  it("uses sort direction icons", () => {
    const content = readFileSync(path, "utf-8")
    expect(content).toContain("lucide-react")
  })
})

// ─── Marketing component: OnboardingChatWidget ─────────────────────────────

describe("Marketing component: OnboardingChatWidget", () => {
  const path = join(SRC, "components/marketing/OnboardingChatWidget.tsx")

  it("file exists", () => {
    expect(existsSync(path)).toBe(true)
  })

  it("is a client component", () => {
    const content = readFileSync(path, "utf-8")
    expect(content).toContain('"use client"')
  })

  it("exports OnboardingChatWidget", () => {
    const content = readFileSync(path, "utf-8")
    const hasDefault = content.includes("export default")
    const hasNamed = content.includes("export function OnboardingChatWidget") ||
      content.includes("export const OnboardingChatWidget")
    expect(hasDefault || hasNamed).toBe(true)
  })

  it("uses useState and useRef", () => {
    const content = readFileSync(path, "utf-8")
    expect(content).toContain("useState")
    expect(content).toContain("useRef")
  })
})

// ─── Additional shared components existence check ───────────────────────────

describe("Additional shared components exist", () => {
  const components = [
    "EmptyState.tsx",
    "ErrorBoundary.tsx",
    "NotificationBell.tsx",
    "NotificationCenter.tsx",
    "PageSkeleton.tsx",
    "Skeleton.tsx",
    "ToolLogo.tsx",
  ]

  for (const comp of components) {
    it(`components/shared/${comp} exists`, () => {
      expect(existsSync(join(SRC, "components/shared", comp))).toBe(true)
    })
  }
})
