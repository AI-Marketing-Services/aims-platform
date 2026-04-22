import { z } from "zod"
import { ONBOARDING_STEP_KEYS } from "./steps"

export const markStepSchema = z.object({
  stepKey: z.enum(ONBOARDING_STEP_KEYS),
  method: z.enum(["self", "admin"]).default("self"),
})

export const resetStepSchema = z.object({
  stepKey: z.enum(ONBOARDING_STEP_KEYS),
})

export const profileSchema = z.object({
  businessName: z.string().max(120).optional().nullable(),
  logoUrl: z.string().url("Must be a valid URL").optional().nullable(),
  oneLiner: z.string().max(280).optional().nullable(),
  niche: z.string().max(80).optional().nullable(),
  idealClient: z.string().max(500).optional().nullable(),
  businessUrl: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color (#RRGGBB)").optional().nullable(),
  tagline: z.string().max(120).optional().nullable(),
})

export type MarkStepInput = z.infer<typeof markStepSchema>
export type ProfileInput = z.infer<typeof profileSchema>
