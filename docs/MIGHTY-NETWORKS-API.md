# Mighty Networks Admin API — Integration Reference

> **Base URL:** `https://api.mn.co/admin/v1/networks/{network_id}`
> **Auth:** `Authorization: Bearer {MIGHTY_API_TOKEN}`
> **Env Vars needed:** `MIGHTY_API_TOKEN`, `MIGHTY_NETWORK_ID`

## API Key Status

**ACTIVE** — API key confirmed working (2026-04-15).
- Network ID: `23411751`
- Subdomain: `aioperatorcollective.mn.co`
- Title: AI Operator Collective

### Live Community State (as of 2026-04-15)
- **Spaces:** Activity Feed (23411752), Chat (23411753), Curriculum & Playbooks (23411754), Calls & Events (23411755), Welcome (23459013)
- **Collections:** General (3085145)
- **Plans:** Community (1976896), Accelerator (1976897), Inner Circle (1976902)
- **Members:** Ryan Jones (39232460), Adam Wolfe (39303293)
- **Tags/Badges:** None yet (ready to be created via API)

---

## Content Creation Endpoints (HIGH VALUE)

These are the endpoints we can use to programmatically push AI Operator Collective content.

### 1. Posts & Articles

**Create Post/Article**
```
POST /admin/v1/networks/{network_id}/posts?notify={boolean}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `space_id` | integer | **Yes** | Space to create post in |
| `title` | string | **Yes** | Post title |
| `description` | string | No | Post body content (HTML/markdown) |
| `post_type` | string | No | `"article"` for long-form content |

**Response (201):**
```json
{
  "id": 1234,
  "title": "My New Post",
  "description": "Post body content",
  "post_type": "article",
  "status": "published",
  "permalink": "https://example.mn.co/posts/1234",
  "comments_enabled": true,
  "images": []
}
```

**Other Post Endpoints:**
- `GET /posts` — List all posts (paginated)
- `GET /posts/{post_id}` — Get single post
- `PUT /posts/{post_id}` — Update post
- `PATCH /posts/{post_id}` — Partial update
- `DELETE /posts/{post_id}` — Delete post

---

### 2. Course Content (Coursework)

**Create Lesson/Quiz/Section**
```
POST /admin/v1/networks/{network_id}/spaces/{space_id}/courseworks
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | **Yes** | `"lesson"`, `"quiz"`, or `"section"` |
| `parent_id` | integer | No | Parent section/overview ID (defaults to course overview) |
| `title` | string | No | Lesson/section title |
| `description` | string | No | Lesson body content |
| `status` | string | No | `"posted"`, `"hidden"`, `"pending"` (default: hidden) |
| `completion_criteria` | string | No | `"none"`, `"visited"`, `"button"`, `"video"`, `"minimum_correct_percentage"` |
| `unlocking_criteria` | string | No | `"none"`, `"sequential"`, `"time_from_course_join"`, `"scheduled_date"` |

**Response (201):**
```json
{
  "id": "1234",
  "space_id": 9999,
  "type": "lesson",
  "parent_id": 5678,
  "parent_type": "section",
  "title": "Introduction to Course Basics",
  "status": "posted",
  "position": 1,
  "completion_criteria": "visited",
  "unlocking_criteria": "sequential",
  "children_count": 0,
  "permalink": "https://network.mn.co/courseworks/1234"
}
```

**Other Coursework Endpoints:**
- `GET /spaces/{space_id}/courseworks` — List all coursework items
- `GET /spaces/{space_id}/courseworks/{id}` — Get single item
- `PUT /spaces/{space_id}/courseworks/{id}` — Update item
- `PATCH /spaces/{space_id}/courseworks/{id}` — Partial update
- `DELETE /spaces/{space_id}/courseworks/{id}` — Delete item

---

### 3. Spaces (Courses, Groups, Collections)

**Create Space**
```
POST /admin/v1/networks/{network_id}/spaces
```

