# AI/RAG Pipeline Implementatie

## Overzicht

De RAG (Retrieval-Augmented Generation) pipeline combineert vector search met LLM generation voor accurate, context-aware antwoorden op basis van de kennisbank.

## Architectuur

┌─────────────────────────────────────────────────────────────┐
│ INGESTION PIPELINE │
└─────────────────────────────────────────────────────────────┘
│
┌────────────────────┴────────────────────┐
│ │
▼ ▼
┌─────────┐ ┌─────────┐
│Document │ │ URL │
│ Upload │ │ Scraping│
└────┬────┘ └────┬────┘
│ │
└───────────┬───────────────────────────┘
│
▼
┌───────────────┐
│ Text │
│ Extraction │
└───────┬───────┘
│
▼
┌───────────────┐
│ Text │
│ Chunking │
└───────┬───────┘
│
▼
┌───────────────┐
│ Generate │
│ Embeddings │
│ (OpenAI) │
└───────┬───────┘
│
▼
┌───────────────┐
│ Store in │
│ PostgreSQL │
│ (pgvector) │
└───────────────┘
┌─────────────────────────────────────────────────────────────┐
│ QUERY PIPELINE │
└─────────────────────────────────────────────────────────────┘
│
User Question
│
▼
┌────────────────┐
│ Generate Query │
│ Embedding │
└────────┬───────┘
│
▼
┌────────────────┐
│ Vector Search │
│ (Similarity) │
└────────┬───────┘
│
▼
┌────────────────┐
│ Retrieve Top-K │
│ Chunks │
└────────┬───────┘
│
▼
┌────────────────┐
│ Build Context │
│ Prompt │
└────────┬───────┘
│
▼
┌────────────────┐
│ GPT-4 Generate │
│ Answer │
└────────┬───────┘
│
▼
┌────────────────┐
│ Return Answer │
│ + Sources │
└────────────────┘

---

## 1. OpenAI Client Setup

### lib/openai.ts

