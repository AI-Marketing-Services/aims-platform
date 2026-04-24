/**
 * Knowledge-base interface for the portal chatbot.
 *
 * This is a SCAFFOLD, not a full implementation. The plan:
 *   1. Adam answers interview questions, uploads to Mighty Networks
 *   2. A scheduled job pulls Mighty content → stores in a searchable form
 *      (embeddings in a vector column, or Algolia, or postgres full-text)
 *   3. The portal chatbot calls searchKnowledge() here to cite specific
 *      Mighty posts / links when answering member questions.
 *
 * Until that pipeline lands, searchKnowledge() returns an empty result so
 * the chatbot gracefully degrades to its base system prompt instead of
 * referencing content that doesn't exist. Build the tool calling now so
 * we can swap in a real implementation without touching the chat route.
 */

export type KnowledgeEntry = {
  id: string
  title: string
  url: string
  snippet: string
  source: "mighty" | "doc" | "faq"
  updatedAt: string
}

export type KnowledgeSearchResult = {
  entries: KnowledgeEntry[]
  query: string
}

/**
 * Search the Mighty + docs knowledge base for a query. Returns an empty
 * list when no index is configured — callers should handle this
 * gracefully (usually by falling back to the base system prompt).
 */
export async function searchKnowledge(query: string, _limit = 5): Promise<KnowledgeSearchResult> {
  // TODO: wire to real index once Mighty ingestion lands. For now:
  //   - Never throw (chatbot must not crash on missing index)
  //   - Return empty so callers can degrade cleanly
  return { entries: [], query }
}

/** Whether the knowledge base has any content indexed. */
export async function isKnowledgeReady(): Promise<boolean> {
  return false
}