| Field | Type | Required |
|-------|------|----------|
| `name` | string | **Yes** |

**Response (201):**
```json
{
  "id": 1234,
  "name": "Community Events",
  "collection_id": 5678
}
```

**Other Space Endpoints:**
- `GET /spaces` — List all spaces (paginated, `?page=&per_page=`)
- `GET /spaces/{space_id}` — Get single space
- `PUT /spaces/{space_id}` — Update space
- `PATCH /spaces/{space_id}` — Partial update
- `DELETE /spaces/{space_id}` — Delete space
- `GET /members/{member_id}/spaces` — Spaces for a member

---

### 4. Collections (Space Groups)

**Create Collection**
```
POST /admin/v1/networks/{network_id}/collections
```

| Field | Type | Required |
|-------|------|----------|
| `name` | string | **Yes** |
| `description` | string | No |
| `visible_to_members` | boolean | No |

**Other Collection Endpoints:**
- `GET /collections` — List all collections
- `GET /collections/{id}` — Get single collection
- `PUT /collections/{id}` — Update collection
- `PATCH /collections/{id}` — Partial update
- `DELETE /collections/{id}` — Delete collection
- `PUT /collections/{id}/reorder` — Reorder spaces within

---

### 5. Events

**Create Event**
```
POST /admin/v1/networks/{network_id}/events
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | **Yes** | Event title |
| `starts_at` | ISO8601 | **Yes** | Start time |
| `ends_at` | ISO8601 | **Yes** | End time |
| `event_type` | string | **Yes** | e.g. `"online_meeting"` |
| `space_id` | integer | **Yes** | Space to create in |
| `description` | string | No | Event description |
| `link` | string | No | External link (Zoom, etc.) |
| `location` | string | No | Physical location |
| `time_zone` | string | No | IANA timezone |
| `rsvp_enabled` | boolean | No | Default: true |
| `post_in_feed` | boolean | No | Default: true |
| `frequency` | string | No | `"daily"`, `"weekly"`, `"monthly"`, `"yearly"` |
| `interval` | integer | No | Recurrence interval |
| `recurrence_count` | integer | No | How many times to recur |

**Other Event Endpoints:**
- `GET /events` — List events (paginated)
- `GET /events/{id}` — Get event details
- `PUT /events/{id}` — Update event
- `PATCH /events/{id}` — Partial update
- `DELETE /events/{id}` — Delete event

---

### 6. Polls & Questions

**Create Poll/Question**
```
POST /admin/v1/networks/{network_id}/polls
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `poll_type` | string | **Yes** | `"multiple_choice"`, `"hot_cold"`, `"percentage"`, `"question"` |
| `space_id` | integer | **Yes** | Space to create in |
| `title` | string | **Yes** | Poll question |
| `description` | string | No | Additional context |
| `choices` | string[] | Conditional | Required for multiple_choice, hot_cold, percentage |
| `notify` | boolean | No | Notify members |

**Other Poll Endpoints:**
- `GET /polls` — List polls (paginated)
- `GET /polls/{id}` — Get poll details
- `PUT /polls/{id}` — Update poll
- `PATCH /polls/{id}` — Partial update
- `DELETE /polls/{id}` — Delete poll

---

### 7. Comments

**Create Comment**
```
POST /admin/v1/networks/{network_id}/posts/{post_id}/comments
```

| Field | Type | Required |
|-------|------|----------|
| `text` | string | **Yes** |
| `reply_to_id` | integer | No (for threaded replies) |

**Other Comment Endpoints:**
- `GET /posts/{post_id}/comments` — List comments
- `GET /posts/{post_id}/comments/{id}` — Get comment
- `DELETE /posts/{post_id}/comments/{id}` — Delete comment

---

### 8. Assets (Images & Files)

