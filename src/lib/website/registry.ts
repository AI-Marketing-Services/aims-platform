import "server-only"

import type { z } from "zod"
import type { ComponentType } from "react"
import type { SectionType } from "./types"
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
} from "./schemas"

import { Navbar } from "@/components/website/sections/navbar"
import { HeroCenter } from "@/components/website/sections/hero-center"
import { HeroSplit } from "@/components/website/sections/hero-split"
import { LogoBar } from "@/components/website/sections/logo-bar"
import { FeatureGrid3 } from "@/components/website/sections/feature-grid-3"
import { FeatureGrid6 } from "@/components/website/sections/feature-grid-6"
import { FeatureSplit } from "@/components/website/sections/feature-split"
import { HowItWorks } from "@/components/website/sections/how-it-works"
import { TestimonialGrid } from "@/components/website/sections/testimonial-grid"
import { TestimonialSingle } from "@/components/website/sections/testimonial-single"
import { Pricing3 } from "@/components/website/sections/pricing-3"
import { Faq } from "@/components/website/sections/faq"
import { CtaForm } from "@/components/website/sections/cta-form"
import { SiteFooter } from "@/components/website/sections/footer"

import type { SectionBrand } from "./types"

/**
 * Each registry entry pairs the validation schema with the renderer.
 * Adding a new section type means: (a) define the schema in schemas.ts,
 * (b) build the component in components/website/sections/, (c) register
 * the pair here.
 *
 * Components receive `{ content, brand }` where content is already
 * validated against the schema. If validation fails the renderer
 * substitutes the schema's parsed-empty default rather than crashing,
 * so a malformed JSON payload at most renders an empty section.
 */
export interface SectionDef<S extends z.ZodTypeAny = z.ZodTypeAny> {
  schema: S
  Component: ComponentType<{ content: z.infer<S>; brand: SectionBrand }>
}

export const SECTION_REGISTRY: Record<SectionType, SectionDef> = {
  navbar: { schema: NavbarSchema, Component: Navbar as ComponentType<{ content: unknown; brand: SectionBrand }> },
  "hero-center": { schema: HeroCenterSchema, Component: HeroCenter as ComponentType<{ content: unknown; brand: SectionBrand }> },
  "hero-split": { schema: HeroSplitSchema, Component: HeroSplit as ComponentType<{ content: unknown; brand: SectionBrand }> },
  "logo-bar": { schema: LogoBarSchema, Component: LogoBar as ComponentType<{ content: unknown; brand: SectionBrand }> },
  "feature-grid-3": { schema: FeatureGrid3Schema, Component: FeatureGrid3 as ComponentType<{ content: unknown; brand: SectionBrand }> },
  "feature-grid-6": { schema: FeatureGrid6Schema, Component: FeatureGrid6 as ComponentType<{ content: unknown; brand: SectionBrand }> },
  "feature-split": { schema: FeatureSplitSchema, Component: FeatureSplit as ComponentType<{ content: unknown; brand: SectionBrand }> },
  "how-it-works": { schema: HowItWorksSchema, Component: HowItWorks as ComponentType<{ content: unknown; brand: SectionBrand }> },
  "testimonial-grid": { schema: TestimonialGridSchema, Component: TestimonialGrid as ComponentType<{ content: unknown; brand: SectionBrand }> },
  "testimonial-single": { schema: TestimonialSingleSchema, Component: TestimonialSingle as ComponentType<{ content: unknown; brand: SectionBrand }> },
  "pricing-3": { schema: Pricing3Schema, Component: Pricing3 as ComponentType<{ content: unknown; brand: SectionBrand }> },
  faq: { schema: FaqSchema, Component: Faq as ComponentType<{ content: unknown; brand: SectionBrand }> },
  "cta-form": { schema: CtaFormSchema, Component: CtaForm as ComponentType<{ content: unknown; brand: SectionBrand }> },
  footer: { schema: FooterSchema, Component: SiteFooter as ComponentType<{ content: unknown; brand: SectionBrand }> },
}

export function resolveSection(type: SectionType): SectionDef {
  return SECTION_REGISTRY[type]
}
