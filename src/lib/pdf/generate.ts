import { buildAIPlaybookPDF } from "./ai-playbook"

let cachedBuffer: Buffer | null = null
let cachedAt = 0
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

/**
 * Generate the AI Playbook PDF as a Buffer.
 * Caches the result in memory for 1 hour since content is static.
 */
export async function generateAIPlaybookPDF(): Promise<Buffer> {
  const now = Date.now()
  if (cachedBuffer && now - cachedAt < CACHE_TTL_MS) {
    return cachedBuffer
  }

  cachedBuffer = await buildAIPlaybookPDF()
  cachedAt = now
  return cachedBuffer
}
