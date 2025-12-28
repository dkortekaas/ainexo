export interface ChunkOptions {
  chunkSize: number;
  chunkOverlap: number;
  metadata?: Record<string, unknown>;
}

export interface TextChunk {
  content: string;
  chunkIndex: number;
  metadata?: Record<string, unknown>;
  tokenCount?: number;
}

/**
 * Split text into overlapping chunks for better context preservation
 */
export function chunkText(
  text: string,
  options: ChunkOptions = {
    chunkSize: 1000,
    chunkOverlap: 200,
  }
): TextChunk[] {
  const { chunkSize, chunkOverlap, metadata = {} } = options;

  if (!text || text.trim().length === 0) {
    return [];
  }

  // Clean the text
  const cleanText = text
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n")
    .trim();

  const chunks: TextChunk[] = [];
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < cleanText.length) {
    const endIndex = Math.min(startIndex + chunkSize, cleanText.length);

    // Try to break at sentence boundaries
    let actualEndIndex = endIndex;
    if (endIndex < cleanText.length) {
      // Look for sentence endings within the last 100 characters
      const searchStart = Math.max(startIndex + chunkSize - 100, startIndex);
      const searchText = cleanText.substring(searchStart, endIndex);

      const sentenceEndings = /[.!?]\s+/;
      const match = searchText.search(sentenceEndings);

      if (match !== -1) {
        actualEndIndex = searchStart + match + 1;
      } else {
        // Look for word boundaries
        const wordBoundary = cleanText.lastIndexOf(" ", endIndex);
        if (wordBoundary > startIndex + chunkSize * 0.5) {
          actualEndIndex = wordBoundary;
        }
      }
    }

    const chunkContent = cleanText.substring(startIndex, actualEndIndex).trim();

    if (chunkContent.length > 0) {
      chunks.push({
        content: chunkContent,
        chunkIndex,
        metadata: {
          ...metadata,
          startIndex,
          endIndex: actualEndIndex,
          length: chunkContent.length,
        },
      });
      chunkIndex++;
    }

    // Move start index with overlap
    startIndex = Math.max(actualEndIndex - chunkOverlap, startIndex + 1);

    // Prevent infinite loop
    if (startIndex >= actualEndIndex) {
      startIndex = actualEndIndex;
    }
  }

  return chunks;
}

/**
 * Chunk website content with special handling for different sections
 */
export function chunkWebsiteContent(
  content: string,
  url: string,
  title?: string,
  options: ChunkOptions = {
    chunkSize: 1000,
    chunkOverlap: 200,
  }
): TextChunk[] {
  const baseMetadata = {
    source: "website",
    url,
    title: title || url,
    ...options.metadata,
  };

  // Split content by paragraphs first for better semantic chunks
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const chunks: TextChunk[] = [];
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    if (paragraph.length <= options.chunkSize) {
      // Paragraph fits in one chunk
      chunks.push({
        content: paragraph,
        chunkIndex,
        metadata: {
          ...baseMetadata,
          type: "paragraph",
          length: paragraph.length,
        },
      });
      chunkIndex++;
    } else {
      // Split large paragraph into smaller chunks
      const paragraphChunks = chunkText(paragraph, {
        ...options,
        metadata: {
          ...baseMetadata,
          type: "paragraph-split",
        },
      });

      // Update chunk indices
      paragraphChunks.forEach((chunk) => {
        chunk.chunkIndex = chunkIndex;
        chunkIndex++;
      });

      chunks.push(...paragraphChunks);
    }
  }

  return chunks;
}

/**
 * Estimate token count for a chunk
 */
export function estimateChunkTokens(chunk: TextChunk): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(chunk.content.length / 4);
}
