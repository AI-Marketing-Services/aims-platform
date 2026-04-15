import ReactPDF from "@react-pdf/renderer"
import { AIPlaybookDocument } from "./ai-playbook"
import React from "react"

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

  const stream = await ReactPDF.renderToStream(
    React.createElement(AIPlaybookDocument)
  )

  const chunks: Uint8Array[] = []
  for await (const chunk of stream) {
    chunks.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk))
  }

  cachedBuffer = Buffer.concat(chunks)
  cachedAt = now
  return cachedBuffer
}
