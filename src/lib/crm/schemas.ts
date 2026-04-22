import { z } from "zod"

export const createDealSchema = z.object({
  companyName: z.string().min(1, "Company name required").max(120),
  contactName: z.string().max(120).nullish(),
  contactEmail: z.string().email().nullish().or(z.literal("")),
  contactPhone: z.string().max(40).nullish(),
  website: z.string().url().nullish().or(z.literal("")),
  industry: z.string().max(80).nullish(),
  stage: z
    .enum(["PROSPECT", "DISCOVERY_CALL", "PROPOSAL_SENT", "ACTIVE_RETAINER", "COMPLETED", "LOST"])
    .optional(),
  value: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  notes: z.string().max(5000).nullish(),
  tags: z.array(z.string().max(40)).max(10).optional(),
})

export const updateDealSchema = createDealSchema.partial()

export const createContactSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().max(80).nullish(),
  title: z.string().max(80).nullish(),
  email: z.string().email().nullish().or(z.literal("")),
  phone: z.string().max(40).nullish(),
  isPrimary: z.boolean().optional(),
  notes: z.string().max(2000).nullish(),
})

export const createActivitySchema = z.object({
  type: z.enum(["NOTE", "CALL", "EMAIL", "MEETING", "PROPOSAL_SENT", "STAGE_CHANGE", "CONTACT_ADDED"]),
  description: z.string().max(5000).nullish(),
  metadata: z.record(z.unknown()).nullish(),
})
