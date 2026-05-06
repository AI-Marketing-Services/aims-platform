/**
 * Lightweight {{variable}} merge for email + template bodies.
 *
 * Supported tokens:
 *   {{contact.firstName}}  {{contact.lastName}}  {{contact.fullName}}  {{contact.email}}
 *   {{company.name}}
 *   {{operator.name}}      {{operator.firstName}}
 *
 * Anything else is left untouched (no aggressive replacement so a body
 * with literal curly braces in code samples doesn't get mangled).
 */
export interface MergeContext {
  contact?: {
    firstName?: string | null
    lastName?: string | null
    fullName?: string | null
    email?: string | null
  }
  company?: {
    name?: string | null
  }
  operator?: {
    name?: string | null
    firstName?: string | null
  }
}

export function mergeVariables(
  template: string,
  ctx: MergeContext,
): string {
  const tokens: Record<string, string> = {
    "contact.firstName": ctx.contact?.firstName ?? "",
    "contact.lastName": ctx.contact?.lastName ?? "",
    "contact.fullName":
      ctx.contact?.fullName ??
      [ctx.contact?.firstName, ctx.contact?.lastName]
        .filter(Boolean)
        .join(" ") ??
      "",
    "contact.email": ctx.contact?.email ?? "",
    "company.name": ctx.company?.name ?? "",
    "operator.name": ctx.operator?.name ?? "",
    "operator.firstName":
      ctx.operator?.firstName ?? ctx.operator?.name?.split(" ")[0] ?? "",
  }

  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, key: string) => {
    if (Object.prototype.hasOwnProperty.call(tokens, key)) {
      return tokens[key]
    }
    return match
  })
}
