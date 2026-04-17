/**
 * Mighty Networks Admin API integration
 * Docs: https://docs.mightynetworks.com/admin-api
 *
 * Network: AI Operator Collective (ID: 23411751)
 * Subdomain: aioperatorcollective.mn.co
 */

import { logger } from "@/lib/logger"
import type {
  MightyNetwork,
  MightySpace,
  CreateSpaceParams,
  MightyCollection,
  CreateCollectionParams,
  MightyPost,
  CreatePostParams,
  UpdatePostParams,
  MightyCoursework,
  CreateCourseworkParams,
  UpdateCourseworkParams,
  MightyEvent,
  CreateEventParams,
  MightyPoll,
  CreatePollParams,
  MightyComment,
  CreateCommentParams,
  MightyMember,
  CreateMemberParams,
  MightyInvite,
  CreateInviteParams,
  MightyTag,
  CreateTagParams,
  MightyBadge,
  CreateBadgeParams,
  MightyAsset,
  AssetStyle,
  MightyPlan,
  PaginatedResponse,
} from "./types"

// ─── Configuration ───────────────────────────────────────

const MIGHTY_API_BASE = "https://api.mn.co/admin/v1"
const MIGHTY_TIMEOUT_MS = 15_000
const MIGHTY_MAX_RETRIES = 2

function getConfig(): { token: string; networkId: string } | null {
  const token = process.env.MIGHTY_API_TOKEN
  const networkId = process.env.MIGHTY_NETWORK_ID
  if (!token || !networkId) {
    logger.warn("[Mighty] Missing MIGHTY_API_TOKEN or MIGHTY_NETWORK_ID", {
      action: "config_check",
    })
    return null
  }
  return { token, networkId }
}

function basePath(): string | null {
  const config = getConfig()
  if (!config) return null
  return `${MIGHTY_API_BASE}/networks/${config.networkId}`
}

// ─── HTTP Client ─────────────────────────────────────────

// An errorBag lets callers see the actual Mighty-side failure reason
// (e.g. "401 Unauthorized", "404 plan not found") instead of a null return.
export type MightyErrorBag = { status?: number; message: string }

async function mightyFetch<T>(
  path: string,
  options: RequestInit & { context: string; errorBag?: MightyErrorBag }
): Promise<T | null> {
  const config = getConfig()
  if (!config) {
    if (options.errorBag) options.errorBag.message = "MIGHTY_API_TOKEN or MIGHTY_NETWORK_ID not configured"
    return null
  }

  const url = `${MIGHTY_API_BASE}/networks/${config.networkId}${path}`
  const { context, errorBag, ...fetchOpts } = options

  for (let attempt = 0; attempt <= MIGHTY_MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), MIGHTY_TIMEOUT_MS)

      const res = await fetch(url, {
        ...fetchOpts,
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
          ...fetchOpts.headers,
        },
      })

      clearTimeout(timeoutId)

      // Retry on rate limit
      if (res.status === 429 && attempt < MIGHTY_MAX_RETRIES) {
        const retryAfter = parseInt(res.headers.get("retry-after") ?? "2", 10)
        const delayMs = Math.min(retryAfter * 1000, 5000) * (attempt + 1)
        logger.warn(`[Mighty] Rate limited, retrying in ${delayMs}ms`, {
          action: context,
        })
        await new Promise((resolve) => setTimeout(resolve, delayMs))
        continue
      }

      if (!res.ok) {
        const body = await res.text()
        logger.error(`[Mighty] ${context} failed (${res.status})`, body, {
          action: context,
          endpoint: path,
        })
        if (errorBag) {
          errorBag.status = res.status
          errorBag.message = extractMightyError(body, res.status, res.statusText)
        }
        return null
      }

      return (await res.json()) as T
    } catch (err) {
      const isTimeout = err instanceof DOMException && err.name === "AbortError"
      const isNetworkError = err instanceof TypeError

      if ((isTimeout || isNetworkError) && attempt < MIGHTY_MAX_RETRIES) {
        const delayMs = 1000 * (attempt + 1)
        logger.warn(
          `[Mighty] ${isTimeout ? "Timeout" : "Network error"}, retrying in ${delayMs}ms`,
          { action: context }
        )
        await new Promise((resolve) => setTimeout(resolve, delayMs))
        continue
      }

      logger.error(`[Mighty] ${context} failed`, err, { action: context })
      if (errorBag) {
        errorBag.message = isTimeout
          ? "Mighty API timeout (15s)"
          : isNetworkError
          ? "Network error reaching Mighty API"
          : err instanceof Error
          ? err.message
          : "Unknown error"
      }
      return null
    }
  }

  return null
}