```typescript
import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable')
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Model Configuration
export const EMBEDDING_MODEL = 'text-embedding-3-small' // 1536 dimensions
export const CHAT_MODEL = 'gpt-4o-mini' // Cost-effective
export const CHAT_MODEL_ADVANCED = 'gpt-4o' // For complex queries

// Pricing (per 1M tokens, approximate)
export const PRICING = {
  EMBEDDING: 0.02, // $0.02 per 1M tokens
  CHAT_MINI_INPUT: 0.15, // $0.15 per 1M input tokens
  CHAT_MINI_OUTPUT: 0.60, // $0.60 per 1M output tokens
  CHAT_INPUT: 2.50, // $2.50 per 1M input tokens
  CHAT_OUTPUT: 10.00, // $10.00 per 1M output tokens
}

2. Document Processing
2.1 Text Extraction
lib/document-processor.ts
typescriptimport pdf from 'pdf-parse'
import mammoth from 'mammoth'
import * as cheerio from 'cheerio'

/**
 * Extract text from various document types
 */
export async function extractText(
  file: Buffer,
  mimeType: string
): Promise<string> {
  switch (mimeType) {
    case 'application/pdf':
      return await extractPdfText(file)

    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return await extractDocxText(file)

    case 'text/plain':
      return file.toString('utf-8')

    default:
      throw new Error(`Unsupported file type: ${mimeType}`)
  }
}

/**
 * Extract text from PDF
 */
async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer)
    return data.text
  } catch (error) {
    console.error('PDF extraction error:', error)
    throw new Error('Failed to extract PDF text')
  }
}

/**
 * Extract text from DOCX
 */
async function extractDocxText(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  } catch (error) {
    console.error('DOCX extraction error:', error)
    throw new Error('Failed to extract DOCX text')
  }
}

/**
 * Scrape text from URL
 */
export async function scrapeUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Chatbot/1.0)',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Remove unwanted elements
    $('script, style, nav, footer, header, aside, .ads, #comments').remove()

    // Extract main content
    const mainContent =
      $('main').text() ||
      $('article').text() ||
      $('.content').text() ||
      $('#content').text() ||
      $('body').text()

    // Clean whitespace
    return mainContent
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim()
  } catch (error) {
    console.error('URL scraping error:', error)
    throw new Error(`Failed to scrape URL: ${url}`)
  }
}

/**
 * Clean and normalize text
 */
export function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\t/g, ' ') // Replace tabs with spaces
    .replace(/\s{2,}/g, ' ') // Multiple spaces to single
    .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
    .trim()
}

2.2 Text Chunking
lib/chunking.ts
typescriptexport interface Chunk {
  content: string
  index: number
  metadata?: Record<string, any>
}

export interface ChunkingOptions {
  chunkSize?: number // Characters per chunk
  chunkOverlap?: number // Overlap between chunks
  metadata?: Record<string, any>
}

/**
 * Split text into chunks with overlap
 */
export function chunkText(
  text: string,
  options: ChunkingOptions = {}
): Chunk[] {
  const {
    chunkSize = 1000,
    chunkOverlap = 200,
    metadata = {}
  } = options

  const chunks: Chunk[] = []
  let startIndex = 0
  let chunkIndex = 0

  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + chunkSize, text.length)

    // Try to find a sentence boundary
    let chunkEnd = endIndex
    if (endIndex < text.length) {
      // Look for sentence endings: . ! ?
      const sentenceEnd = text.lastIndexOf('. ', endIndex)
      const questionEnd = text.lastIndexOf('? ', endIndex)
      const exclamationEnd = text.lastIndexOf('! ', endIndex)

      const boundaries = [sentenceEnd, questionEnd, exclamationEnd]
        .filter(i => i > startIndex)

      if (boundaries.length > 0) {
        chunkEnd = Math.max(...boundaries) + 1
      }
    }

    const content = text.slice(startIndex, chunkEnd).trim()

    if (content.length > 0) {
      chunks.push({
        content,
        index: chunkIndex++,
        metadata: {
          ...metadata,
          startChar: startIndex,
          endChar: chunkEnd,
          length: content.length,
        }
      })
    }

    // Move start with overlap
    startIndex = chunkEnd - chunkOverlap

    // Prevent infinite loop
    if (startIndex <= 0) startIndex = 1
  }

  return chunks
}

/**
 * Semantic chunking - splits by paragraphs
 */
export function semanticChunking(
  text: string,
  maxChunkSize: number = 1000
): Chunk[] {
  const paragraphs = text.split(/\n\n+/)
  const chunks: Chunk[] = []
  let currentChunk = ''
  let chunkIndex = 0

  for (const paragraph of paragraphs) {
    const paragraphTrimmed = paragraph.trim()

    if (!paragraphTrimmed) continue

    // Check if adding this paragraph exceeds max size
    if (currentChunk && (currentChunk + '\n\n' + paragraphTrimmed).length > maxChunkSize) {
      // Save current chunk
      chunks.push({
        content: currentChunk.trim(),
        index: chunkIndex++,
      })
      currentChunk = paragraphTrimmed
    } else {
      // Add to current chunk
      currentChunk += (currentChunk ? '\n\n' : '') + paragraphTrimmed
    }
  }

  // Add final chunk
  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      index: chunkIndex,
    })
  }

  return chunks
}

/**
 * Chunk by headers (for structured documents)
 */
export function chunkByHeaders(text: string): Chunk[] {
  // Split by markdown-style headers
  const sections = text.split(/^#{1,6}\s+/gm)

  return sections
    .filter(section => section.trim().length > 0)
    .map((section, index) => ({
      content: section.trim(),
      index,
      metadata: {
        type: 'section',
      }
    }))
}

2.3 Embedding Generation
lib/embedding.ts
typescriptimport { openai, EMBEDDING_MODEL } from './openai'

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
      encoding_format: 'float',
    })

    return response.data[0].embedding
  } catch (error) {
    console.error('Embedding generation error:', error)
    throw new Error('Failed to generate embedding')
  }
}

/**
 * Generate embeddings for multiple texts (batch)
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const batchSize = 100 // OpenAI limit: 2048 per request
  const embeddings: number[][] = []

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)

    try {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: batch,
        encoding_format: 'float',
      })

      embeddings.push(...response.data.map(d => d.embedding))
    } catch (error) {
      console.error(`Batch embedding error (${i}-${i + batch.length}):`, error)
      throw error
    }
  }

  return embeddings
}

/**
 * Estimate token count (approximate)
 */
export function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters for English
  // More accurate: use tiktoken library
  return Math.ceil(text.length / 4)
}

/**
 * Calculate cost for embedding generation
 */
export function calculateEmbeddingCost(tokenCount: number): number {
  // $0.02 per 1M tokens
  return (tokenCount / 1_000_000) * 0.02
}

3. Complete Ingestion Pipeline
lib/ingestion.ts
typescriptimport { prisma } from './prisma'
import { extractText, scrapeUrl, cleanText } from './document-processor'
import { chunkText } from './chunking'
import { generateEmbeddings, estimateTokens } from './embedding'
import type { DocumentType } from '@prisma/client'

/**
 * Ingest a document into the system
 */
export async function ingestDocument(
  documentId: string,
  file: Buffer,
  mimeType: string,
  type: DocumentType
): Promise<void> {
  try {
    // Update status to processing
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'PROCESSING' },
    })

    // 1. Extract text
    let rawText = await extractText(file, mimeType)
    const contentText = cleanText(rawText)

    if (!contentText || contentText.length < 10) {
      throw new Error('No content extracted from document')
    }

    // 2. Chunk text
    const chunks = chunkText(contentText, {
      chunkSize: 1000,
      chunkOverlap: 200,
      metadata: {
        documentId,
        documentType: type,
      }
    })

    if (chunks.length === 0) {
      throw new Error('No chunks generated from document')
    }

    // 3. Generate embeddings (batch)
    const texts = chunks.map(c => c.content)
    const embeddings = await generateEmbeddings(texts)

    // 4. Calculate metrics
    const totalTokens = chunks.reduce(
      (sum, chunk) => sum + estimateTokens(chunk.content),
      0
    )

    // 5. Store in database (transaction)
    await prisma.$transaction([
      // Update document
      prisma.document.update({
        where: { id: documentId },
        data: {
          contentText,
          status: 'COMPLETED',
          metadata: {
            chunkCount: chunks.length,
            totalTokens,
            processedAt: new Date().toISOString(),
          },
        },
      }),

      // Create chunks (using raw SQL for vector insertion)
      ...chunks.map((chunk, index) =>
        prisma.$executeRaw`
          INSERT INTO document_chunks (
            id, "documentId", "chunkIndex", content, embedding, "tokenCount", metadata, "createdAt"
          )
          VALUES (
            gen_random_uuid(),
            ${documentId}::text,
            ${chunk.index},
            ${chunk.content},
            ${JSON.stringify(embeddings[index])}::vector,
            ${estimateTokens(chunk.content)},
            ${JSON.stringify(chunk.metadata)}::jsonb,
            NOW()
          )
        `
      ),
    ])

    console.log(`✅ Document ${documentId} ingested: ${chunks.length} chunks, ${totalTokens} tokens`)
  } catch (error) {
    console.error(`❌ Document ${documentId} ingestion failed:`, error)

    // Update document status to failed
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    })

    throw error
  }
}

/**
 * Ingest a URL into the system
 */
export async function ingestUrl(
  documentId: string,
  url: string
): Promise<void> {
  try {
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'PROCESSING' },
    })

    // 1. Scrape URL
    let rawText = await scrapeUrl(url)
    const contentText = cleanText(rawText)

    if (!contentText || contentText.length < 10) {
      throw new Error('No content scraped from URL')
    }

    // 2-5. Same as document ingestion
    const chunks = chunkText(contentText, {
      chunkSize: 1000,
      chunkOverlap: 200,
      metadata: { documentId, url },
    })

    const embeddings = await generateEmbeddings(chunks.map(c => c.content))
    const totalTokens = chunks.reduce((sum, c) => sum + estimateTokens(c.content), 0)

    await prisma.$transaction([
      prisma.document.update({
        where: { id: documentId },
        data: {
          contentText,
          status: 'COMPLETED',
          metadata: {
            chunkCount: chunks.length,
            totalTokens,
            scrapedAt: new Date().toISOString(),
          },
        },
      }),

      ...chunks.map((chunk, index) =>
        prisma.$executeRaw`
          INSERT INTO document_chunks (
            id, "documentId", "chunkIndex", content, embedding, "tokenCount", "createdAt"
          )
          VALUES (
            gen_random_uuid(),
            ${documentId}::text,
            ${chunk.index},
            ${chunk.content},
            ${JSON.stringify(embeddings[index])}::vector,
            ${estimateTokens(chunk.content)},
            NOW()
          )
        `
      ),
    ])

    console.log(`✅ URL ${url} ingested: ${chunks.length} chunks`)
  } catch (error) {
    console.error(`❌ URL ${url} ingestion failed:`, error)

    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    })

    throw error
  }
}

4. Vector Search
lib/vector-search.ts
typescriptimport { prisma } from './prisma'
import { generateEmbedding } from './embedding'

export interface SearchResult {
  chunkId: string
  documentId: string
  documentName: string
  documentType: string
  content: string
  similarity: number
  metadata?: any
}

/**
 * Semantic search using vector similarity
 */
export async function semanticSearch(
  query: string,
  options: {
    limit?: number
    similarityThreshold?: number
  } = {}
): Promise<SearchResult[]> {
  const {
    limit = 5,
    similarityThreshold = 0.7,
  } = options

  // 1. Generate query embedding
  const queryEmbedding = await generateEmbedding(query)

  // 2. Perform vector similarity search
  // Using cosine similarity: 1 - (embedding <=> query)
  const results = await prisma.$queryRaw<SearchResult[]>`
    SELECT
      dc.id as "chunkId",
      dc."documentId",
      d.name as "documentName",
      d.type as "documentType",
      dc.content,
      1 - (dc.embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity,
      d.metadata
    FROM document_chunks dc
    JOIN documents d ON d.id = dc."documentId"
    WHERE
      d.status = 'COMPLETED'
      AND 1 - (dc.embedding <=> ${JSON.stringify(queryEmbedding)}::vector) > ${similarityThreshold}
    ORDER BY dc.embedding <=> ${JSON.stringify(queryEmbedding)}::vector
    LIMIT ${limit}
  `

  return results
}

/**
 * Hybrid search: semantic + keyword (full-text search)
 */
export async function hybridSearch(
  query: string,
  options: {
    limit?: number
    semanticWeight?: number // 0-1
  } = {}
): Promise<SearchResult[]> {
  const {
    limit = 5,
    semanticWeight = 0.7,
  } = options

  const keywordWeight = 1 - semanticWeight
  const queryEmbedding = await generateEmbedding(query)

  // Combine semantic similarity with keyword matching
  const results = await prisma.$queryRaw<SearchResult[]>`
    WITH semantic_results AS (
      SELECT
        dc.id,
        dc."documentId",
        dc.content,
        1 - (dc.embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as semantic_score
      FROM document_chunks dc
      JOIN documents d ON d.id = dc."documentId"
      WHERE d.status = 'COMPLETED'
    ),
    keyword_results AS (
      SELECT
        dc.id,
        ts_rank(
          to_tsvector('dutch', dc.content),
          plainto_tsquery('dutch', ${query})
        ) as keyword_score
      FROM document_chunks dc
    )
    SELECT
      sr.id as "chunkId",
      sr."documentId",
      d.name as "documentName",
      d.type as "documentType",
      sr.content,
      (
        sr.semantic_score * ${semanticWeight} +
        COALESCE(kr.keyword_score, 0) * ${keywordWeight}
      ) as similarity,
      d.metadata
    FROM semantic_results sr
    LEFT JOIN keyword_results kr ON kr.id = sr.id
    JOIN documents d ON d.id = sr."documentId"
    WHERE (
      sr.semantic_score * ${semanticWeight} +
      COALESCE(kr.keyword_score, 0) * ${keywordWeight}
    ) > 0.5
    ORDER BY similarity DESC
    LIMIT ${limit}
  `

  return results
}

5. RAG Response Generation
lib/rag.ts
typescriptimport { openai, CHAT_MODEL } from './openai'
import { semanticSearch, type SearchResult } from './vector-search'
import { prisma } from './prisma'

export interface RAGResponse {
  answer: string
  sources: SearchResult[]
  conversationId: string
  tokensUsed: number
  responseTime: number
  confidence: number
}

/**
 * Generate answer using RAG pipeline
 */
export async function generateAnswer(
  question: string,
  sessionId: string,
  settings?: {
    tone?: string
    maxLength?: number
    temperature?: number
  }
): Promise<RAGResponse> {
  const startTime = Date.now()

  try {
    // 1. Retrieve relevant context
    const sources = await semanticSearch(question, {
      limit: 5,
      similarityThreshold: 0.7,
    })

    // 2. Handle no context found
    if (sources.length === 0) {
      return await generateFallbackResponse(question, sessionId, startTime)
    }

    // 3. Build context from sources
    const context = sources
      .map((source, idx) => `[Bron ${idx + 1}] ${source.content}`)
      .join('\n\n')

    // 4. Get chatbot settings
    const chatbotSettings = await prisma.chatbotSettings.findFirst()

    const tone = settings?.tone || chatbotSettings?.tone || 'professional'
    const temperature = settings?.temperature || chatbotSettings?.temperature || 0.7
    const maxTokens = settings?.maxLength || chatbotSettings?.maxResponseLength || 500
    const fallbackMessage = chatbotSettings?.fallbackMessage ||
      'Sorry, ik kan deze vraag niet beantwoorden op basis van de beschikbare informatie.'

    // 5. Create system prompt
    const systemPrompt = createSystemPrompt(tone, fallbackMessage)

    // 6. Generate response with OpenAI
    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      temperature,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Context informatie:
${context}

Vraag van de gebruiker: ${question}

Geef een accuraat antwoord op basis van de context informatie hierboven. Als de context niet voldoende informatie bevat om de vraag te beantwoorden, geef dit dan duidelijk aan.`,
        },
      ],
    })

    const answer = completion.choices[0].message.content || fallbackMessage
    const tokensUsed = completion.usage?.total_tokens || 0
    const confidence = calculateConfidence(sources)

    // 7. Store conversation
    const conversation = await prisma.conversation.create({
      data: {
        sessionId,
        question,
        answer,
        responseTime: Date.now() - startTime,
        model: CHAT_MODEL,
        tokensUsed,
        confidence,
        sources: {
          create: sources.map(source => ({
            documentId: source.documentId,
            chunkContent: source.content,
            relevanceScore: source.similarity,
          })),
        },
      },
      include: {
        sources: true,
      },
    })

    return {
      answer,
      sources,
      conversationId: conversation.id,
      tokensUsed,
      responseTime: Date.now() - startTime,
      confidence,
    }
  } catch (error) {
    console.error('RAG generation error:', error)
    throw error
  }
}

