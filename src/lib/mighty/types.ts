/**
 * Mighty Networks Admin API — TypeScript type definitions
 * Docs: https://docs.mightynetworks.com/admin-api
 */

// ─── Network ─────────────────────────────────────────────

export interface MightyNetwork {
  id: number
  created_at: string
  updated_at: string
  subdomain: string
  title: string
  subtitle: string | null
  purpose: string | null
  description: string | null
}

// ─── Spaces ──────────────────────────────────────────────

export interface MightySpace {
  id: number
  created_at: string
  updated_at: string
  name: string
  collection_id: number | null
}

export interface CreateSpaceParams {
  name: string
}

// ─── Collections ─────────────────────────────────────────

export interface MightyCollection {
  id: number
  created_at: string
  updated_at: string
  name: string
  description: string | null
  visible_to_members: boolean
  position: number
  explorable: boolean
}

export interface CreateCollectionParams {
  name: string
  description?: string
  visible_to_members?: boolean
}

// ─── Posts & Articles ────────────────────────────────────

export interface MightyPost {
  id: number
  created_at: string
  updated_at: string
  creator_id: number
  space_id: number
  title: string
  description: string
  summary: string
  post_type: string
  status: string
  published_at: string
  last_activity_at: string
  content_type: string
  comments_enabled: boolean
  images: (string | null)[]
  permalink: string
}

export interface CreatePostParams {
  space_id: number
  title: string
  description?: string
  post_type?: "article" | string
}

export interface UpdatePostParams {
  title?: string
  description?: string
  post_type?: string
}

// ─── Coursework (Lessons, Quizzes, Sections) ─────────────

export type CourseworkType = "lesson" | "quiz" | "section" | "overview"

export type CompletionCriteria =
  | "none"
  | "visited"
  | "button"
  | "video"
  | "minimum_correct_percentage"

export type UnlockingCriteria =
  | "none"
  | "sequential"
  | "time_from_course_join"
  | "scheduled_date"

export type CourseworkStatus = "posted" | "hidden" | "pending"

export interface MightyCoursework {
  id: number
  created_at: string
  updated_at: string
  space_id: number
  type: CourseworkType
  parent_id: number | null
  parent_type: string | null
  title: string
  description: string
  status: CourseworkStatus
  position: number
  completion_criteria: CompletionCriteria
  unlocking_criteria: UnlockingCriteria
  children_count: number
  permalink: string
}

export interface CreateCourseworkParams {
  type: CourseworkType
  parent_id?: number
  title?: string
  description?: string
  status?: CourseworkStatus
  completion_criteria?: CompletionCriteria
  unlocking_criteria?: UnlockingCriteria
}

export interface UpdateCourseworkParams {
  title?: string
  description?: string
  status?: CourseworkStatus
  completion_criteria?: CompletionCriteria
  unlocking_criteria?: UnlockingCriteria
}

// ─── Events ──────────────────────────────────────────────

export type EventFrequency = "daily" | "weekly" | "monthly" | "yearly"

export interface MightyEvent {
  id: number
  created_at: string
  updated_at: string
  post_type: "event"
  title: string
  description: string
  event_type: string
  starts_at: string
  ends_at: string
  time_zone: string
  location: string | null
  link: string | null
  rsvp_enabled: boolean
  rsvp_closed: boolean
  restricted_event: boolean
  post_in_feed: boolean
  frequency: EventFrequency | null
  interval: number | null
  permalink: string
  images: (string | null)[]
  creator: MightyMemberBrief
}

export interface CreateEventParams {
  title: string
  starts_at: string
  ends_at: string
  event_type: string
  space_id: number
  description?: string
  link?: string
  location?: string
  time_zone?: string
  rsvp_enabled?: boolean
  post_in_feed?: boolean
  frequency?: EventFrequency
  interval?: number
  recurrence_count?: number
  recur_until?: string
}

// ─── Polls ───────────────────────────────────────────────

export type PollType = "multiple_choice" | "hot_cold" | "percentage" | "question"

export interface MightyPoll {
  id: number
  created_at: string
  updated_at: string
  post_type: "poll"
  poll_type: string
  title: string
  description: string
  status: string
  published_at: string
  permalink: string
  comments_enabled: boolean
  choices: { id: string; text: string }[]
}

