"use client"

import { useState, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Upload,
  FileText,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertTriangle,
  Loader2,
  Sparkles,
  Trash2,
  Info,
} from "lucide-react"
import {
  parseCSV,
  suggestFieldMapping,
  type ClientDealImportField,
} from "@/lib/csv/parse"
import { cn } from "@/lib/utils"

type Step = "upload" | "map" | "review" | "result"

const FIELD_LABELS: Record<ClientDealImportField, string> = {
  companyName: "Company name *",
  contactName: "Contact name",
  contactEmail: "Contact email",
  contactPhone: "Contact phone",
  website: "Website",
  industry: "Industry",
  value: "Deal value ($)",
  notes: "Notes",
  stage: "Stage",
  tags: "Tags",
  skip: "Skip this column",
}

const FIELD_OPTIONS: ClientDealImportField[] = [
  "companyName",
  "contactName",
  "contactEmail",
  "contactPhone",
  "website",
  "industry",
  "value",
  "notes",
  "stage",
  "tags",
  "skip",
]

const STAGE_OPTIONS = [
  "PROSPECT",
  "DISCOVERY_CALL",
  "PROPOSAL_SENT",
  "ACTIVE_RETAINER",
  "COMPLETED",
  "LOST",
] as const

interface ImportWizardProps {
  creditBalance: number
}

