/**
 * Embedding Optimization with Caching
 *
 * Provides caching and deduplication for OpenAI embeddings to reduce costs.
 */

import OpenAI from "openai";
import { createHash } from "crypto";
import { cache, CacheConfig, CacheKeys } from "./advanced-cache";
import { logger } from "./logger";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Use cheapest model first
const EMBEDDING_MODEL = "text-embedding-3-small"; // 5x cheaper!
const EMBEDDING_MODEL_FALLBACK = "text-embedding-ada-002";

// Cost per 1K tokens
const COST_PER_1K = {
  "text-embedding-3-small": 0.00002,
  "text-embedding-ada-002": 0.0001,
};

// In-memory deduplication cache for current batch
const contentHashCache = new Map<string, number[]>();

/**
 * Calculate hash of text content
 */
function calculateContentHash(text: string): string {
  return createHash("sha256").update(text.trim().toLowerCase()).digest("hex");
}

/**
 * Generate embedding with caching
 */
export async function generateEmbeddingWithCache(
  text: string,
  type: "query" | "document" = "document"
): Promise<number[]> {
  // Generate cache key
  const cacheKey = CacheKeys.embedding(text);

  // Try cache first
  const cached = await cache.get<number[]>(cacheKey, "embeddings");
  if (cached) {
    logger.debug(`[EMBEDDING] Cache hit for ${type}: ${text.substring(0, 50)}...`);
    return cached;
  }

  logger.debug(`[EMBEDDING] Cache miss for ${type}: ${text.substring(0, 50)}...`);

  // Generate embedding via OpenAI
  const embedding = await generateOpenAIEmbedding(text);

  // Cache the result
  await cache.set(cacheKey, embedding, CacheConfig.ttl.embeddings, "embeddings");

  return embedding;
}

/**
 * Generate batch embeddings with deduplication
 */
export async function generateBatchEmbeddingsOptimized(
  texts: string[],
  chunkIds?: string[]
): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  // Build hash map for deduplication
  const hashToIndices = new Map<string, number[]>();
  const uniqueTexts: string[] = [];
  const hashes: string[] = [];

  for (let i = 0; i < texts.length; i++) {
    const hash = calculateContentHash(texts[i]);
    hashes.push(hash);

    if (!hashToIndices.has(hash)) {
      hashToIndices.set(hash, [i]);
      uniqueTexts.push(texts[i]);
    } else {
      hashToIndices.get(hash)!.push(i);
    }
  }

  const duplicatesFound = texts.length - uniqueTexts.length;
  if (duplicatesFound > 0) {
    logger.info(`[EMBEDDING] Found ${duplicatesFound} duplicate chunks, will reuse embeddings`);
  }

  // Check cache for unique texts
  const embeddings: (number[] | null)[] = new Array(uniqueTexts.length).fill(null);
  const textsToGenerate: string[] = [];
  const indicesToGenerate: number[] = [];

  for (let i = 0; i < uniqueTexts.length; i++) {
    const cacheKey = CacheKeys.embedding(uniqueTexts[i]);
    const cached = await cache.get<number[]>(cacheKey, "embeddings");

    if (cached) {
      embeddings[i] = cached;
    } else {
      textsToGenerate.push(uniqueTexts[i]);
      indicesToGenerate.push(i);
    }
  }

  const cacheHits = embeddings.filter((e) => e !== null).length;
  if (cacheHits > 0) {
    logger.info(`[EMBEDDING] Cache hits: ${cacheHits}/${uniqueTexts.length}`);
  }

  // Generate embeddings for uncached texts
  if (textsToGenerate.length > 0) {
    logger.info(`[EMBEDDING] Generating ${textsToGenerate.length} new embeddings`);

    const newEmbeddings = await generateBatchOpenAIEmbeddings(textsToGenerate);

    // Store in cache and fill embeddings array
    for (let i = 0; i < newEmbeddings.length; i++) {
      const uniqueIndex = indicesToGenerate[i];
      embeddings[uniqueIndex] = newEmbeddings[i];

      // Cache the embedding
      const cacheKey = CacheKeys.embedding(textsToGenerate[i]);
      await cache.set(
        cacheKey,
        newEmbeddings[i],
        CacheConfig.ttl.embeddings,
        "embeddings"
      );
    }
  }

  // Map back to original order (handling duplicates)
  const result: number[][] = new Array(texts.length);
  for (let i = 0; i < texts.length; i++) {
    const hash = hashes[i];
    const uniqueIndex = uniqueTexts.findIndex((t) => calculateContentHash(t) === hash);
    result[i] = embeddings[uniqueIndex]!;
  }

  return result;
}

/**
 * Direct OpenAI embedding call
 */
async function generateOpenAIEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text.slice(0, 8000),
    });

    return response.data[0].embedding;
  } catch (error) {
    logger.warn(`Model ${EMBEDDING_MODEL} failed, trying fallback`);

    // Try fallback model
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL_FALLBACK,
      input: text.slice(0, 8000),
    });

    return response.data[0].embedding;
  }
}

/**
 * Batch OpenAI embedding call
 */
async function generateBatchOpenAIEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts.map((text) => text.slice(0, 8000)),
    });

    return response.data.map((item) => item.embedding);
  } catch (error) {
    logger.warn(`Batch model ${EMBEDDING_MODEL} failed, trying fallback`);

    // Try fallback model
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL_FALLBACK,
      input: texts.map((text) => text.slice(0, 8000)),
    });

    return response.data.map((item) => item.embedding);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const stats = cache.getStats();

  return {
    queryCache: {
      size: stats.memorySize.embeddings,
    },
    contentHashCache: {
      size: contentHashCache.size,
    },
    redisEnabled: stats.redisEnabled,
  };
}

/**
 * Estimate cost savings
 */
export function estimateCostSavings(
  totalTexts: number,
  apiCalls: number,
  cacheHits: number
) {
  // Estimate tokens (rough average of 100 tokens per text)
  const avgTokensPerText = 100;
  const totalTokens = totalTexts * avgTokensPerText;
  const apiTokens = apiCalls * avgTokensPerText;

  // Calculate costs
  const estimatedCost = (apiTokens / 1000) * COST_PER_1K[EMBEDDING_MODEL];
  const wouldHaveCost = (totalTokens / 1000) * COST_PER_1K[EMBEDDING_MODEL];
  const estimatedSavings = wouldHaveCost - estimatedCost;

  return {
    totalTexts,
    apiCalls,
    saved: totalTexts - apiCalls,
    cacheHitRate: totalTexts > 0 ? cacheHits / totalTexts : 0,
    estimatedCost,
    estimatedSavings,
  };
}

/**
 * Clear embedding cache
 */
export async function clearEmbeddingCache() {
  await cache.clear("emb:*");
  contentHashCache.clear();
  logger.info("[EMBEDDING] Cache cleared");
}
