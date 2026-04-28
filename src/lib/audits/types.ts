// Audit-quiz question shape stored as JSON on AuditQuiz.questions.
// Keeps the structured types out of Prisma so question schema can evolve
// without migrations.

export type QuestionType =
  | "single_select"
  | "multi_select"
  | "short_text"
  | "long_text"
  | "number"
  | "email"

export interface QuizOption {
  id: string
  label: string
  value?: string | number
}

export interface QuizQuestion {
  id: string
  label: string
  helper?: string
  type: QuestionType
  required?: boolean
  options?: QuizOption[]
  placeholder?: string
}

export interface QuizBranding {
  logoUrl: string | null
  brandColor: string | null
  accentColor: string | null
}

// Answer payload posted from the public form.
export type AnswerValue = string | number | string[] | null
export type AnswerMap = Record<string, AnswerValue>

export interface LeadIdentity {
  email?: string
  name?: string
  company?: string
  phone?: string
  role?: string
}
