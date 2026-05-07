-- Manual SQL migration — apply once after `prisma db push` lands a new
-- Deal table. Prisma's schema language doesn't support expression indexes,
-- so this is applied out of band.
--
-- WHY: Several cron jobs (`nurture-unbooked`, `abandoned-applications`)
-- and webhook handlers (Mighty, Close) look up Deals by contactEmail with
-- `mode: "insensitive"`, which Prisma translates to:
--
--     WHERE LOWER("contactEmail") = LOWER($1)
--
-- A plain btree on "contactEmail" cannot accelerate that predicate. This
-- functional index makes those lookups index-scans instead of seq-scans,
-- saving ~30-50ms per inbound webhook at our current scale.
--
-- HOW TO APPLY:
--   psql "$DATABASE_URL" -f prisma/migrations/manual/lower-contact-email.sql
--
-- IDEMPOTENT: uses IF NOT EXISTS, safe to re-run.

CREATE INDEX IF NOT EXISTS "Deal_lower_contactEmail_idx"
  ON "Deal" (LOWER("contactEmail"));

-- Verify with:
--   SELECT indexname, indexdef FROM pg_indexes
--   WHERE tablename = 'Deal' AND indexname = 'Deal_lower_contactEmail_idx';
