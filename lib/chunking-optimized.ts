/**
 * Optimized Chunking Strategy for Cost Reduction
 *
 * Key optimizations:
 * 1. Larger chunk sizes (reduce total chunks by 30-50%)
 * 2. Reduced overlap (minimize redundancy)
 * 3. Smart boundary detection (sentence/paragraph aware)
 * 4. Minimum chunk filtering (avoid tiny chunks)
 */

import { logger } from "./logger";

// Support both old and new interfaces for backward compatibility
export interface ChunkOptions {
  chunkSize: number;
  chunkOverlap: number;
  metadata?: Record<string, unknown>;
}

export interface OptimizedChunkOptions extends ChunkOptions {
  minChunkSize: number; // Filter out tiny chunks
}

export interface TextChunk {
  content: string;
  chunkIndex: number;
  metadata?: Record<string, unknown>;
  tokenCount?: number;
  hash?: string; // For deduplication
}

// Optimized defaults
const DEFAULT_OPTIONS: OptimizedChunkOptions = {
  chunkSize: 1500,     // Increased from 1000 (30-50% fewer chunks)
  chunkOverlap: 100,   // Reduced from 200 (50% less overlap)
  minChunkSize: 200,   // Filter chunks smaller than 200 chars
};

/**
 * Optimized text chunking with cost reduction focus
 */
export function chunkTextOptimized(
  text: string,
  options: Partial<OptimizedChunkOptions> = {}
): TextChunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { chunkSize, chunkOverlap, minChunkSize, metadata = {} } = opts;

  if (!text || text.trim().length === 0) {
    return [];
  }

  // Clean the text (remove excessive whitespace)
  const cleanText = text
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n") // Max 2 consecutive newlines
    .trim();

  // If text is smaller than minimum chunk size, return empty
  if (cleanText.length < minChunkSize) {
    logger.debug(`Text too small (${cleanText.length} chars), skipping`);
    return [];
  }

  const chunks: TextChunk[] = [];
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < cleanText.length) {
    const endIndex = Math.min(startIndex + chunkSize, cleanText.length);

    // Try to break at paragraph boundaries first (best semantic preservation)
    let actualEndIndex = endIndex;
    if (endIndex < cleanText.length) {
      // Look for paragraph breaks (double newline)
      const searchStart = Math.max(startIndex + chunkSize - 300, startIndex);
      const searchText = cleanText.substring(searchStart, endIndex + 200);

      const paragraphBreak = searchText.indexOf("\n\n");
      if (paragraphBreak !== -1) {
        actualEndIndex = searchStart + paragraphBreak;
      } else {
        // Look for sentence endings
        const sentenceEndings = /[.!?]\s+/g;
        let bestMatch = -1;
        let match;

        while ((match = sentenceEndings.exec(searchText)) !== null) {
          bestMatch = match.index;
        }

        if (bestMatch !== -1) {
          actualEndIndex = searchStart + bestMatch + 1;
        } else {
          // Look for word boundaries
          const wordBoundary = cleanText.lastIndexOf(" ", endIndex);
          if (wordBoundary > startIndex + chunkSize * 0.7) {
            actualEndIndex = wordBoundary;
          }
        }
      }
    }

    const chunkContent = cleanText.substring(startIndex, actualEndIndex).trim();

    // Only add chunks that meet minimum size requirement
    if (chunkContent.length >= minChunkSize) {
      chunks.push({
        content: chunkContent,
        chunkIndex,
        metadata: {
          ...metadata,
          startIndex,
          endIndex: actualEndIndex,
          length: chunkContent.length,
        },
        tokenCount: estimateTokenCount(chunkContent),
      });
      chunkIndex++;
    } else {
      logger.debug(`Skipping small chunk (${chunkContent.length} chars)`);
    }

    // Move start index with REDUCED overlap
    const nextStart = actualEndIndex - chunkOverlap;
    startIndex = Math.max(nextStart, startIndex + 1);

    // Prevent infinite loop
    if (startIndex >= actualEndIndex) {
      startIndex = actualEndIndex;
    }
  }

  logger.debug(`Created ${chunks.length} optimized chunks (avg: ${Math.round(cleanText.length / chunks.length)} chars/chunk)`);

  return chunks;
}

/**
 * Optimized website content chunking
 * Accepts both old ChunkOptions and new OptimizedChunkOptions for backward compatibility
 */