/**
 * Create system prompt based on tone
 */
function createSystemPrompt(tone: string, fallbackMessage: string): string {
  const toneInstructions = {
    professional: 'Je bent een professionele assistent. Gebruik formele taal, wees precies en zakelijk.',
    friendly: 'Je bent een vriendelijke assistent. Gebruik een warme, toegankelijke en persoonlijke toon.',
    casual: 'Je bent een relaxte assistent. Gebruik informele taal en wees conversationeel.',
  }

  const instruction = toneInstructions[tone as keyof typeof toneInstructions] || toneInstructions.professional

  return `${instruction}

Belangrijke instructies:
1. Beantwoord vragen ALLEEN op basis van de gegeven context informatie
2. Wees accuraat, specifiek en compleet in je antwoorden
3. Als de context geen antwoord bevat, zeg dan: "${fallbackMessage}"
4. Vermeld GEEN bronverwijzingen in je antwoord (dit wordt automatisch toegevoegd)
5. Geef antwoorden altijd in het Nederlands
6. Wees beknopt maar compleet - vermijd onnodige woorden
7. Als je informatie uit meerdere bronnen combineert, zorg dan voor een coherent antwoord
8. Geef geen speculatieve of verzonnen informatie`
}

/**
 * Generate fallback response when no context found
 */
