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

/**
 * Strip any character whose Unicode block is in the emoji / pictograph
 * range. Names, titles, and phone numbers should NEVER contain emoji —
 * even one breaks downstream CSV exports, deliverability checks, etc.
 * Implemented as `string().transform()` so accidental paste-in saves
 * cleanly instead of throwing a schema error.
 */
function emojiStrippedString(max: number) {
  return z
    .string()
    .max(max)
    .transform((s) =>
      s
        .replace(/\p{Extended_Pictographic}/gu, "")
        .replace(/\p{Emoji_Presentation}/gu, "")
        .replace(/[︎️‍]/g, "") // variation selectors + zero-width joiner
        .trim(),
    )
}

const phoneSchema = z
  .string()
  .max(40)
  .regex(
    /^[\d\s()+\-.x,]*$/i,
    "Phone may only contain digits, spaces, and the characters + - ( ) . , x",
  )

export const createContactSchema = z
  .object({
    firstName: emojiStrippedString(80).pipe(
      z.string().min(1, "First name is required after stripping emoji"),
    ),
    lastName: emojiStrippedString(80).nullish(),
    title: emojiStrippedString(80).nullish(),
    email: z.string().email().nullish().or(z.literal("")),
    phone: phoneSchema.nullish().or(z.literal("")),
    isPrimary: z.boolean().optional(),
    notes: z.string().max(2000).nullish(),
  })
  // Require at least ONE way to actually reach the contact beyond just
  // a bare first name. Otherwise operators accumulate useless single-
  // token rows like "Alex" that can't be emailed, called, or matched.
  .refine(
    (d) =>
      (d.email && d.email.length > 0) ||
      (d.phone && d.phone.length > 0) ||
      (d.lastName && d.lastName.length > 0),
    {
      message:
        "Add at least one of: last name, email, or phone — otherwise this contact isn't reachable.",
      path: ["email"],
    },
  )

export const createActivitySchema = z.object({
  type: z.enum(["NOTE", "CALL", "EMAIL", "MEETING", "PROPOSAL_SENT", "STAGE_CHANGE", "CONTACT_ADDED"]),
  description: z.string().max(5000).nullish(),
  metadata: z.record(z.unknown()).nullish(),
})