export function ImportWizard({ creditBalance }: ImportWizardProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>("upload")
  const [fileName, setFileName] = useState<string | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [mapping, setMapping] = useState<Record<string, ClientDealImportField>>(
    {},
  )
  const [defaultStage, setDefaultStage] = useState<string>("PROSPECT")
  const [defaultTags, setDefaultTags] = useState<string>("imported")
  const [enrichOnImport, setEnrichOnImport] = useState(false)
  const [dedupBy, setDedupBy] = useState<"both" | "companyName" | "contactEmail">(
    "both",
  )
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    total: number
    created: number
    dupes: number
    invalid: number
    enriched: number
    enrichErrors: number
    enrichStopped: boolean
    invalidRows: Array<{ rowIndex: number; reason: string }>
  } | null>(null)

  function handleFile(file: File) {
    setParseError(null)
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? "")
      const parsed = parseCSV(text)
      if (parsed.errors.length > 0 && parsed.rows.length === 0) {
        setParseError(parsed.errors.join(". "))
        return
      }
      if (parsed.rowCount === 0) {
        setParseError("CSV has headers but no data rows.")
        return
      }
      setHeaders(parsed.headers)
      setRows(parsed.rows)
      // Auto-suggest field mapping (operator can override on next step)
      const suggested = suggestFieldMapping(parsed.headers)
      const initial: Record<string, ClientDealImportField> = {}
      for (const h of parsed.headers) {
        initial[h] = suggested[h] ?? "skip"
      }
      setMapping(initial)
      setStep("map")
    }
    reader.onerror = () => setParseError("Couldn't read the file.")
    reader.readAsText(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  function reset() {
    setStep("upload")
    setFileName(null)
    setHeaders([])
    setRows([])
    setMapping({})
    setResult(null)
    setImportError(null)
    setParseError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const mappingHasCompany = useMemo(
    () => Object.values(mapping).includes("companyName"),
    [mapping],
  )

  const previewRows = rows.slice(0, 5)

  async function handleImport() {
    setImportError(null)
    setImporting(true)
    try {
      const res = await fetch("/api/portal/crm/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows,
          mapping,
          defaultStage,
          defaultTags: defaultTags
            .split(/[,;]/)
            .map((t) => t.trim())
            .filter(Boolean),
          enrichOnImport,
          dedupBy,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 402) {
          setImportError(
            `Auto-enrich needs ${data.required ?? 80} credits per deal. You have ${data.available ?? 0}. Top up or import without auto-enrich.`,
          )
        } else {
          setImportError(typeof data.error === "string" ? data.error : "Import failed")
        }
        return
      }
      setResult({
        total: data.total ?? rows.length,
        created: data.created ?? 0,
        dupes: data.dupes ?? 0,
        invalid: data.invalid ?? 0,
        enriched: data.enriched ?? 0,
        enrichErrors: data.enrichErrors ?? 0,
        enrichStopped: data.enrichStopped ?? false,
        invalidRows: data.invalidRows ?? [],
      })
      setStep("result")
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Network error")
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Stepper step={step} />

      {/* STEP: UPLOAD */}
      {step === "upload" && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="rounded-2xl border-2 border-dashed border-border hover:border-primary/40 bg-card p-12 text-center transition-colors"
        >
          <Upload className="h-10 w-10 text-primary/60 mx-auto mb-3" />
          <p className="text-base font-semibold text-foreground mb-1">
            Drop your CSV here or click to choose
          </p>
          <p className="text-xs text-muted-foreground mb-5">
            Up to 2,000 rows per import. Common exports work out of the box
            (HubSpot, Pipedrive, Close, Google Sheets).
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Choose CSV
          </button>
          {parseError && (
            <div className="mt-4 inline-flex items-start gap-2 text-xs text-destructive">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              {parseError}
            </div>
          )}
        </div>
      )}

      {/* STEP: MAP */}
      {step === "map" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
            <FileText className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{fileName}</p>
              <p className="text-xs text-muted-foreground">
                {rows.length.toLocaleString()} rows, {headers.length} columns. We
                auto-mapped the columns we recognized. Adjust below.
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" />
              Choose different file
            </button>
          </div>

          {!mappingHasCompany && (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-600 inline-flex items-start gap-2">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              At least one column must be mapped to <strong>Company name</strong>{" "}
              before you can continue.
            </div>
          )}

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/30 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Column mapping
              </p>
            </div>
            <ul className="divide-y divide-border">
              {headers.map((h) => {
                const sampleValues = rows
                  .slice(0, 3)
                  .map((r) => r[h])
                  .filter(Boolean)
                  .slice(0, 3)
                return (
                  <li
                    key={h}
                    className="px-4 py-3 flex items-center gap-3 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {h}
                      </p>
                      {sampleValues.length > 0 && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          e.g. {sampleValues.join(" · ")}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <select
                      value={mapping[h] ?? "skip"}
                      onChange={(e) =>
                        setMapping((m) => ({
                          ...m,
                          [h]: e.target.value as ClientDealImportField,
                        }))
                      }
                      className="px-2.5 py-1.5 rounded border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    >
                      {FIELD_OPTIONS.map((f) => (
                        <option key={f} value={f}>
                          {FIELD_LABELS[f]}
                        </option>
                      ))}
                    </select>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Default settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">
                Default stage
              </p>
              <select
                value={defaultStage}
                onChange={(e) => setDefaultStage(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                {STAGE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-muted-foreground mt-1">
                Used when a row has no stage column.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">
                Default tags (comma separated)
              </p>
              <input
                type="text"
                value={defaultTags}
                onChange={(e) => setDefaultTags(e.target.value)}
                placeholder="imported, q4-list"
                className="w-full px-2.5 py-1.5 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Appended to every imported deal.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">
                Skip duplicates by
              </p>
              <select
                value={dedupBy}
                onChange={(e) =>
                  setDedupBy(e.target.value as "both" | "companyName" | "contactEmail")
                }
                className="w-full px-2.5 py-1.5 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                <option value="both">Company name OR email</option>
                <option value="companyName">Company name only</option>
                <option value="contactEmail">Email only</option>
              </select>
              <p className="text-[10px] text-muted-foreground mt-1">
                Existing deals you already own are skipped.
              </p>
            </div>
          </div>

          {/* Auto-enrich toggle */}
          <label className="rounded-xl border border-border bg-card p-3 flex items-start gap-3 cursor-pointer hover:border-primary/40 transition-colors">
            <input
              type="checkbox"
              checked={enrichOnImport}
              onChange={(e) => setEnrichOnImport(e.target.checked)}
              className="mt-0.5"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Auto-enrich every imported deal
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Runs the full Website + Perplexity + Hunter + Prospeo pipeline on
                each new deal. Costs up to ~80 credits per deal worst case. You
                have <strong className="text-foreground">{creditBalance.toLocaleString()}</strong>{" "}
                credits, enough for ~
                <strong className="text-foreground">{Math.floor(creditBalance / 80)}</strong>{" "}
                full enrichments.
              </p>
            </div>
          </label>

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" />
              Start over
            </button>
            <button
              type="button"
              onClick={() => setStep("review")}
              disabled={!mappingHasCompany}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Preview import
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP: REVIEW */}
      {step === "review" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
            <p className="text-sm font-semibold text-foreground">
              About to import {rows.length.toLocaleString()} rows.
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Existing deals matching by{" "}
              {dedupBy === "both"
                ? "company name OR email"
                : dedupBy === "companyName"
                  ? "company name"
                  : "email"}{" "}
              are skipped automatically.
              {enrichOnImport
                ? ` Each new deal will be auto-enriched (up to ${rows.length * 80} credits worst case).`
                : ""}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/30 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Preview (first 5 rows)
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/20">
                  <tr>
                    {Object.entries(mapping)
                      .filter(([, f]) => f !== "skip")
                      .map(([h, f]) => (
                        <th
                          key={h}
                          className="text-left px-3 py-2 font-semibold text-muted-foreground border-b border-border"
                        >
                          <p className="text-[10px] uppercase tracking-wider">
                            {FIELD_LABELS[f]}
                          </p>
                          <p className="text-[10px] font-normal text-muted-foreground/60">
                            from: {h}
                          </p>
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((r, i) => (
                    <tr
                      key={i}
                      className="border-b border-border last:border-b-0"
                    >
                      {Object.entries(mapping)
                        .filter(([, f]) => f !== "skip")
                        .map(([h]) => (
                          <td
                            key={h}
                            className="px-3 py-2 text-foreground truncate max-w-[200px]"
                          >
                            {r[h] || (
                              <span className="text-muted-foreground/50">
                                (empty)
                              </span>
                            )}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 5 && (
              <div className="px-4 py-2 text-[11px] text-muted-foreground border-t border-border bg-muted/10">
                + {rows.length - 5} more rows
              </div>
            )}
          </div>

          {importError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              {importError}
            </div>
          )}

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => setStep("map")}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              disabled={importing}
            >
              <ArrowLeft className="h-3 w-3" />
              Back to mapping
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={importing}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing
                  {enrichOnImport ? " + enriching" : ""}
                  ... this may take a few minutes.
                </>
              ) : (
                <>
                  Import {rows.length.toLocaleString()} rows
                  <Check className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP: RESULT */}
      {step === "result" && result && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 text-center">
            <Check className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-lg font-bold text-foreground">
              Import complete.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {result.created} new deal{result.created === 1 ? "" : "s"} added to
              your CRM.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Total rows" value={result.total} />
            <Stat label="New deals" value={result.created} accent="emerald" />
            <Stat label="Duplicates skipped" value={result.dupes} accent="muted" />
            <Stat label="Invalid rows" value={result.invalid} accent={result.invalid > 0 ? "amber" : "muted"} />
            {result.enriched > 0 && (
              <Stat label="Auto-enriched" value={result.enriched} accent="primary" />
            )}
            {result.enrichErrors > 0 && (
              <Stat label="Enrich errors" value={result.enrichErrors} accent="amber" />
            )}
          </div>

          {result.enrichStopped && (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-600 flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              Auto-enrichment stopped midway because credits ran out. The deals
              are imported. Top up and re-enrich them via the bulk-enrich banner
              on the CRM page.
            </div>
          )}

          {result.invalidRows.length > 0 && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-2.5 bg-muted/30 border-b border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Invalid rows (first 50)
                </p>
              </div>
              <ul className="divide-y divide-border">
                {result.invalidRows.map((r, i) => (
                  <li key={i} className="px-4 py-2 text-xs">
                    <span className="font-mono text-muted-foreground mr-2">
                      Row {r.rowIndex + 2}
                    </span>
                    <span className="text-destructive">{r.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" />
              Import another file
            </button>
            <button
              type="button"
              onClick={() => router.push("/portal/crm")}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Open CRM
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Stepper({ step }: { step: Step }) {
  const order: Step[] = ["upload", "map", "review", "result"]
  const labels: Record<Step, string> = {
    upload: "Upload",
    map: "Map columns",
    review: "Review",
    result: "Done",
  }
  const idx = order.indexOf(step)
  return (
    <div className="flex items-center gap-2 text-xs">
      {order.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold",
              i === idx
                ? "bg-primary text-primary-foreground"
                : i < idx
                  ? "text-emerald-500"
                  : "text-muted-foreground/60",
            )}
          >
            {i < idx ? (
              <Check className="h-3 w-3" />
            ) : (
              <span className="font-mono">{i + 1}</span>
            )}
            {labels[s]}
          </div>
          {i < order.length - 1 && (
            <ArrowRight className="h-3 w-3 text-muted-foreground/30" />
          )}
        </div>
      ))}
    </div>
  )
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: "emerald" | "amber" | "primary" | "muted"
}) {
  const accentClass =
    accent === "emerald"
      ? "text-emerald-500"
      : accent === "amber"
        ? "text-amber-500"
        : accent === "primary"
          ? "text-primary"
          : "text-foreground"
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
        {label}
      </p>
      <p className={cn("text-2xl font-bold tabular-nums mt-1", accentClass)}>
        {value.toLocaleString()}
      </p>
    </div>
  )
}