async function generateFallbackResponse(
  question: string,
  sessionId: string,
  startTime: number
): Promise<RAGResponse> {
  const chatbotSettings = await prisma.chatbotSettings.findFirst()
  const fallbackMessage = chatbotSettings?.fallbackMessage ||
    'Sorry, ik kan deze vraag niet beantwoorden op basis van de beschikbare informatie. Probeer je vraag anders te formuleren of neem contact op met onze support.'

  const conversation = await prisma.conversation.create({
    data: {
      sessionId,
      question,
      answer: fallbackMessage,
      responseTime: Date.now() - startTime,
      confidence: 0,
    },
  })

  return {
    answer: fallbackMessage,
    sources: [],
    conversationId: conversation.id,
    tokensUsed: 0,
    responseTime: Date.now() - startTime,
    confidence: 0,
  }
}

/**
 * Calculate confidence score based on source relevance
 */
function calculateConfidence(sources: SearchResult[]): number {
  if (sources.length === 0) return 0

  // Average similarity score of all sources
  const avgSimilarity = sources.reduce((sum, s) => sum + s.similarity, 0) / sources.length

  // Weight by number of sources (more sources = higher confidence)
  const sourceWeight = Math.min(sources.length / 3, 1) // Cap at 3 sources

  return Math.min(avgSimilarity * 0.7 + sourceWeight * 0.3, 1)
}