function extractMightyError(body: string, status: number, statusText: string): string {
  // Mighty returns JSON errors like {"error": "..."} or {"message": "..."} or
  // {"errors": [{"detail": "..."}]}. Fall back to raw body snippet.
  try {
    const parsed = JSON.parse(body) as Record<string, unknown>
    const candidate =
      (typeof parsed.error === "string" && parsed.error) ||
      (typeof parsed.message === "string" && parsed.message) ||
      (Array.isArray(parsed.errors) &&
        parsed.errors[0] &&
        (((parsed.errors[0] as Record<string, unknown>).detail as string) ||
          ((parsed.errors[0] as Record<string, unknown>).message as string)))
    if (candidate) return `${status}: ${candidate}`
  } catch {
    // not JSON
  }
  const snippet = body.slice(0, 200).replace(/\s+/g, " ").trim()
  return snippet ? `${status} ${statusText}: ${snippet}` : `${status} ${statusText}`
}

/** Multipart form data variant for asset uploads */
async function mightyUpload(
  path: string,
  formData: FormData,
  context: string
): Promise<MightyAsset | null> {
  const config = getConfig()
  if (!config) return null

  const url = `${MIGHTY_API_BASE}/networks/${config.networkId}${path}`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30_000)

    const res = await fetch(url, {
      method: "POST",
      body: formData,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      const body = await res.text()
      logger.error(`[Mighty] ${context} upload failed (${res.status})`, body, {
        action: context,
      })
      return null
    }

    return (await res.json()) as MightyAsset
  } catch (err) {
    logger.error(`[Mighty] ${context} upload failed`, err, { action: context })
    return null
  }
}

// ─── Pagination Helper ───────────────────────────────────

async function fetchAllPages<T>(
  path: string,
  context: string,
  perPage = 100
): Promise<T[]> {
  const allItems: T[] = []
  let page = 1

  while (true) {
    const separator = path.includes("?") ? "&" : "?"
    const result = await mightyFetch<PaginatedResponse<T>>(
      `${path}${separator}page=${page}&per_page=${perPage}`,
      { method: "GET", context: `${context} (page ${page})` }
    )

    if (!result || result.items.length === 0) break

    allItems.push(...result.items)

    if (result.items.length < perPage) break
    page++
  }

  return allItems
}

// ─── Network ─────────────────────────────────────────────

export async function getNetwork(): Promise<MightyNetwork | null> {
  return mightyFetch<MightyNetwork>("/", {
    method: "GET",
    context: "getNetwork",
  })
}

// ─── Spaces ──────────────────────────────────────────────

export async function listSpaces(): Promise<MightySpace[]> {
  return fetchAllPages<MightySpace>("/spaces", "listSpaces")
}

export async function getSpace(spaceId: number): Promise<MightySpace | null> {
  return mightyFetch<MightySpace>(`/spaces/${spaceId}`, {
    method: "GET",
    context: "getSpace",
  })
}

export async function createSpace(
  params: CreateSpaceParams
): Promise<MightySpace | null> {
  return mightyFetch<MightySpace>("/spaces", {
    method: "POST",
    body: JSON.stringify(params),
    context: "createSpace",
  })
}

export async function updateSpace(
  spaceId: number,
  params: Partial<CreateSpaceParams>
): Promise<MightySpace | null> {
  return mightyFetch<MightySpace>(`/spaces/${spaceId}`, {
    method: "PUT",
    body: JSON.stringify(params),
    context: "updateSpace",
  })
}

export async function deleteSpace(spaceId: number): Promise<boolean> {
  const result = await mightyFetch<Record<string, unknown>>(
    `/spaces/${spaceId}`,
    { method: "DELETE", context: "deleteSpace" }
  )
  return result !== null
}

// ─── Collections ─────────────────────────────────────────

export async function listCollections(): Promise<MightyCollection[]> {
  return fetchAllPages<MightyCollection>("/collections", "listCollections")
}

