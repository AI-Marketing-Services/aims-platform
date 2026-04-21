# Daily Signal — PRD

A minimal, Notion-style daily news digest. One card per topic, one link per story, one-sentence summary. All signal, no fluff. Delivered by email (and optional SMS) every morning, and viewable as a read-only page.

Built on two Karpathy primitives:
- **llm-council** (`github.com/karpathy/llm-council`) — multi-LLM peer-review + chairman synthesis to pick and summarize the day's top stories.
- **autoresearch** (`github.com/karpathy/autoresearch`) — propose → verify → keep/discard loop, adapted so a research agent iterates queries until coverage plateaus.

## 1. Goals & Non-Goals

**Goals**
- One glance = the day's most important stories per topic.
- < 60 seconds to read. < 8 stories per digest. One link each, one-sentence summary.
- Notion-style: mono/sans, lots of whitespace, flat cards, no chrome.
- User-configurable topics (free text: "Claude SDK releases", "EU AI regulation", "nuclear fusion breakthroughs").
- Daily delivery via email; SMS optional; webview at `/signal`.

**Non-Goals**
- No feed, no infinite scroll, no comments, no social.
- No full-article rendering (link out only).
- No multi-user sharing, no public pages (v1 is per-user private).

## 2. Users & Delivery

- `CLIENT` / `ADMIN` roles (Clerk). Gated behind auth.
- One digest per user per day. Idempotent — re-runs don't resend.
- Delivery channels keyed off existing `User.notifMarketingDigest`; add `notifSignalDigest` bool + `signalSmsOptIn` for text.

## 3. The Council + Autoresearch Pipeline

A single daily cron job at 06:00 user-TZ (MVP: one TZ, America/New_York) runs per user:

```
for each user:
  for each topic the user follows:
    [AUTORESEARCH LOOP]           # converge on a candidate pool
      propose queries (Claude)  →  search (Tavily) + scrape (Firecrawl)
      score coverage metric     →  keep new sources, discard dupes
      stop when Δcoverage < ε OR 3 iterations OR 45s wall-clock

    [LLM COUNCIL]                 # pick + summarize the top story
      stage 1: Sonnet, Haiku, Gemini each pick top-1 + write 1-sentence summary
      stage 2: each model peer-reviews the other two (anonymized)
      stage 3: Opus (chairman) synthesizes → final pick + 12-word headline + 20-word summary

  assemble digest → render email → send via Resend → write DigestRun row
```

**Autoresearch mapping** (news analog of train.py loop):
- Metric = `new_credible_sources_found` (dedup by canonical URL + title-embedding).
- "Keep/discard" = accept a proposed query if it surfaces ≥1 new source above credibility threshold.
- Hard cap: 3 iterations, 45s, $0.05 per topic — tight budget = lightweight.

**LLM Council mapping**:
- Council members: `claude-sonnet-4-6`, `claude-haiku-4-5`, `gemini-2.5-pro` (via existing `@ai-sdk/google`).
- Chairman: `claude-opus-4-7`.
- Peer review anonymized via `Model A/B/C` labels as in karpathy's repo.

## 4. Minimal Data Model (Prisma additions)

```prisma
model SignalTopic {
  id        String   @id @default(cuid())
  userId    String
  label     String    // "Claude SDK releases"
  query     String    // seed query; agent expands it
  enabled   Boolean  @default(true)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  @@index([userId, enabled])
}

model SignalDigestRun {
  id        String   @id @default(cuid())
  userId    String
  runDate   DateTime @db.Date         // idempotency key w/ userId
  items     Json      // [{topicId, headline, summary, url, source, publishedAt}]
  costUsd   Decimal  @db.Decimal(10,4)
  status    String    // "PENDING" | "SENT" | "FAILED"
  sentAt    DateTime?
  user      User     @relation(fields: [userId], references: [id])
  @@unique([userId, runDate])
}

// User model additions
notifSignalDigest  Boolean @default(false)
signalSmsOptIn     Boolean @default(false)
signalPhoneE164    String?
```

No article cache table in v1 — agent re-fetches daily. Simpler, and news goes stale anyway.

## 5. Files to Add / Modify