6. Advanced RAG Techniques
6.1 Query Rewriting
typescript/**
 * Rewrite user query for better retrieval
 */
export async function rewriteQuery(query: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    messages: [
      {
        role: 'system',
        content: 'Je bent een expert in het herformuleren van vragen voor betere zoekresultaten. Herschrijf de vraag om duidelijker en specifieker te zijn, behoud de kernboodschap.'
      },
      {
        role: 'user',
        content: `Herschrijf deze vraag: "${query}"`
      }
    ]
  })

  return completion.choices[0].message.content || query
}
6.2 Re-ranking Results
typescript/**
 * Re-rank search results using cross-encoder
 */
export async function rerankResults(
  query: string,
  results: SearchResult[]
): Promise<SearchResult[]> {
  // Use OpenAI to score relevance
  const scores = await Promise.all(
    results.map(async (result) => {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0,
        messages: [
          {
            role: 'system',
            content: 'Score hoe relevant deze tekst is voor de vraag. Geef een score van 0-10.'
          },
          {
            role: 'user',
            content: `Vraag: ${query}\n\nTekst: ${result.content}`
          }
        ]
      })

      const scoreText = completion.choices[0].message.content || '0'
      const score = parseInt(scoreText.match(/\d+/)?.[0] || '0')

      return { ...result, relevanceScore: score / 10 }
    })
  )

  return scores.sort((a, b) => b.relevanceScore - a.relevanceScore)
}
6.3 Multi-Query RAG
typescript/**
 * Generate multiple queries for comprehensive retrieval
 */