export async function createCollection(
  params: CreateCollectionParams
): Promise<MightyCollection | null> {
  return mightyFetch<MightyCollection>("/collections", {
    method: "POST",
    body: JSON.stringify(params),
    context: "createCollection",
  })
}

export async function updateCollection(
  collectionId: number,
  params: Partial<CreateCollectionParams>
): Promise<MightyCollection | null> {
  return mightyFetch<MightyCollection>(`/collections/${collectionId}`, {
    method: "PUT",
    body: JSON.stringify(params),
    context: "updateCollection",
  })
}

export async function deleteCollection(collectionId: number): Promise<boolean> {
  const result = await mightyFetch<Record<string, unknown>>(
    `/collections/${collectionId}`,
    { method: "DELETE", context: "deleteCollection" }
  )
  return result !== null
}

// ─── Posts & Articles ────────────────────────────────────

export async function listPosts(): Promise<MightyPost[]> {
  return fetchAllPages<MightyPost>("/posts", "listPosts")
}

export async function getPost(postId: number): Promise<MightyPost | null> {
  return mightyFetch<MightyPost>(`/posts/${postId}`, {
    method: "GET",
    context: "getPost",
  })
}

export async function createPost(
  params: CreatePostParams,
  notify = false
): Promise<MightyPost | null> {
  return mightyFetch<MightyPost>(`/posts?notify=${notify}`, {
    method: "POST",
    body: JSON.stringify(params),
    context: "createPost",
  })
}

export async function updatePost(
  postId: number,
  params: UpdatePostParams
): Promise<MightyPost | null> {
  return mightyFetch<MightyPost>(`/posts/${postId}`, {
    method: "PUT",
    body: JSON.stringify(params),
    context: "updatePost",
  })
}

export async function deletePost(postId: number): Promise<boolean> {
  const result = await mightyFetch<Record<string, unknown>>(
    `/posts/${postId}`,
    { method: "DELETE", context: "deletePost" }
  )
  return result !== null
}

// ─── Coursework (Lessons, Quizzes, Sections) ─────────────

export async function listCoursework(
  spaceId: number
): Promise<MightyCoursework[]> {
  return fetchAllPages<MightyCoursework>(
    `/spaces/${spaceId}/courseworks`,
    "listCoursework"
  )
}

export async function getCoursework(
  spaceId: number,
  courseworkId: number
): Promise<MightyCoursework | null> {
  return mightyFetch<MightyCoursework>(
    `/spaces/${spaceId}/courseworks/${courseworkId}`,
    { method: "GET", context: "getCoursework" }
  )
}

export async function createCoursework(
  spaceId: number,
  params: CreateCourseworkParams
): Promise<MightyCoursework | null> {
  return mightyFetch<MightyCoursework>(`/spaces/${spaceId}/courseworks`, {
    method: "POST",
    body: JSON.stringify(params),
    context: "createCoursework",
  })
}

export async function updateCoursework(
  spaceId: number,
  courseworkId: number,
  params: UpdateCourseworkParams
): Promise<MightyCoursework | null> {
  return mightyFetch<MightyCoursework>(
    `/spaces/${spaceId}/courseworks/${courseworkId}`,
    {
      method: "PUT",
      body: JSON.stringify(params),
      context: "updateCoursework",
    }
  )
}

export async function deleteCoursework(
  spaceId: number,
  courseworkId: number
): Promise<boolean> {
  const result = await mightyFetch<Record<string, unknown>>(
    `/spaces/${spaceId}/courseworks/${courseworkId}`,
    { method: "DELETE", context: "deleteCoursework" }
  )
  return result !== null
}

// ─── Events ──────────────────────────────────────────────

export async function listEvents(): Promise<MightyEvent[]> {
  return fetchAllPages<MightyEvent>("/events", "listEvents")
}

export async function createEvent(
  params: CreateEventParams
): Promise<MightyEvent | null> {
  return mightyFetch<MightyEvent>("/events", {
    method: "POST",
    body: JSON.stringify(params),
    context: "createEvent",
  })
}

export async function updateEvent(
  eventId: number,
  params: Partial<CreateEventParams>
): Promise<MightyEvent | null> {
  return mightyFetch<MightyEvent>(`/events/${eventId}`, {
    method: "PUT",
    body: JSON.stringify(params),
    context: "updateEvent",
  })
}

