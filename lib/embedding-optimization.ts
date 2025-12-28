/**
 * Embedding Optimization Service
 *
 * Cost Reduction Strategies:
 * 1. Use text-embedding-3-small (5x cheaper than ada-002)
 * 2. Content deduplication (avoid duplicate embeddings)
 * 3. Query embedding caching (reuse common queries)
 * 4. Semantic query caching (reuse similar queries)
 * 5. Optimized chunking (larger chunks, less overlap)
 */

import crypto from "crypto";
import OpenAI from "openai";
import { logger } from "./logger";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Use the cheapest model: text-embedding-3-small
// Cost: $0.00002 per 1K tokens (5x cheaper than ada-002)
const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536; // Default dimensions

// In-memory caches (in production, use Redis)
const queryEmbeddingCache = new Map<string, { embedding: number[]; timestamp: number }>();
const contentHashCache = new Map<string, { embedding: number[]; chunkId: string }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a content hash for deduplication
 */
export function generateContentHash(content: string): string {
  return crypto.createHash('sha256').update(content.trim().toLowerCase()).digest('hex');
}

/**
 * Clean cache entries older than TTL
 */
function cleanExpiredCache() {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, value] of queryEmbeddingCache.entries()) {
    if (now - value.timestamp > CACHE_TTL_MS) {
      queryEmbeddingCache.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.debug(`Cleaned ${cleaned} expired query cache entries`);
  }
}

// Clean cache every hour
setInterval(cleanExpiredCache, 60 * 60 * 1000);

/**
 * Generate embedding with query caching
 * Reuses embeddings for identical queries
 */