export async function multiQueryRAG(
  question: string,
  sessionId: string
): Promise<RAGResponse> {
  // Generate alternative questions
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Genereer 3 alternatieve formuleringen van deze vraag om betere zoekresultaten te krijgen. Geef alleen de vragen, genummerd 1-3.'
      },
      {
        role: 'user',
        content: question
      }
    ]
  })

  const alternativeQueries = completion.choices[0].message.content
    ?.split('\n')
    .filter(line => line.match(/^\d+\./))
    .map(line => line.replace(/^\d+\.\s*/, ''))
    || []

  // Search with all queries
  const allResults = await Promise.all(
    [question, ...alternativeQueries].map(q => semanticSearch(q, { limit: 3 }))
  )

  // Deduplicate and merge results
  const uniqueResults = Array.from(
    new Map(
      allResults.flat().map(r => [r.chunkId, r])
    ).values()
  ).slice(0, 5)

  // Generate answer using merged results
  // ... (continue with standard RAG pipeline)
}

7. Performance Optimization
7.1 Caching
typescriptimport { LRUCache } from 'lru-cache'

// Cache embeddings for common queries
const embeddingCache = new LRUCache<string, number[]>({
  max: 1000,
  ttl: 1000 * 60 * 60, // 1 hour
})

export async function generateEmbeddingCached(text: string): Promise<number[]> {
  const cached = embeddingCache.get(text)
  if (cached) return cached

  const embedding = await generateEmbedding(text)
  embeddingCache.set(text, embedding)

  return embedding
}