**Upload Asset**
```
POST /admin/v1/networks/{network_id}/assets
Content-Type: multipart/form-data
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `asset_style` | string (enum) | **Yes** | See enum values below |
| `asset_file` | binary | No* | File upload |
| `source_url` | URL | No* | URL to download from |

*One of `asset_file` or `source_url` required.

**asset_style values:** `avatar`, `thumbnail`, `square_thumbnail`, `post_description`, `post`, `comment`, `file`, `header`, `cover`, `course_video`, `video`, `landing_page_background`, `landing_page_description`, `space_avatar`, `space_description`, `seo_image`, and many more.

**Response (201):**
```json
{
  "id": "1234",
  "url": "https://...",
  "type": "image/png",
  "name": "my-image.png"
}
```

---

## Member Management Endpoints

### Members
- `POST /members` — Create new member (email, name)
- `GET /members` — List all members (paginated)
- `GET /members/{id}` — Get member by ID
- `GET /members/email/{email}` — Get member by email
- `PUT /members/{id}/role` — Update member role
- `POST /spaces/{space_id}/members` — Add member to space
- `DELETE /spaces/{space_id}/members/{id}` — Remove from space
- `POST /members/{id}/ban` — Ban user
- `DELETE /members/{id}/remove` — Remove (can rejoin)
- `DELETE /members/{id}` — Soft delete account

### Invites
- `POST /invites` — Send invite email
  - Required: `recipient_email`
  - Optional: `recipient_first_name`, `recipient_last_name`
- `POST /plans/{plan_id}/invites` — Invite to specific plan
- `GET /invites` — List invites
- `POST /invites/{id}/resend` — Resend invite
- `PUT /invites/{id}/revoke` — Revoke invite
- `DELETE /invites/{id}` — Delete invite

---

## Engagement & Gamification Endpoints

### Tags
- `POST /tags` — Create tag (`title` required, optional `description`, `color`)
- `GET /tags` — List all tags
- `POST /members/{id}/tags` — Add tag to member
- `DELETE /members/{id}/tags/{tag_id}` — Remove tag from member

### Badges
- `POST /badges` — Create badge (`title`, `avatar_id` required, optional `description`, `color`)
- `GET /badges` — List all badges
- `POST /members/{id}/badges` — Add badge to member
- `DELETE /members/{id}/badges/{badge_id}` — Remove badge

### Reactions
- `POST /posts/{post_id}/reactions` — React to post
- `POST /posts/{post_id}/comments/{comment_id}/reactions` — React to comment
- `DELETE` variants for removing reactions

### RSVPs
- `POST /events/{event_id}/rsvps` — RSVP to event
- `GET /events/{event_id}/rsvps` — List RSVPs
- `PUT /events/{event_id}/rsvps/{id}` — Update RSVP
- `DELETE /events/{event_id}/rsvps/{id}` — Cancel RSVP

---

## Data & Analytics Endpoints

### Custom Fields
- `POST /custom_fields` — Create custom field
- `GET /custom_fields` — List fields
- `PUT /custom_fields/{id}` — Update field
- `DELETE /custom_fields/{id}` — Delete field

### Custom Field Answers
- `POST /members/{id}/answers` — Set member's response
- `GET /members/{id}/answers` — Get responses
- `DELETE /members/{id}/answers/{id}` — Delete response

### Plans & Subscriptions
- `GET /plans` — List all plans
- `GET /plans/{id}` — Plan details
- `GET /members/{id}/plans` — Member's plans
- `GET /subscriptions` — List subscriptions
- `GET /subscriptions/{id}` — Subscription details
- `POST /subscriptions/{id}/cancel` — Cancel subscription

### Purchases
- `GET /purchases` — List purchases
- `GET /purchases/{id}` — Purchase details
- `DELETE /purchases/{id}` — Revoke purchase access

### Network Details
- `GET /` — Network info (title, subtitle, purpose, description)

### Abuse Reports
- `GET /abuse_reports` — List reports

---

## Webhook Events (Inbound)

These fire when things happen in the community — useful for syncing to our platform.

### Member Events
- `MemberJoined` / `MemberLeft` / `MemberUpdated`
- `MemberJoinRequested` / `MemberPurchased` / `MemberPurchaseRequested`
- `MemberPlanChanged` / `MemberRemovedFromPlan`
- `MemberSubscriptionCanceled` / `MemberSubscriptionRenewed`
- `MemberBadgeAdded` / `MemberBadgeRemoved`
- `MemberTagAdded` / `MemberTagRemoved`
- `MemberAmbassadorLeveledUp`
- `MemberCourseProgressStarted` / `MemberCourseProgressUpdated` / `MemberCourseProgressCompleted`
- `InviteRequested`

### Content Events
- `PostCreated` / `PostUpdated`
- `ArticleCreated` / `ArticleUpdated`
- `CommentCreated`
- `ReactionCreated` / `ReactionDeleted`
- `EventCreated` / `EventUpdated`
- `RsvpCreated` / `RsvpUpdated` / `RsvpDeleted`

### Poll Events
- `MultipleChoicePollCreated` / `MultipleChoicePollUpdated`
- `HotColdPollCreated` / `HotColdPollUpdated`
- `PercentagePollCreated` / `PercentagePollUpdated`
- `QuestionCreated` / `QuestionUpdated`

### Other
- `CustomFieldResponseCreated` / `CustomFieldResponseUpdated` / `CustomFieldResponseRemoved`
- `ReportedContentCreated`
- `GiftLeaderboardUpdated`

---

## Rate Limits

- Standard: 100 requests/minute
- Premium: 300 requests/minute

---

## Pagination

All list endpoints support:
- `?page=1&per_page=25` (max 100 per page)

---

## Error Codes

| Code | Meaning |
|------|---------|
| 401 | Invalid/expired/revoked token |
| 403 | Valid token, insufficient permissions |
| 404 | Resource not found |
| 422 | Validation error |
| 429 | Rate limited |

---

## Integration Architecture for AIMS Platform

### What We Can Automate

1. **Content Pipeline** — Generate playbook content with Claude → push as articles/posts to community spaces
2. **Course Builder** — Create course spaces → add sections → add lessons with AI-generated content
3. **Event Automation** — Schedule recurring community events (weekly calls, workshops)
4. **Member Onboarding** — Auto-invite new AIMS clients → tag them → add to appropriate plans/spaces
5. **Engagement** — Create polls/questions to drive community interaction
6. **Badge System** — Award completion badges as members finish courses
7. **Webhook Sync** — Listen for member events to sync with AIMS CRM/portal
8. **Asset Management** — Upload branded images/PDFs for course materials

### Suggested API Route Structure

```
app/api/mighty/
├── network/route.ts          — GET network details
├── spaces/route.ts           — CRUD spaces
├── posts/route.ts            — CRUD posts/articles
├── courseworks/route.ts      — CRUD lessons/quizzes/sections
├── events/route.ts           — CRUD events
├── polls/route.ts            — CRUD polls
├── members/route.ts          — Member management
├── invites/route.ts          — Invite management
├── tags/route.ts             — Tag management
├── badges/route.ts           — Badge management
├── assets/route.ts           — File/image uploads
└── webhooks/route.ts         — Inbound webhook handler
```

### Env Vars

```bash
MIGHTY_API_TOKEN=mn_2448dfad6d2cd083dc4fa1959052e543829fdd71132342bbf34b2f83db3792f8
MIGHTY_NETWORK_ID=23411751
```

### Integration Files

```
src/lib/mighty/
├── index.ts              — API client (all CRUD operations)
├── types.ts              — TypeScript type definitions
└── content-pipeline.ts   — Course builder, article publisher, event creator

src/app/api/admin/mighty/
├── route.ts              — GET community snapshot (spaces, members, etc.)
├── deploy-courses/route.ts — POST deploy course modules
└── publish/route.ts      — POST publish articles/posts/events/polls

src/app/api/webhooks/mighty/
└── route.ts              — Inbound webhook handler
```
