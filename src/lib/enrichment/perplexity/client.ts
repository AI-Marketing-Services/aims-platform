/**
 * Perplexity Sonar — single LLM call that researches a business and
 * returns structured JSON: management company, decision-maker name +
 * title, contact email shown publicly, 1-2 sentence description.
 *
 * Forces JSON response_format. Strict JSON parse with markdown-fence
 * stripping (Sonar sometimes wraps despite response_format). 10s timeout.
 * Returns null-filled object on any failure so the orchestrator never
 * has to handle exceptions — degrades gracefully.
 */

const PERPLEXITY_BASE = "https://api.perplexity.ai"
const MODEL = "sonar"

export interface PerplexityBusinessResult {
  management_company: string | null
  contact_name: string | null
  contact_title: string | null
  contact_email: string | null
  description: string | null
}

const EMPTY: PerplexityBusinessResult = {
  management_company: null,
  contact_name: null,
  contact_title: null,
  contact_email: null,
  description: null,
}

export async function researchBusiness(args: {
  name: string
  city?: string | null
  state?: string | null
  website?: string | null
  industry?: string | null
}): Promise<PerplexityBusinessResult> {
  const key = process.env.PERPLEXITY_API_KEY
  if (!key) return EMPTY

  const locationStr = [args.city, args.state].filter(Boolean).join(", ")
  const context = [
    `Business: ${args.name}`,
    locationStr ? `Location: ${locationStr}` : null,
    args.website ? `Website: ${args.website}` : null,
    args.industry ? `Type: ${args.industry}` : null,
  ]
    .filter(Boolean)
    .join("\n")

  try {
    const res = await fetch(`${PERPLEXITY_BASE}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a business research assistant. Respond ONLY with valid JSON, no markdown, no explanation.",
          },
          {
            role: "user",
            content: `Research this business and return exactly this JSON structure, filling in real values where found:
{"management_company":null,"contact_name":null,"contact_title":null,"contact_email":null,"description":null}

management_company: the parent / facilities / property management company name if managed (e.g. "Greystar"), null if owner-operated
contact_name: full name of the primary decision maker (owner, GM, ops director, property manager), null if unknown
contact_title: their job title, null if unknown
contact_email: a real contact email address for this specific business — check the website's contact page, leasing page, or any "mailto:" links. Prefer a direct location email over a generic corporate one. null if none found.
description: 1-2 sentence description of the business, null if unknown

${context}`,
          },
        ],
        max_tokens: 300,
        temperature: 0,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return EMPTY

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const content = json.choices?.[0]?.message?.content
    if (!content) return EMPTY

    // Strip ```json fences if Sonar still wraps despite response_format
    const cleaned = content
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim()
    const parsed = JSON.parse(cleaned) as Partial<PerplexityBusinessResult>
    return {
      management_company: clean(parsed.management_company),
      contact_name: clean(parsed.contact_name),
      contact_title: clean(parsed.contact_title),
      contact_email: cleanEmail(parsed.contact_email),
      description: clean(parsed.description),
    }
  } catch {
    return EMPTY
  }
}

function clean(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null
}

function cleanEmail(v: unknown): string | null {
  if (typeof v !== "string") return null
  const t = v.trim().toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) ? t : null
}