export function chunkWebsiteContentOptimized(
  content: string,
  url: string,
  title?: string,
  options: Partial<ChunkOptions> | Partial<OptimizedChunkOptions> = {}
): TextChunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const baseMetadata = {
    source: "website",
    url,
    title: title || url,
    ...options.metadata,
  };

  // Split by paragraphs for semantic coherence
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length >= opts.minChunkSize); // Filter small paragraphs

  const chunks: TextChunk[] = [];
  let chunkIndex = 0;

  // Combine small paragraphs to reach optimal chunk size
  let currentBatch: string[] = [];
  let currentBatchSize = 0;

  for (const paragraph of paragraphs) {
    const paragraphSize = paragraph.length;

    // If adding this paragraph exceeds chunk size, process current batch
    if (currentBatchSize + paragraphSize > opts.chunkSize && currentBatch.length > 0) {
      const batchContent = currentBatch.join("\n\n");
      chunks.push({
        content: batchContent,
        chunkIndex,
        metadata: {
          ...baseMetadata,
          type: "paragraph-batch",
          length: batchContent.length,
        },
        tokenCount: estimateTokenCount(batchContent),
      });
      chunkIndex++;

      currentBatch = [paragraph];
      currentBatchSize = paragraphSize;
    } else {
      currentBatch.push(paragraph);
      currentBatchSize += paragraphSize + 2; // +2 for \n\n
    }
  }

  // Process remaining batch
  if (currentBatch.length > 0) {
    const batchContent = currentBatch.join("\n\n");
    if (batchContent.length >= opts.minChunkSize) {
      chunks.push({
        content: batchContent,
        chunkIndex,
        metadata: {
          ...baseMetadata,
          type: "paragraph-batch",
          length: batchContent.length,
        },
        tokenCount: estimateTokenCount(batchContent),
      });
    }
  }

  logger.debug(`Created ${chunks.length} optimized website chunks`);

  return chunks;
}

/**
 * Improved token estimation
 */
export function estimateTokenCount(text: string): number {
  // More accurate: ~4 chars per token for English
  // For Dutch/multilingual, use 3.5
  return Math.ceil(text.length / 3.5);
}

/**
 * Calculate chunk statistics for cost estimation
 */
export function calculateChunkStats(chunks: TextChunk[]) {
  const totalChunks = chunks.length;
  const totalChars = chunks.reduce((sum, chunk) => sum + chunk.content.length, 0);
  const totalTokens = chunks.reduce((sum, chunk) => sum + (chunk.tokenCount || 0), 0);
  const avgChunkSize = totalChunks > 0 ? Math.round(totalChars / totalChunks) : 0;
  const avgTokensPerChunk = totalChunks > 0 ? Math.round(totalTokens / totalChunks) : 0;

  return {
    totalChunks,
    totalChars,
    totalTokens,
    avgChunkSize,
    avgTokensPerChunk,
  };
}

/**
 * Compare old vs new chunking strategy
 */
export function compareChunkingStrategies(text: string) {
  // Old strategy
  const oldChunks = chunkTextOld(text, {
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  // New optimized strategy
  const newChunks = chunkTextOptimized(text, {
    chunkSize: 1500,
    chunkOverlap: 100,
    minChunkSize: 200,
  });

  const oldStats = calculateChunkStats(oldChunks);
  const newStats = calculateChunkStats(newChunks);

  const chunkReduction = ((oldStats.totalChunks - newStats.totalChunks) / oldStats.totalChunks) * 100;
  const costReduction = chunkReduction; // Same percentage

  logger.info('Chunking Strategy Comparison:');
  logger.info(`Old: ${oldStats.totalChunks} chunks, ${oldStats.totalTokens} tokens`);
  logger.info(`New: ${newStats.totalChunks} chunks, ${newStats.totalTokens} tokens`);
  logger.info(`Reduction: ${chunkReduction.toFixed(1)}% fewer chunks = ${costReduction.toFixed(1)}% cost savings`);

  return {
    oldStats,
    newStats,
    chunkReduction,
    costReduction,
  };
}

/**
 * Old chunking strategy (for comparison)
 */
function chunkTextOld(
  text: string,
  options: { chunkSize: number; chunkOverlap: number }
): TextChunk[] {
  const { chunkSize, chunkOverlap } = options;
  const cleanText = text.replace(/\s+/g, " ").trim();
  const chunks: TextChunk[] = [];
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < cleanText.length) {
    const endIndex = Math.min(startIndex + chunkSize, cleanText.length);
    const chunkContent = cleanText.substring(startIndex, endIndex).trim();

    if (chunkContent.length > 0) {
      chunks.push({
        content: chunkContent,
        chunkIndex,
        tokenCount: estimateTokenCount(chunkContent),
      });
      chunkIndex++;
    }

    startIndex = Math.max(endIndex - chunkOverlap, startIndex + 1);
  }

  return chunks;
}

// Export alias for backward compatibility
export const chunkWebsiteContent = chunkWebsiteContentOptimized;