export interface CreatePollParams {
  poll_type: PollType
  space_id: number
  title: string
  description?: string
  choices?: string[]
  notify?: boolean
}

// ─── Comments ────────────────────────────────────────────

export interface MightyComment {
  id: number
  created_at: string
  updated_at: string
  targetable_id: number
  targetable_type: string
  text: string
  replyable: boolean
  depth: number
  cheer_count: number
  reply_count: number
  reply_to_id: number | null
  author_id: number
  space_id: number
  permalink: string
}

export interface CreateCommentParams {
  text: string
  reply_to_id?: number
}

// ─── Members ─────────────────────────────────────────────

export interface MightyMember {
  id: number
  created_at: string
  updated_at: string
  email: string
  first_name: string
  last_name: string
  time_zone: string | null
  location: string | null
  bio: string | null
  referral_count: number
  avatar: string | null
  categories: string | null
  permalink: string
  ambassador_level: string
}

export interface MightyMemberBrief {
  id: number
  created_at: string
  updated_at: string
  name: string
  email: string
  short_bio: string | null
  admin: boolean
}

export interface CreateMemberParams {
  email: string
  first_name?: string
  last_name?: string
}

// ─── Invites ─────────────────────────────────────────────

export interface MightyInvite {
  id: number
  recipient_email: string
  recipient_first_name: string | null
  recipient_last_name: string | null
  sender_id: number
  created_at: string
  updated_at: string
}

export interface CreateInviteParams {
  recipient_email: string
  recipient_first_name?: string
  recipient_last_name?: string
}

// ─── Tags ────────────────────────────────────────────────

export interface MightyTag {
  id: number
  created_at: string
  updated_at: string
  title: string
  description: string | null
  color: string | null
  custom_field_id: number | null
}

export interface CreateTagParams {
  title: string
  description?: string
  color?: string
}

// ─── Badges ──────────────────────────────────────────────

export interface MightyBadge {
  id: number
  created_at: string
  updated_at: string
  title: string
  description: string | null
  color: string | null
  custom_field_id: number | null
  avatar_url: string | null
}

export interface CreateBadgeParams {
  title: string
  avatar_id: number
  description?: string
  color?: string
}

// ─── Assets ──────────────────────────────────────────────

export type AssetStyle =
  | "avatar"
  | "thumbnail"
  | "square_thumbnail"
  | "post_description"
  | "post"
  | "comment"
  | "file"
  | "header"
  | "cover"
  | "course_video"
  | "video"
  | "landing_page_background"
  | "landing_page_description"
  | "space_avatar"
  | "space_description"
  | "seo_image"

export interface MightyAsset {
  id: string
  url: string
  type: string
  name: string
}

// ─── Plans ───────────────────────────────────────────────

export interface MightyPlan {
  id: number
  created_at: string
  updated_at: string
  name: string
  description: string
  status: string
  pricing_type: string
  visible_to_members: boolean
  external: boolean
  multiple: boolean
  permalink: string
}

// ─── Paginated Response ──────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[]
  links: {
    self: string
    next: string
  }
}

// ─── Webhook Events ──────────────────────────────────────

export type MightyWebhookEventType =
  | "MemberJoined"
  | "MemberLeft"
  | "MemberUpdated"
  | "MemberJoinRequested"
  | "MemberPurchased"
  | "MemberPurchaseRequested"
  | "MemberPlanChanged"
  | "MemberRemovedFromPlan"
  | "MemberSubscriptionCanceled"
  | "MemberSubscriptionRenewed"
  | "MemberBadgeAdded"
  | "MemberBadgeRemoved"
  | "MemberTagAdded"
  | "MemberTagRemoved"
  | "MemberAmbassadorLeveledUp"
  | "MemberCourseProgressStarted"
  | "MemberCourseProgressUpdated"
  | "MemberCourseProgressCompleted"
  | "PostCreated"
  | "PostUpdated"
  | "ArticleCreated"
  | "ArticleUpdated"
  | "CommentCreated"
  | "EventCreated"
  | "EventUpdated"

export interface MightyWebhookEvent {
  event_type: MightyWebhookEventType
  network_id: number
  data: Record<string, unknown>
  created_at: string
}