// Cache search results
const searchCache = new LRUCache<string, SearchResult[]>({
  max: 500,
  ttl: 1000 * 60 * 15, // 15 minutes
})
7.2 Batch Processing
typescript/**
 * Process multiple documents in parallel
 */
export async function batchIngestDocuments(
  documents: Array<{ id: string; buffer: Buffer; mimeType: string; type: DocumentType }>
): Promise<void> {
  const batchSize = 5 // Process 5 at a time

  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize)

    await Promise.all(
      batch.map(doc => ingestDocument(doc.id, doc.buffer, doc.mimeType, doc.type))
    )
  }
}

8. Monitoring & Analytics
typescript/**
 * Track RAG metrics
 */
export async function trackRAGMetrics(
  conversationId: string,
  metrics: {
    retrievalTime: number
    generationTime: number
    totalTime: number
    sourcesFound: number
    confidence: number
  }
): Promise<void> {
  await prisma.systemLog.create({
    data: {
      level: 'INFO',
      message: 'RAG metrics',
      context: {
        conversationId,
        ...metrics,
      },
    },
  })
}

9. Error Handling
typescriptexport class RAGError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'RAGError'
  }
}

// Usage
try {
  const answer = await generateAnswer(question, sessionId)
} catch (error) {
  if (error instanceof RAGError) {
    console.error(`RAG Error [${error.code}]:`, error.message, error.details)
  }
  throw error
}

10. Best Practices

Chunking Strategy

Optimal chunk size: 800-1200 characters
Overlap: 15-20% of chunk size
Preserve semantic units (paragraphs, sentences)


Vector Search

Similarity threshold: 0.7-0.8
Return 3-5 top results
Consider hybrid search for better recall


Prompt Engineering

Clear system instructions
Include context formatting
Add constraints (no speculation, cite sources)


Quality Control

Monitor confidence scores
Track answer ratings
Regularly review low-quality responses


Cost Optimization

Cache frequent queries
Use mini models when possible
Optimize chunk sizes to reduce tokens
```