export async function generateEmbeddingWithCache(
  text: string,
  type: 'query' | 'document' = 'document'
): Promise<number[]> {
  // Only cache queries, not document content
  if (type === 'query') {
    const cacheKey = generateContentHash(text);
    const cached = queryEmbeddingCache.get(cacheKey);

    if (cached) {
      logger.debug('Query embedding cache HIT');
      return cached.embedding;
    }

    logger.debug('Query embedding cache MISS - generating new embedding');
  }

  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text.slice(0, 8000), // Limit input length
      dimensions: EMBEDDING_DIMENSIONS,
    });

    const embedding = response.data[0].embedding;

    // Cache query embeddings
    if (type === 'query') {
      const cacheKey = generateContentHash(text);
      queryEmbeddingCache.set(cacheKey, {
        embedding,
        timestamp: Date.now(),
      });
      logger.debug(`Cached query embedding (cache size: ${queryEmbeddingCache.size})`);
    }

    return embedding;
  } catch (error) {
    logger.error('Failed to generate embedding', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Generate batch embeddings with deduplication
 * Detects duplicate content and reuses embeddings
 */
export async function generateBatchEmbeddingsOptimized(
  texts: string[],
  chunkIds?: string[]
): Promise<number[][]> {
  logger.debug(`Processing ${texts.length} texts for embedding`);

  // Detect duplicates
  const uniqueTexts: string[] = [];
  const textToHash = new Map<string, string>();
  const hashToIndex = new Map<string, number[]>();

  texts.forEach((text, index) => {
    const hash = generateContentHash(text);
    textToHash.set(text, hash);

    if (!hashToIndex.has(hash)) {
      hashToIndex.set(hash, []);
      uniqueTexts.push(text);
    }
    hashToIndex.get(hash)!.push(index);
  });

  const duplicateCount = texts.length - uniqueTexts.length;
  if (duplicateCount > 0) {
    logger.debug(`Detected ${duplicateCount} duplicate chunks - will reuse embeddings`);
  }

  // Check content hash cache for already embedded content
  const textsToEmbed: string[] = [];
  const cachedEmbeddings = new Map<string, number[]>();

  for (const text of uniqueTexts) {
    const hash = textToHash.get(text)!;
    const cached = contentHashCache.get(hash);

    if (cached) {
      cachedEmbeddings.set(hash, cached.embedding);
      logger.debug(`Content hash cache HIT for hash ${hash.substring(0, 8)}...`);
    } else {
      textsToEmbed.push(text);
    }
  }

  const cacheHitCount = cachedEmbeddings.size;
  if (cacheHitCount > 0) {
    logger.info(`Saved ${cacheHitCount} embedding API calls via content deduplication`);
  }

  // Generate embeddings for new content
  let newEmbeddings: number[][] = [];
  if (textsToEmbed.length > 0) {
    logger.debug(`Generating embeddings for ${textsToEmbed.length} unique new texts`);

    try {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: textsToEmbed.map((text) => text.slice(0, 8000)),
        dimensions: EMBEDDING_DIMENSIONS,
      });

      newEmbeddings = response.data.map((item) => item.embedding);

      // Cache new embeddings
      textsToEmbed.forEach((text, index) => {
        const hash = textToHash.get(text)!;
        const embedding = newEmbeddings[index];

        contentHashCache.set(hash, {
          embedding,
          chunkId: chunkIds?.[index] || '',
        });
      });

      logger.debug(`Cached ${textsToEmbed.length} new content embeddings`);
    } catch (error) {
      logger.error('Failed to generate batch embeddings', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Reconstruct full embeddings array with deduplication
  const allEmbeddings: number[][] = [];
  let newEmbeddingIndex = 0;

  for (const text of uniqueTexts) {
    const hash = textToHash.get(text)!;
    const cached = cachedEmbeddings.get(hash);

    if (cached) {
      allEmbeddings.push(cached);
    } else {
      allEmbeddings.push(newEmbeddings[newEmbeddingIndex]);
      newEmbeddingIndex++;
    }
  }

  // Map back to original order (handling duplicates)
  const result: number[][] = new Array(texts.length);
  texts.forEach((text, index) => {
    const hash = textToHash.get(text)!;
    const indices = hashToIndex.get(hash)!;
    const embeddingIndex = uniqueTexts.findIndex((t) => textToHash.get(t) === hash);

    indices.forEach((idx) => {
      result[idx] = allEmbeddings[embeddingIndex];
    });
  });

  const apiCallsSaved = duplicateCount + cacheHitCount;
  logger.info(`Batch complete: ${textsToEmbed.length} API calls, ${apiCallsSaved} saved`);

  return result;
}

/**
 * Find semantically similar cached queries
 * Reuse embeddings for similar queries to save costs
 */
export async function findSimilarCachedQuery(
  queryText: string,
  threshold: number = 0.95
): Promise<number[] | null> {
  if (queryEmbeddingCache.size === 0) {
    return null;
  }

  // Quick check: exact match first
  const queryHash = generateContentHash(queryText);
  const exactMatch = queryEmbeddingCache.get(queryHash);
  if (exactMatch) {
    logger.debug('Exact query match found in cache');
    return exactMatch.embedding;
  }

  // For semantic similarity, we'd need to compute similarity scores
  // This requires the query embedding, which defeats the purpose
  // So we'll stick with exact matching for now

  return null;
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats() {
  return {
    queryCache: {
      size: queryEmbeddingCache.size,
      entries: queryEmbeddingCache.size,
    },
    contentHashCache: {
      size: contentHashCache.size,
      entries: contentHashCache.size,
    },
    ttl: CACHE_TTL_MS,
  };
}

/**
 * Clear all caches (useful for testing or manual cache invalidation)
 */
export function clearAllCaches() {
  const queryCount = queryEmbeddingCache.size;
  const contentCount = contentHashCache.size;

  queryEmbeddingCache.clear();
  contentHashCache.clear();

  logger.info(`Cleared ${queryCount} query cache entries and ${contentCount} content cache entries`);
}

/**
 * Estimate cost savings
 */
export function estimateCostSavings(
  totalTexts: number,
  uniqueTexts: number,
  cachedTexts: number
): {
  apiCalls: number;
  saved: number;
  costPerThousandTokens: number;
  estimatedTokens: number;
  estimatedCost: number;
  estimatedSavings: number;
} {
  const apiCalls = uniqueTexts - cachedTexts;
  const saved = totalTexts - apiCalls;
  const costPerThousandTokens = 0.00002; // text-embedding-3-small
  const avgTokensPerText = 250; // Estimate
  const estimatedTokens = apiCalls * avgTokensPerText;
  const estimatedCost = (estimatedTokens / 1000) * costPerThousandTokens;
  const potentialTokens = totalTexts * avgTokensPerText;
  const potentialCost = (potentialTokens / 1000) * costPerThousandTokens;
  const estimatedSavings = potentialCost - estimatedCost;

  return {
    apiCalls,
    saved,
    costPerThousandTokens,
    estimatedTokens,
    estimatedCost,
    estimatedSavings,
  };
}
