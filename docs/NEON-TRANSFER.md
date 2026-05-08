# Neon DB Transfer — Personal → Modern Amenities

This is a runbook for moving the AIMS production database from your personal
Neon account to the Modern Amenities org account so billing, ownership, and
backups all live with the company.

Current state:
- Project: `aims_NEON_PROJECT_ID="muddy-breeze-73660039"` (your personal
  Neon account, currently billed to your personal card).
- Database: `neondb`
- Pooled host: `ep-hidden-meadow-a4qtahc0-pooler.us-east-1.aws.neon.tech`
- Direct host: `ep-hidden-meadow-a4qtahc0.us-east-1.aws.neon.tech`
- Vercel project that consumes it: `aims-platform`
  (`prj_5zC3XD872gBSKJrjMQAG4kzxzJy1`) on the `am-collective` team.

There are two viable paths. Pick one based on what Modern Amenities wants
in its Neon org.

---

## Option A — Native project transfer (preferred)

Neon supports moving a project between accounts/orgs with **zero downtime**
and the connection strings stay the same. Adam Wolfe (or whoever owns the
Modern Amenities Neon org) needs to do this in the Neon console.

### Prerequisites
- Modern Amenities is on a paid Neon plan that supports project transfer
  (Launch / Scale / Business). Free plan can receive but only up to one
  project. Verify in Neon → Settings → Billing first.
- The receiving account is a **Neon org** (not a personal account). Project
  transfer works org → org or personal → org. If MA is still on a personal
  account, create the org first: Neon console → top-left org switcher →
  "Create new org".
- Both accounts have email-verified owners.

### Steps
1. In your **personal** Neon console, open the `aims-platform` project
   (project id `muddy-breeze-73660039`).
2. Settings → "Transfer project". Pick the destination org (Modern
   Amenities). Confirm.
3. The destination org receives an email invite. Accept from the MA
   account. Transfer completes in seconds.
4. **Connection strings do not change.** `DATABASE_URL` / `DIRECT_URL`
   in Vercel keep working — no app deploy required.
5. Rotate the password on the MA side (Neon → Branches → main → Roles
   → `neondb_owner` → Reset password). Update the `DATABASE_URL` /
   `DIRECT_URL` env vars in Vercel with the new password. Redeploy.
6. Delete the old project from your personal account once you've
   verified the production app is healthy on the transferred copy
   (give it 24h to be safe).

### Why this beats a manual dump+restore
- No DNS / connection-string change.
- No data drift window — your transfer happens at a single moment.
- Branches, points-in-time, and existing connection limits transfer
  with the project.
- Vercel integration (the `aims_*` env vars in `.env.local`) stays bound
  to the same project.

If "Transfer project" is greyed out, the destination org is on Free or
hasn't accepted billing — fix that first.

---

## Option B — Manual dump → restore (fallback)

Use this only if Option A isn't supported by your Neon plan or the project
has historic state you want to keep separate.

This involves a brief read-only window. Plan ~30 minutes and do it during
off-peak hours (or before the email campaign starts firing on Monday).

### Prerequisites
- Local `psql` (Postgres 16 client) and `pg_dump` installed.
  - macOS: `brew install postgresql@16` then add `/opt/homebrew/opt/postgresql@16/bin` to `PATH`.
- A new Neon project created in the Modern Amenities org with the same
  region (`us-east-1` AWS) and same Postgres version (currently 17 —
  verify with `SELECT version();` against the source).
- Both DSNs in hand:
  - Source: from your personal Neon, with `?sslmode=require`.
  - Dest:   from MA Neon, also `?sslmode=require`.

### Steps
1. **Dump from source.** Use the unpooled DIRECT host — pooled hosts
   don't allow `pg_dump`'s replication-style connections.
   ```bash
   export SRC_DSN='postgresql://neondb_owner:...@ep-hidden-meadow-a4qtahc0.us-east-1.aws.neon.tech/neondb?sslmode=require'
   pg_dump \
     --no-owner --no-acl \
     --format=custom \
     --file=aims-prod.dump \
     "$SRC_DSN"
   ```
   `--no-owner --no-acl` strips ownership statements so the restore
   doesn't fight Neon's role model.

2. **Set source to read-only** (optional but recommended — prevents
   writes during the cutover window). In Neon SQL editor on source:
   ```sql
   ALTER DATABASE neondb SET default_transaction_read_only = on;
   ```
   Existing connections keep working until they reconnect; new
   sessions immediately can't write.

3. **Restore to destination.** Same direct host, NOT the pooler.
   ```bash
   export DST_DSN='postgresql://neondb_owner:...@ep-NEW-DEST.us-east-1.aws.neon.tech/neondb?sslmode=require'
   pg_restore \
     --no-owner --no-acl \
     --clean --if-exists \
     --dbname="$DST_DSN" \
     aims-prod.dump
   ```
   `--clean --if-exists` lets you re-run the restore safely if it
   partially fails. Expect a handful of "permission denied" warnings
   for extensions Neon manages itself — those are safe to ignore.

