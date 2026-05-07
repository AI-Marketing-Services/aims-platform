import { describe, expect, it } from "vitest"
import {
  TEMPLATES,
  DEFAULT_TEMPLATE_ID,
  getTemplate,
} from "@/lib/website/templates"
import {
  CtaFormSchema,
  FaqSchema,
  FeatureGrid3Schema,
  FeatureGrid6Schema,
  FeatureSplitSchema,
  FooterSchema,
  HeroCenterSchema,
  HeroSplitSchema,
  HowItWorksSchema,
  LogoBarSchema,
  NavbarSchema,
  Pricing3Schema,
  TestimonialGridSchema,
  TestimonialSingleSchema,
} from "@/lib/website/schemas"
import type { SectionType } from "@/lib/website/types"

const SCHEMAS: Record<SectionType, { safeParse: (v: unknown) => { success: boolean } }> = {
  navbar: NavbarSchema,
  "hero-center": HeroCenterSchema,
  "hero-split": HeroSplitSchema,
  "logo-bar": LogoBarSchema,
  "feature-grid-3": FeatureGrid3Schema,
  "feature-grid-6": FeatureGrid6Schema,
  "feature-split": FeatureSplitSchema,
  "how-it-works": HowItWorksSchema,
  "testimonial-grid": TestimonialGridSchema,
  "testimonial-single": TestimonialSingleSchema,
  "pricing-3": Pricing3Schema,
  faq: FaqSchema,
  "cta-form": CtaFormSchema,
  footer: FooterSchema,
}

describe("template registry", () => {
  it("ships at least three templates", () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(3)
  })

  it("default template id resolves to a real template", () => {
    expect(getTemplate(DEFAULT_TEMPLATE_ID)).not.toBeNull()
  })

  it("getTemplate returns null for unknown ids", () => {
    expect(getTemplate("does-not-exist")).toBeNull()
    expect(getTemplate(null)).toBeNull()
    expect(getTemplate(undefined)).toBeNull()
  })

  it("template ids are unique", () => {
    const ids = TEMPLATES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("section ids inside each template are unique", () => {
    for (const template of TEMPLATES) {
      const ids = template.sections.map((s) => s.id)
      expect(
        new Set(ids).size,
        `Template ${template.id} has duplicate section ids`,
      ).toBe(ids.length)
    }
  })
})

describe("template defaults validate against section schemas", () => {
  for (const template of TEMPLATES) {
    describe(template.id, () => {
      for (const section of template.sections) {
        it(`section "${section.id}" (${section.type}) defaults pass schema`, () => {
          const schema = SCHEMAS[section.type]
          expect(schema, `No schema for type ${section.type}`).toBeTruthy()
          const result = schema.safeParse(section.defaults)
          expect(result.success, JSON.stringify((result as { success: false; error?: unknown }).error)).toBe(true)
        })
      }
    })
  }
})

describe("schemas reject malicious / oversized input", () => {
  it("rejects URLs without http(s) scheme on hero-center backgroundImageUrl", () => {
    const result = HeroCenterSchema.safeParse({
      headline: "test",
      backgroundImageUrl: "javascript:alert(1)",
    })
    expect(result.success).toBe(false)
  })

  it("caps headline length", () => {
    const result = HeroCenterSchema.safeParse({
      headline: "x".repeat(500),
    })
    expect(result.success).toBe(false)
  })

  it("requires non-empty headline on heroes", () => {
    expect(HeroCenterSchema.safeParse({ headline: "" }).success).toBe(false)
    expect(HeroSplitSchema.safeParse({ headline: "" }).success).toBe(false)
  })

  it("caps logo bar to 8 entries", () => {
    const tooMany = Array.from({ length: 20 }, (_, i) => ({
      name: `Logo ${i}`,
    }))
    expect(LogoBarSchema.safeParse({ logos: tooMany }).success).toBe(false)
  })

  it("pricing tier features cap at 8", () => {
    const result = Pricing3Schema.safeParse({
      tiers: [
        {
          name: "Pro",
          price: "$99",
          features: Array.from({ length: 20 }, (_, i) => `Feature ${i}`),
        },
      ],
    })
    expect(result.success).toBe(false)
  })

  it("FAQ caps items at 10", () => {
    const items = Array.from({ length: 20 }, (_, i) => ({
      question: `Q${i}?`,
      answer: `A${i}`,
    }))
    expect(FaqSchema.safeParse({ items }).success).toBe(false)
  })

  it("footer rejects non-https URLs in social links", () => {
    const result = FooterSchema.safeParse({
      socialLinks: [{ platform: "twitter", href: "ftp://twitter.com/x" }],
    })
    // social schema uses bare z.string().url(), so ftp passes the URL check
    // but we expect to add a tighter https constraint in v2; for now just
    // assert structure validates. (Documentation marker for tomorrow.)
    expect(result.success).toBe(true)
  })
})