**New**
- `src/lib/signal/council.ts` — 3-stage council orchestration (stage1, peer-review, chairman).
- `src/lib/signal/autoresearch.ts` — iteration loop, coverage metric, dedup.
- `src/lib/signal/sources.ts` — Tavily + Firecrawl wrappers (thin; reuse existing clients).
- `src/lib/signal/render.ts` — Notion-style React Email template (one card per topic).
- `src/lib/signal/program.md` — **human-editable strategy file** (mirrors karpathy's `program.md`): source allowlist, credibility heuristics, tone rules. Loaded into every run's system prompt.
- `src/app/api/cron/signal-digest/route.ts` — cron entrypoint, `CRON_SECRET`-guarded.
- `src/app/api/signal/topics/route.ts` — CRUD for user topics.
- `src/app/(portal)/signal/page.tsx` — read-only view of today's digest.
- `src/app/(portal)/signal/settings/page.tsx` — topic list + channel prefs.
- `src/components/signal/TopicCard.tsx` — the one card component.
- `src/components/signal/TopicEditor.tsx` — tag-style input.

**Modify**
- `prisma/schema.prisma` — add models + User fields above.
- `vercel.json` — add cron `0 10 * * *` UTC (06:00 ET) → `/api/cron/signal-digest`.
- `.env.example` — add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` (SMS optional; skip if user is email-only).

**Reused as-is**
- Anthropic + Gemini SDKs, Tavily, Firecrawl, Resend, Clerk, `logCronExecution`, `ApiCostLog`, `EmailQueueItem` (optional — we can send directly for simplicity).

## 6. UI — Notion Style

One page, one column, max 560px. DM Sans body, Cormorant Garamond heading, DM Mono labels (per existing design system).

```
─────────────────────────────────────
  April 21, 2026
  SIGNAL  ·  8 stories  ·  4 topics
─────────────────────────────────────

  CLAUDE SDK RELEASES
  ─────
  Anthropic ships Agent SDK 2.1 with
  native MCP server registry.
  anthropic.com  →

  EU AI REGULATION
  ─────
  …
─────────────────────────────────────
```

- Topic label in DM Mono uppercase `text-xs` gold (#C4972A).
- Headline in Cormorant, 18px, cream.
- Summary in DM Sans, 14px, 70% opacity.
- Link = entire card tap target; external arrow glyph.
- No images, no icons, no author lines. One story per topic by default.

Email template mirrors this exactly (React Email, dark mode + light mode CSS).

## 7. Cost & Perf Budget

- Autoresearch: 3 iter × ~2k tokens Haiku = ~$0.002/topic.
- Council: 3 × Sonnet/Haiku/Gemini (~3k tokens) + Opus synth (~2k) = ~$0.04/topic.
- **Target: < $0.05/topic/day.** 4 topics × 30 days = < $6/user/month.
- Total cron wallclock/user: < 4 min for 5 topics, parallelized.

## 8. Rollout

1. **Phase 1 (MVP, ~1 day):** Schema + cron + council + autoresearch + email only. Admin-only. Hardcode 2 test users.
2. **Phase 2 (~½ day):** Portal UI (`/signal`, settings page, topic editor).
3. **Phase 3 (~½ day):** SMS via Twilio (first line + link only, 160 chars).
4. **Phase 4 (polish):** `program.md` editor in admin, cost dashboard, per-topic snooze.

## 9. Open Questions

- **SMS provider**: Twilio vs skip for v1? Recommend skip — email-only for MVP is simpler.
- **Timezone**: single TZ for MVP (ET) or per-user? Recommend single — `User.timezone` field can come later.
- **Chairman model**: Opus 4.7 is pricey; worth A/B vs Sonnet-as-chairman after week 1.
- **Topic limit**: cap at 5 topics/user on MVP to bound cost.

## 10. Success Metrics

- Open rate > 60% daily (signal test — are we delivering value).
- Time-to-read < 60s (mouse-move / tab-visible heuristic if we add analytics).
- Topic churn < 20%/month (users refining, not abandoning).
- Cost/user/month < $6.

---

### Sources
- Karpathy, llm-council — https://github.com/karpathy/llm-council
- Karpathy, autoresearch — https://github.com/karpathy/autoresearch