4. **Sanity check.** Compare row counts on the highest-traffic tables:
   ```sql
   SELECT 'Deal' AS t, count(*) FROM "Deal"
   UNION ALL SELECT 'LeadMagnetSubmission', count(*) FROM "LeadMagnetSubmission"
   UNION ALL SELECT 'EmailQueueItem', count(*) FROM "EmailQueueItem"
   UNION ALL SELECT 'PartialApplication', count(*) FROM "PartialApplication"
   UNION ALL SELECT 'WebhookEvent', count(*) FROM "WebhookEvent";
   ```
   Run on both source and dest. Numbers must match.

5. **Re-enable writes on destination** (only if you set source to
   read-only):
   ```sql
   ALTER DATABASE neondb SET default_transaction_read_only = off;
   ```

6. **Update Vercel env vars.** In the Vercel dashboard → aims-platform →
   Settings → Environment Variables, replace these for the **Production**
   environment:
   - `DATABASE_URL` → MA pooled host
   - `DIRECT_URL` → MA direct host
   - `aims_DATABASE_URL` (and the rest of the `aims_*` Postgres aliases)
     → MA equivalents
   Trigger a redeploy. The build will run `prisma generate` against the
   new DSN.

7. **Verify in production:**
   - Hit `/api/health` — should return 200.
   - Submit a test apply form with a throwaway email — should land in
     Close + the Deal table on the new DB.
   - Watch Vercel function logs for any "Can't reach database server"
     errors during the first 10 minutes.

8. **Lock down the source.** Once production is healthy on dest:
   - Revoke the source DSN's password (rotate to garbage).
   - Pause the source project in Neon → Settings.
   - Delete after 7 days.

### What can go wrong
- **`pg_restore` complains about extensions.** Neon ships several
  built-in. Check `SELECT extname FROM pg_extension` on both. For each
  missing one on dest run `CREATE EXTENSION IF NOT EXISTS <name>;` —
  Neon auto-installs the supported list.
- **`prisma db push` after restore fails on indexes.** Don't run
  `db push` during cutover — schema is already in the dump. Only
  push if the schema changed in code (which it did, this PR adds
  `[email, type, createdAt]` on `LeadMagnetSubmission`). Run
  `npx prisma db push --skip-generate` against the new DSN once the
  dump is restored.
- **Connection-pool exhaustion.** If you forget to update the pooled
  URL, the app may run on direct connections only and exhaust the
  connection limit under load. Always update both `DATABASE_URL`
  (pooled) and `DIRECT_URL` (direct).

---

## After either path

1. Run `prisma db push` against the new prod DSN to apply the new
   composite index added in this PR (`LeadMagnetSubmission(email,
   type, createdAt)`):
   ```bash
   DATABASE_URL='postgresql://...new prod...' \
   DIRECT_URL='postgresql://...new prod direct...' \
   npx prisma db push
   ```
2. Confirm Vercel cron jobs still authenticate — `CRON_SECRET` is
   independent of the DB but the cron handlers query Postgres on every
   tick. Watch the next scheduled tick of `process-email-queue`.
3. Cancel the old Neon project / personal Neon billing.
4. Update this file with "Transfer completed YYYY-MM-DD by [name]" so
   future maintainers know where the canonical DB lives.

## Other accounts to swap to Modern Amenities

These are using personal credit cards / API keys today (per Adam Wolfe).
Move the billing AND rotate the keys when you do:

- **Firecrawl** — `FIRECRAWL_API_KEY=fc-b6041607224242faa631f47574e7cd35`.
  Re-issue under MA, update Vercel prod env var, redeploy.
- **Tavily** — `TAVILY_API_KEY=tvly-prod-...`. Same flow.
- **Anthropic** (`ANTHROPIC_API_KEY=sk-ant-api03-...`) — verify which
  account this is on. If personal, regenerate under Modern Amenities
  Anthropic console.
- **Perplexity** (`PERPLEXITY_API_KEY=pplx-...`) — same.
- **Hunter** (`HUNTER_API_KEY=...`) — same.
- **Prospeo** (`PROSPEO_API_KEY=...`) — same.
- **Google Maps / Places** (`GOOGLE_MAPS_API_KEY` /
  `GOOGLE_PLACES_API_KEY`) — same.
- **Email Bison** (`EMAIL_BISON_API_KEY=...`) — same.
- **Asana** (`ASANA_PAT=2/...`) — currently a personal access token.
  Either move to MA Asana workspace + re-issue PAT, or convert to an
  Asana App with OAuth.
- **Bloo / Mighty Networks tokens** — confirmed MA-owned. No action.

Already on MA: Clerk ✅, Resend ✅, Stripe (live keys are MA) ✅,
Vercel team `am-collective` ✅.

After rotation, run `vercel env pull` locally to refresh `.env.local`
so dev work doesn't keep hitting the old keys.