export async function deleteEvent(eventId: number): Promise<boolean> {
  const result = await mightyFetch<Record<string, unknown>>(
    `/events/${eventId}`,
    { method: "DELETE", context: "deleteEvent" }
  )
  return result !== null
}

// ─── Polls & Questions ───────────────────────────────────

export async function listPolls(): Promise<MightyPoll[]> {
  return fetchAllPages<MightyPoll>("/polls", "listPolls")
}

export async function createPoll(
  params: CreatePollParams
): Promise<MightyPoll | null> {
  return mightyFetch<MightyPoll>("/polls", {
    method: "POST",
    body: JSON.stringify(params),
    context: "createPoll",
  })
}

export async function deletePoll(pollId: number): Promise<boolean> {
  const result = await mightyFetch<Record<string, unknown>>(
    `/polls/${pollId}`,
    { method: "DELETE", context: "deletePoll" }
  )
  return result !== null
}

// ─── Comments ────────────────────────────────────────────

export async function listComments(
  postId: number
): Promise<MightyComment[]> {
  return fetchAllPages<MightyComment>(
    `/posts/${postId}/comments`,
    "listComments"
  )
}

export async function createComment(
  postId: number,
  params: CreateCommentParams
): Promise<MightyComment | null> {
  return mightyFetch<MightyComment>(`/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify(params),
    context: "createComment",
  })
}

export async function deleteComment(
  postId: number,
  commentId: number
): Promise<boolean> {
  const result = await mightyFetch<Record<string, unknown>>(
    `/posts/${postId}/comments/${commentId}`,
    { method: "DELETE", context: "deleteComment" }
  )
  return result !== null
}

// ─── Members ─────────────────────────────────────────────

export async function listMembers(): Promise<MightyMember[]> {
  return fetchAllPages<MightyMember>("/members", "listMembers")
}

export async function getMember(memberId: number): Promise<MightyMember | null> {
  return mightyFetch<MightyMember>(`/members/${memberId}`, {
    method: "GET",
    context: "getMember",
  })
}

export async function getMemberByEmail(
  email: string
): Promise<MightyMember | null> {
  return mightyFetch<MightyMember>(`/members/email/${encodeURIComponent(email)}`, {
    method: "GET",
    context: "getMemberByEmail",
  })
}

export async function createMember(
  params: CreateMemberParams
): Promise<MightyMember | null> {
  return mightyFetch<MightyMember>("/members", {
    method: "POST",
    body: JSON.stringify(params),
    context: "createMember",
  })
}

export async function addMemberToSpace(
  spaceId: number,
  memberId: number
): Promise<boolean> {
  const result = await mightyFetch<Record<string, unknown>>(
    `/spaces/${spaceId}/members`,
    {
      method: "POST",
      body: JSON.stringify({ member_id: memberId }),
      context: "addMemberToSpace",
    }
  )
  return result !== null
}

export async function removeMemberFromSpace(
  spaceId: number,
  memberId: number
): Promise<boolean> {
  const result = await mightyFetch<Record<string, unknown>>(
    `/spaces/${spaceId}/members/${memberId}`,
    { method: "DELETE", context: "removeMemberFromSpace" }
  )
  return result !== null
}

// ─── Invites ─────────────────────────────────────────────

export async function listInvites(): Promise<MightyInvite[]> {
  return fetchAllPages<MightyInvite>("/invites", "listInvites")
}

export async function createInvite(
  params: CreateInviteParams
): Promise<MightyInvite | null> {
  return mightyFetch<MightyInvite>("/invites", {
    method: "POST",
    body: JSON.stringify(params),
    context: "createInvite",
  })
}

export async function inviteToPlan(
  planId: number,
  params: CreateInviteParams,
  errorBag?: MightyErrorBag
): Promise<MightyInvite | null> {
  return mightyFetch<MightyInvite>(`/plans/${planId}/invites`, {
    method: "POST",
    body: JSON.stringify(params),
    context: "inviteToPlan",
    errorBag,
  })
}

export async function resendInvite(
  inviteId: number,
  errorBag?: MightyErrorBag
): Promise<boolean> {
  const result = await mightyFetch<Record<string, unknown>>(
    `/invites/${inviteId}/resend`,
    { method: "POST", context: "resendInvite", errorBag }
  )
  return result !== null
}

// ─── Tags ────────────────────────────────────────────────

export async function listTags(): Promise<MightyTag[]> {
  return fetchAllPages<MightyTag>("/tags", "listTags")
}

export async function createTag(
  params: CreateTagParams
): Promise<MightyTag | null> {
  return mightyFetch<MightyTag>("/tags", {
    method: "POST",
    body: JSON.stringify(params),
    context: "createTag",
  })
}

export async function addTagToMember(
  memberId: number,
  tagId: number
): Promise<boolean> {
  const result = await mightyFetch<Record<string, unknown>>(
    `/members/${memberId}/tags`,
    {
      method: "POST",
      body: JSON.stringify({ tag_id: tagId }),
      context: "addTagToMember",
    }
  )
  return result !== null
}

export async function removeTagFromMember(
  memberId: number,
  tagId: number
): Promise<boolean> {
  const result = await mightyFetch<Record<string, unknown>>(
    `/members/${memberId}/tags/${tagId}`,
    { method: "DELETE", context: "removeTagFromMember" }
  )
  return result !== null
}

// ─── Badges ──────────────────────────────────────────────

export async function listBadges(): Promise<MightyBadge[]> {
  return fetchAllPages<MightyBadge>("/badges", "listBadges")
}

export async function createBadge(
  params: CreateBadgeParams
): Promise<MightyBadge | null> {
  return mightyFetch<MightyBadge>("/badges", {
    method: "POST",
    body: JSON.stringify(params),
    context: "createBadge",
  })
}

export async function addBadgeToMember(
  memberId: number,
  badgeId: number
): Promise<boolean> {
  const result = await mightyFetch<Record<string, unknown>>(
    `/members/${memberId}/badges`,
    {
      method: "POST",
      body: JSON.stringify({ badge_id: badgeId }),
      context: "addBadgeToMember",
    }
  )
  return result !== null
}

export async function removeBadgeFromMember(
  memberId: number,
  badgeId: number
): Promise<boolean> {
  const result = await mightyFetch<Record<string, unknown>>(
    `/members/${memberId}/badges/${badgeId}`,
    { method: "DELETE", context: "removeBadgeFromMember" }
  )
  return result !== null
}

// ─── Assets ──────────────────────────────────────────────

export async function uploadAsset(
  assetStyle: AssetStyle,
  file: Blob,
  fileName: string
): Promise<MightyAsset | null> {
  const formData = new FormData()
  formData.append("asset_style", assetStyle)
  formData.append("asset_file", file, fileName)
  return mightyUpload("/assets", formData, "uploadAsset")
}

export async function uploadAssetFromUrl(
  assetStyle: AssetStyle,
  sourceUrl: string
): Promise<MightyAsset | null> {
  const formData = new FormData()
  formData.append("asset_style", assetStyle)
  formData.append("source_url", sourceUrl)
  return mightyUpload("/assets", formData, "uploadAssetFromUrl")
}

// ─── Plans ───────────────────────────────────────────────

export async function listPlans(): Promise<MightyPlan[]> {
  return fetchAllPages<MightyPlan>("/plans", "listPlans")
}

export async function getPlan(
  planId: number,
  errorBag?: MightyErrorBag
): Promise<MightyPlan | null> {
  return mightyFetch<MightyPlan>(`/plans/${planId}`, {
    method: "GET",
    context: "getPlan",
    errorBag,
  })
}

export async function addMemberToPlan(
  planId: number,
  memberId: number
): Promise<boolean> {
  const result = await mightyFetch<Record<string, unknown>>(
    `/plans/${planId}/members`,
    {
      method: "POST",
      body: JSON.stringify({ member_id: memberId }),
      context: "addMemberToPlan",
    }
  )
  return result !== null
}

// ─── Convenience: Known IDs ──────────────────────────────
// These are the live IDs from the AI Operator Collective network.

export const MIGHTY_IDS = {
  network: 23411751,
  collections: {
    general: 3085145,
  },
  spaces: {
    activityFeed: 23411752,
    chat: 23411753,
    curriculumPlaybooks: 23411754,
    callsEvents: 23411755,
    welcome: 23459013,
  },
  plans: {
    community: 1976896,
    accelerator: 1976897,
    innerCircle: 1976902,
  },
  members: {
    ryan: 39232460,
    adam: 39303293,
  },
} as const
