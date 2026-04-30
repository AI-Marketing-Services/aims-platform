/**
 * Tiny CSV parser. Handles:
 *   - Quoted fields with embedded commas: "Hello, world",foo
 *   - Escaped quotes inside quoted fields: "He said ""hi"""
 *   - CRLF + LF line endings
 *   - Trailing whitespace per cell
 *
 * We avoid pulling in a full CSV dep (papaparse, csv-parse) for what's
 * functionally a 60-line state machine. Tested against the typical
 * exports from HubSpot, Pipedrive, Close, Google Sheets.
 */

export interface ParsedCSV {
  headers: string[]
  rows: Record<string, string>[]
  rowCount: number
  errors: string[]
}

export function parseCSV(text: string): ParsedCSV {
  const errors: string[] = []
  if (!text || text.trim().length === 0) {
    return { headers: [], rows: [], rowCount: 0, errors: ["Empty file"] }
  }

  // Strip UTF-8 BOM if present
  const normalised = text.replace(/^﻿/, "")

  const lines: string[][] = []
  let current: string[] = []
  let cell = ""
  let inQuotes = false
  let i = 0

  while (i < normalised.length) {
    const ch = normalised[i]
    const next = normalised[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"'
        i += 2
        continue
      }
      if (ch === '"') {
        inQuotes = false
        i += 1
        continue
      }
      cell += ch
      i += 1
      continue
    }

    if (ch === '"') {
      inQuotes = true
      i += 1
      continue
    }
    if (ch === ",") {
      current.push(cell)
      cell = ""
      i += 1
      continue
    }
    if (ch === "\r" && next === "\n") {
      current.push(cell)
      lines.push(current)
      current = []
      cell = ""
      i += 2
      continue
    }
    if (ch === "\n" || ch === "\r") {
      current.push(cell)
      lines.push(current)
      current = []
      cell = ""
      i += 1
      continue
    }
    cell += ch
    i += 1
  }

  // Flush final cell + line if file didn't end with a newline
  if (cell.length > 0 || current.length > 0) {
    current.push(cell)
    lines.push(current)
  }

  if (lines.length === 0) {
    return { headers: [], rows: [], rowCount: 0, errors: ["No rows found"] }
  }

  const headers = lines[0].map((h) => h.trim())
  if (headers.length === 0 || headers.every((h) => !h)) {
    return { headers: [], rows: [], rowCount: 0, errors: ["No headers found"] }
  }

  const rows: Record<string, string>[] = []
  for (let r = 1; r < lines.length; r++) {
    const line = lines[r]
    if (line.length === 1 && line[0].trim() === "") continue // blank line
    const obj: Record<string, string> = {}
    for (let c = 0; c < headers.length; c++) {
      obj[headers[c]] = (line[c] ?? "").trim()
    }
    rows.push(obj)
  }

  return { headers, rows, rowCount: rows.length, errors }
}

/**
 * Best-effort header normalization to canonical field names. Maps
 * common CRM export variants to the operator's `ClientDeal` columns.
 *
 * Returns: { sourceHeader, suggestedField } pairs. UI can override.
 */
export function suggestFieldMapping(
  headers: string[],
): Record<string, ClientDealImportField | null> {
  const mapping: Record<string, ClientDealImportField | null> = {}

  for (const h of headers) {
    mapping[h] = guessField(h)
  }

  return mapping
}

export type ClientDealImportField =
  | "companyName"
  | "contactName"
  | "contactEmail"
  | "contactPhone"
  | "website"
  | "industry"
  | "value"
  | "notes"
  | "stage"
  | "tags"
  | "skip"

const FIELD_HINTS: Record<ClientDealImportField, RegExp[]> = {
  companyName: [
    /^company( ?name)?$/i,
    /^business( ?name)?$/i,
    /^organi[sz]ation$/i,
    /^account( ?name)?$/i,
    /^name$/i, // generic 'Name' usually means company in CRM exports
  ],
  contactName: [
    /^contact( ?name)?$/i,
    /^full( ?name)?$/i,
    /^first.*last|last.*first/i,
    /^primary contact$/i,
    /^owner$/i,
  ],
  contactEmail: [/email/i, /e-mail/i],
  contactPhone: [/phone/i, /mobile/i, /tel/i],
  website: [/website/i, /url/i, /domain/i, /^web$/i],
  industry: [/industry/i, /sector/i, /vertical/i],
  value: [/^value$/i, /amount/i, /^deal( ?value)?$/i, /mrr/i, /price/i],
  notes: [/notes?/i, /comment/i, /description/i],
  stage: [/stage/i, /status/i, /pipeline/i],
  tags: [/tags?/i, /labels?/i, /categor(y|ies)/i],
  skip: [],
}

function guessField(header: string): ClientDealImportField | null {
  for (const [field, patterns] of Object.entries(FIELD_HINTS) as Array<
    [ClientDealImportField, RegExp[]]
  >) {
    if (patterns.some((p) => p.test(header))) return field
  }
  return null
}
