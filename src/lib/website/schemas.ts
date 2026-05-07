/**
 * Zod schemas for every section type. Each schema is the source of truth
 * for both the editor's form generator and the renderer's safety net.
 *
 * Conventions:
 * - All user-visible strings go through `z.string().max(...)` with an
 *   intentional cap so a runaway paste can't blow out the layout.
 * - Image URLs are `z.string().url()` AND restricted to https in the
 *   resolver before render (defends against javascript:// in the JSON).
 * - Arrays have explicit `.max()` so a template can't render 200 nav
 *   items by accident.
 * - Every field is optional or has a default so legacy / partial JSON
 *   never throws on parse.
 */
import { z } from "zod"

const HttpsUrl = z
  .string()
  .url()
  .refine((u) => /^https?:\/\//i.test(u), "Must be an http(s) URL")

const SafeText = (max: number) => z.string().trim().max(max).optional()
const RequiredText = (max: number) => z.string().trim().min(1).max(max)

// ────────────────────────────────────────────────────────────────────────
// NAVBAR
// ────────────────────────────────────────────────────────────────────────
export const NavbarSchema = z.object({
  links: z
    .array(
      z.object({
        label: RequiredText(30),
        href: z.string().min(1).max(500),
      }),
    )
    .max(6)
    .default([]),
  ctaLabel: SafeText(24),
  ctaHref: z.string().max(500).optional(),
})
export type NavbarContent = z.infer<typeof NavbarSchema>

// ────────────────────────────────────────────────────────────────────────
// HERO — CENTERED
// ────────────────────────────────────────────────────────────────────────
export const HeroCenterSchema = z.object({
  eyebrow: SafeText(60),
  headline: RequiredText(140),
  subheadline: SafeText(280),
  primaryCtaLabel: SafeText(24),
  primaryCtaHref: z.string().max(500).optional(),
  secondaryCtaLabel: SafeText(24),
  secondaryCtaHref: z.string().max(500).optional(),
  backgroundImageUrl: HttpsUrl.optional(),
})
export type HeroCenterContent = z.infer<typeof HeroCenterSchema>

// ────────────────────────────────────────────────────────────────────────
// HERO — SPLIT (text left, visual right)
// ────────────────────────────────────────────────────────────────────────
export const HeroSplitSchema = z.object({
  eyebrow: SafeText(60),
  headline: RequiredText(140),
  subheadline: SafeText(280),
  primaryCtaLabel: SafeText(24),
  primaryCtaHref: z.string().max(500).optional(),
  secondaryCtaLabel: SafeText(24),
  secondaryCtaHref: z.string().max(500).optional(),
  imageUrl: HttpsUrl.optional(),
  imageAlt: SafeText(140),
})
export type HeroSplitContent = z.infer<typeof HeroSplitSchema>

// ────────────────────────────────────────────────────────────────────────
// LOGO BAR — "Trusted by"
// ────────────────────────────────────────────────────────────────────────
export const LogoBarSchema = z.object({
  caption: SafeText(80),
  logos: z
    .array(
      z.object({
        name: RequiredText(60),
        imageUrl: HttpsUrl.optional(),
      }),
    )
    .max(8)
    .default([]),
})
export type LogoBarContent = z.infer<typeof LogoBarSchema>

// ────────────────────────────────────────────────────────────────────────
// FEATURE GRID 3
// ────────────────────────────────────────────────────────────────────────
export const FeatureItemSchema = z.object({
  iconName: SafeText(40), // Lucide icon name; resolver maps to component
  title: RequiredText(60),
  description: RequiredText(280),
})
export type FeatureItemContent = z.infer<typeof FeatureItemSchema>

export const FeatureGrid3Schema = z.object({
  eyebrow: SafeText(60),
  heading: SafeText(120),
  subheading: SafeText(280),
  items: z.array(FeatureItemSchema).max(6).default([]),
})
export type FeatureGrid3Content = z.infer<typeof FeatureGrid3Schema>

// ────────────────────────────────────────────────────────────────────────
// FEATURE GRID 6 — bento
// ────────────────────────────────────────────────────────────────────────
export const FeatureGrid6Schema = z.object({
  eyebrow: SafeText(60),
  heading: SafeText(120),
  subheading: SafeText(280),
  items: z.array(FeatureItemSchema).max(8).default([]),
})
export type FeatureGrid6Content = z.infer<typeof FeatureGrid6Schema>

// ────────────────────────────────────────────────────────────────────────
// FEATURE SPLIT — alternating rows
// ────────────────────────────────────────────────────────────────────────
export const FeatureSplitSchema = z.object({
  eyebrow: SafeText(60),
  heading: SafeText(120),
  rows: z
    .array(
      z.object({
        title: RequiredText(80),
        body: RequiredText(420),
        bullets: z.array(z.string().trim().max(140)).max(5).default([]),
        imageUrl: HttpsUrl.optional(),
        imageAlt: SafeText(140),
      }),
    )
    .max(4)
    .default([]),
})
export type FeatureSplitContent = z.infer<typeof FeatureSplitSchema>

// ────────────────────────────────────────────────────────────────────────
// HOW IT WORKS — numbered steps
// ────────────────────────────────────────────────────────────────────────
export const HowItWorksSchema = z.object({
  eyebrow: SafeText(60),
  heading: SafeText(120),
  subheading: SafeText(280),
  steps: z
    .array(
      z.object({
        title: RequiredText(80),
        description: RequiredText(280),
      }),
    )
    .max(5)
    .default([]),
})
export type HowItWorksContent = z.infer<typeof HowItWorksSchema>

// ────────────────────────────────────────────────────────────────────────
// TESTIMONIAL GRID — 3 cards
// ────────────────────────────────────────────────────────────────────────
export const TestimonialItemSchema = z.object({
  quote: RequiredText(420),
  authorName: RequiredText(80),
  authorTitle: SafeText(80),
  authorCompany: SafeText(80),
  avatarUrl: HttpsUrl.optional(),
})
export type TestimonialItemContent = z.infer<typeof TestimonialItemSchema>

export const TestimonialGridSchema = z.object({
  eyebrow: SafeText(60),
  heading: SafeText(120),
  items: z.array(TestimonialItemSchema).max(6).default([]),
})
export type TestimonialGridContent = z.infer<typeof TestimonialGridSchema>

// ────────────────────────────────────────────────────────────────────────
// TESTIMONIAL SINGLE — one big quote
// ────────────────────────────────────────────────────────────────────────
export const TestimonialSingleSchema = z.object({
  eyebrow: SafeText(60),
  quote: RequiredText(600),
  authorName: RequiredText(80),
  authorTitle: SafeText(80),
  authorCompany: SafeText(80),
  avatarUrl: HttpsUrl.optional(),
})
export type TestimonialSingleContent = z.infer<typeof TestimonialSingleSchema>

// ────────────────────────────────────────────────────────────────────────
// PRICING 3-tier
// ────────────────────────────────────────────────────────────────────────
export const PricingTierSchema = z.object({
  name: RequiredText(40),
  price: RequiredText(20),
  cadence: SafeText(20),
  description: SafeText(140),
  features: z.array(z.string().trim().max(140)).max(8).default([]),
  ctaLabel: SafeText(24),
  ctaHref: z.string().max(500).optional(),
  highlight: z.boolean().default(false),
})
export type PricingTierContent = z.infer<typeof PricingTierSchema>

export const Pricing3Schema = z.object({
  eyebrow: SafeText(60),
  heading: SafeText(120),
  subheading: SafeText(280),
  tiers: z.array(PricingTierSchema).max(3).default([]),
})
export type Pricing3Content = z.infer<typeof Pricing3Schema>

// ────────────────────────────────────────────────────────────────────────
// FAQ — accordion
// ────────────────────────────────────────────────────────────────────────
export const FaqSchema = z.object({
  eyebrow: SafeText(60),
  heading: SafeText(120),
  items: z
    .array(
      z.object({
        question: RequiredText(160),
        answer: RequiredText(600),
      }),
    )
    .max(10)
    .default([]),
})
export type FaqContent = z.infer<typeof FaqSchema>

// ────────────────────────────────────────────────────────────────────────
// CTA FORM — final conversion section, posts to /api/tenant/lead
// ────────────────────────────────────────────────────────────────────────
export const CtaFormSchema = z.object({
  eyebrow: SafeText(60),
  heading: RequiredText(120),
  subheading: SafeText(280),
  buttonLabel: SafeText(40),
  successMessage: SafeText(280),
})
export type CtaFormContent = z.infer<typeof CtaFormSchema>

// ────────────────────────────────────────────────────────────────────────
// FOOTER
// ────────────────────────────────────────────────────────────────────────
export const FooterSchema = z.object({
  copyrightLine: SafeText(120),
  links: z
    .array(
      z.object({
        label: RequiredText(40),
        href: z.string().min(1).max(500),
      }),
    )
    .max(8)
    .default([]),
  socialLinks: z
    .array(
      z.object({
        platform: z.enum([
          "twitter",
          "linkedin",
          "instagram",
          "facebook",
          "youtube",
          "github",
        ]),
        // Restrict to http(s) so a copy-paste of `javascript:alert(1)`
        // can't slip into the rendered footer's anchor href and run
        // when a visitor clicks the icon.
        href: HttpsUrl.refine(
          (u) => u.length <= 500,
          "URL too long (500 char max)",
        ),
      }),
    )
    .max(6)
    .default([]),
})
export type FooterContent = z.infer<typeof FooterSchema>
