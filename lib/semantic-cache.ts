/**
 * Semantic Query Caching
 * Caches responses not just by exact query match, but by semantic similarity
 * Dramatically reduces API costs and improves response time
 */

import crypto from "crypto";

export interface CachedResponse {
  query: string;
  queryEmbedding: number[];
  answer: string;
  confidence: number;
  sources: Array<{
    documentName: string;
    documentType: string;
    relevanceScore: number;
    url?: string;
  }>;
  suggestedQuestions?: string[];
  tokensUsed: number;
  timestamp: number;
  hitCount: number; // Track popularity
}

export interface SemanticCacheOptions {
  maxSize?: number;
  ttl?: number; // Time to live in milliseconds
  similarityThreshold?: number; // Minimum cosine similarity (0-1)
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Semantic Query Cache using embedding similarity
 */
export class SemanticQueryCache {
  private cache: Map<string, CachedResponse>;
  private maxSize: number;
  private ttl: number;
  private similarityThreshold: number;
  private hits: number = 0;
  private misses: number = 0;

  constructor(options: SemanticCacheOptions = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize || 1000;
    this.ttl = options.ttl || 7 * 24 * 60 * 60 * 1000; // 7 days
    this.similarityThreshold = options.similarityThreshold || 0.92; // 92% similarity
  }

  /**
   * Find semantically similar cached query
   */
  async findSimilar(
    queryEmbedding: number[],
    originalQuery: string
  ): Promise<CachedResponse | null> {
    const now = Date.now();
    let bestMatch: CachedResponse | null = null;
    let bestSimilarity = 0;

    for (const cached of this.cache.values()) {
      // Skip expired entries
      if (now - cached.timestamp > this.ttl) {
        continue;
      }

      // Calculate similarity
      const similarity = cosineSimilarity(queryEmbedding, cached.queryEmbedding);

      if (similarity > bestSimilarity && similarity >= this.similarityThreshold) {
        bestSimilarity = similarity;
        bestMatch = cached;
      }
    }

    if (bestMatch) {
      this.hits++;
      bestMatch.hitCount++;

      console.log(`📦 Semantic cache HIT! Similarity: ${(bestSimilarity * 100).toFixed(1)}%`);
      console.log(`   Original: "${bestMatch.query}"`);
      console.log(`   Similar:  "${originalQuery}"`);
      console.log(`   Hit count: ${bestMatch.hitCount}`);

      return bestMatch;
    }

    this.misses++;
    return null;
  }

  /**
   * Store query response in cache
   */
  async set(
    query: string,
    queryEmbedding: number[],
    response: {
      answer: string;
      confidence: number;
      sources: CachedResponse['sources'];
      suggestedQuestions?: string[];
      tokensUsed: number;
    }
  ): Promise<void> {
    // Generate cache key from embedding
    const embeddingHash = crypto
      .createHash('md5')
      .update(JSON.stringify(queryEmbedding.slice(0, 100))) // Use first 100 dims for key
      .digest('hex');

    const cached: CachedResponse = {
      query,
      queryEmbedding,
      answer: response.answer,
      confidence: response.confidence,
      sources: response.sources,
      suggestedQuestions: response.suggestedQuestions,
      tokensUsed: response.tokensUsed,
      timestamp: Date.now(),
      hitCount: 0,
    };

    this.cache.set(embeddingHash, cached);

    // Evict least recently used if cache is full
    if (this.cache.size > this.maxSize) {
      this.evictLRU();
    }

    console.log(`💾 Cached semantic query (cache size: ${this.cache.size}/${this.maxSize})`);
  }

  /**
   * Evict least recently used entries
   * Based on hit count and age
   */
  private evictLRU(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());

    // Score = hitCount / age_in_days (lower score = more likely to evict)
    const scored = entries.map(([key, value]) => {
      const ageInDays = (now - value.timestamp) / (24 * 60 * 60 * 1000);
      const score = value.hitCount / Math.max(ageInDays, 0.1);
      return { key, score };
    });

    // Sort by score (ascending) and remove bottom 10%
    scored.sort((a, b) => a.score - b.score);
    const toRemove = Math.ceil(this.cache.size * 0.1);

    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(scored[i].key);
    }

    console.log(`🗑️ Evicted ${toRemove} LRU cache entries`);
  }

  /**
   * Clean expired entries
   */
  cleanExpired(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired semantic cache entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total * 100).toFixed(1) : '0';

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: `${hitRate}%`,
      totalQueries: total,
    };
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    console.log('🧹 Semantic cache cleared');
  }
}

// Global semantic cache instance
export const semanticCache = new SemanticQueryCache({
  maxSize: 1000,
  ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
  similarityThreshold: 0.92, // 92% similarity required
});

// Periodic cleanup (every 6 hours)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    semanticCache.cleanExpired();

    // Log stats every day
    const stats = semanticCache.getStats();
    console.log('📊 Semantic Cache Stats:', stats);
  }, 6 * 60 * 60 * 1000);
}
