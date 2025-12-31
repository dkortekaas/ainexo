import OpenAI from "openai";
import crypto from "crypto";
import { logger } from "./logger";

// Initialize OpenAI client only if API key is available
export const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

interface CachedResponse {
  answer: string;
  confidence: number;
  timestamp: number;
  sources: Array<{
    documentName: string;
    documentType: string;
    relevanceScore: number;
    url?: string;
  }>;
  tokensUsed: number;
}

/**
 * LRU (Least Recently Used) Cache implementation
 * Prevents memory leaks by limiting cache size and evicting old entries
 */
class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;
  private ttl: number; // Time-to-live in milliseconds

  constructor(maxSize: number = 10000, ttl: number = 3600000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl; // Default: 1 hour
  }

  get(key: K): V | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, item);
    return item;
  }

  set(key: K, value: V): void {
    // Remove if already exists (to update position)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Add to end (most recently used)
    this.cache.set(key, value);

    // Evict oldest entry if cache is full
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
        console.log(
          `🗑️ LRU cache evicted oldest entry (size: ${this.cache.size}/${this.maxSize})`
        );
      }
    }
  }

  clear(): void {
    this.cache.clear();
    console.log("🧹 Response cache cleared");
  }

  size(): number {
    return this.cache.size;
  }

  // Clean expired entries based on TTL
  cleanExpired(getTimestamp: (value: V) => number): void {
    const now = Date.now();
    const keysToDelete: K[] = [];

    for (const [key, value] of this.cache.entries()) {
      const timestamp = getTimestamp(value);
      if (now - timestamp > this.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`🧹 Cleaned ${keysToDelete.length} expired cache entries`);
    }
  }
}

// Response cache with LRU eviction - max 10,000 entries, 1 hour TTL
const responseCache = new LRUCache<string, CachedResponse>(10000, 3600000);

// Periodically clean expired entries (every 10 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    responseCache.cleanExpired((value) => value.timestamp);
  }, 600000); // 10 minutes
}

interface Response {
  answer: string;
  confidence: number;
  sources: Array<{
    documentName: string;
    documentType: string;
    relevanceScore: number;
    url?: string;
  }>;
  tokensUsed: number;
}

// Model Configuration
export const EMBEDDING_MODEL = "text-embedding-ada-002"; // Most compatible model for all accounts
export const EMBEDDING_MODEL_FALLBACK = "text-embedding-3-small"; // Fallback to newer model if available
export const EMBEDDING_MODEL_FALLBACK2 = "text-embedding-3-large"; // Second fallback model
export const CHAT_MODEL = "gpt-4o-mini"; // Cost-effective
export const CHAT_MODEL_ADVANCED = "gpt-4o"; // For complex queries

// Environment variable to disable embeddings completely
export const EMBEDDINGS_ENABLED = process.env.EMBEDDINGS_ENABLED !== "false";

/**
 * Genereer semantic hash van embedding voor cache key
 * Verhoogde precision (4 decimalen) en langere hash voor betere uniqueness
 */
function hashEmbedding(embedding: number[]): string {
  const hash = crypto.createHash("sha256");
  // Verhoogde precision: 4 decimalen ipv 2 voor betere differentiatie
  const roundedEmbedding = embedding.map((val) => Math.round(val * 10000) / 10000);
  hash.update(JSON.stringify(roundedEmbedding));
  return hash.digest("hex").substring(0, 32); // Langere hash (128-bit) voor minder collisions
}

/**
 * Genereer cache key inclusief conversatie context
 * Dit voorkomt dat verschillende vragen met vergelijkbare embeddings dezelfde cache key krijgen
 */
function generateCacheKey(
  questionEmbedding: number[],
  context: Array<{ id: string; score: number }>,
  conversationHistory?: Array<{ role: string; content: string }>
): string {
  // Basis: question embedding hash
  const questionHash = hashEmbedding(questionEmbedding);

  // Context fingerprint: gebruik alleen de top 3 document IDs + scores
  // Dit zorgt ervoor dat verschillende knowledge base results andere cache keys krijgen
  const contextFingerprint = context
    .slice(0, 3)
    .map(c => `${c.id}:${Math.round(c.score * 100)}`)
    .join('|');

  // Conversation context: laatste 2 messages voor context awareness
  const conversationFingerprint = conversationHistory
    ? conversationHistory
        .slice(-2)
        .map(msg => `${msg.role}:${msg.content.substring(0, 50)}`)
        .join('|')
    : '';

  // Combineer alles in één hash
  const combinedHash = crypto.createHash("sha256");
  combinedHash.update(`${questionHash}:${contextFingerprint}:${conversationFingerprint}`);

  return combinedHash.digest("hex").substring(0, 32);
}

/**
 * Cache frequente vragen om kosten en latency te reduceren
 */
async function getCachedOrGenerate(
  question: string,
  context: Array<{
    id: string;
    type: string;
    title: string;
    content: string;
    score: number;
    metadata?: Record<string, unknown>;
    url?: string;
  }>,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    language?: string;
    tone?: string;
    conversationHistory?: Array<{
      role: "user" | "assistant";
      content: string;
    }>;
  } = {}
): Promise<Response> {
  try {
    // Genereer semantic hash van vraag
    const questionEmbedding = await generateEmbedding(question);

    // Genereer cache key inclusief context EN conversatiegeschiedenis
    // Dit voorkomt dat verschillende vragen dezelfde cache key krijgen
    const cacheKey = generateCacheKey(
      questionEmbedding,
      context.map(c => ({ id: c.id, score: c.score })),
      options.conversationHistory
    );

    // Check cache (TTL afhankelijk van conversatie context)
    // Als er conversatiegeschiedenis is: kortere TTL (10 min) voor betere context awareness
    // Zonder conversatie: langere TTL (1 uur) voor standalone vragen
    const cacheTTL = options.conversationHistory && options.conversationHistory.length > 0
      ? 600000  // 10 minuten voor conversational context
      : 3600000; // 1 uur voor standalone vragen

    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheTTL) {
      console.log(
        "📦 Using cached response for question:",
        question.substring(0, 50) + "...",
        `(cache key includes context, TTL: ${cacheTTL / 60000} min)`
      );
      return {
        answer: cached.answer,
        confidence: cached.confidence,
        sources: cached.sources,
        tokensUsed: cached.tokensUsed,
      };
    }

    // Log cache miss voor debugging
    if (cached) {
      console.log("⏰ Cache expired, generating fresh response");
    } else {
      console.log("🆕 Cache miss, generating new response");
    }

    // Generate nieuwe response with options
    const response = await generateAIResponse(question, context, options);

    // Cache alleen high-confidence responses
    if (response.confidence >= 0.7) {
      const sources = context
        .filter((r) => r.score >= 0.4)
        .slice(0, 3)
        .map((result) => ({
          documentName: result.title,
          documentType: result.type,
          relevanceScore: result.score,
          url: result.url,
        }));

      responseCache.set(cacheKey, {
        answer: response.answer,
        confidence: response.confidence,
        timestamp: Date.now(),
        sources,
        tokensUsed: response.tokensUsed,
      });

      console.log("💾 Cached high-confidence response");
    }

    return {
      answer: response.answer,
      confidence: response.confidence,
      sources: context
        .filter((r) => r.score >= 0.4)
        .slice(0, 3)
        .map((result) => ({
          documentName: result.title,
          documentType: result.type,
          relevanceScore: result.score,
          url: result.url,
        })),
      tokensUsed: response.tokensUsed,
    };
  } catch (error) {
    logger.error("Error in getCachedOrGenerate", {
      error: error instanceof Error ? error.message : String(error),
    });
    // Fallback to direct generation with options
    const response = await generateAIResponse(question, context, options);
    return {
      answer: response.answer,
      confidence: response.confidence,
      sources: context
        .filter((r) => r.score >= 0.4)
        .slice(0, 3)
        .map((result) => ({
          documentName: result.title,
          documentType: result.type,
          relevanceScore: result.score,
          url: result.url,
        })),
      tokensUsed: response.tokensUsed,
    };
  }
}

// Pricing (per 1M tokens, approximate)
export const PRICING = {
  EMBEDDING: 0.02, // $0.02 per 1M tokens
  CHAT_INPUT: 0.15, // $0.15 per 1M tokens (gpt-4o-mini)
  CHAT_OUTPUT: 0.6, // $0.60 per 1M tokens (gpt-4o-mini)
};

/**
 * Generate embedding for a single text with fallback models
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!openai) {
    throw new Error("OpenAI API key not configured");
  }

  const modelsToTry = [
    EMBEDDING_MODEL,
    EMBEDDING_MODEL_FALLBACK,
    EMBEDDING_MODEL_FALLBACK2,
  ];

  for (const model of modelsToTry) {
    try {
      console.log(`Trying embedding model: ${model}`);
      const response = await openai.embeddings.create({
        model: model,
        input: text,
      });

      console.log(`Successfully generated embedding using model: ${model}`);
      return response.data[0].embedding;
    } catch (error: unknown) {
      const errorObj = error as {
        message?: string;
        status?: number;
        code?: string;
      };
      console.warn(`Model ${model} failed:`, errorObj?.message || error);

      // If it's a model access error, try the next model
      if (errorObj?.status === 403 && errorObj?.code === "model_not_found") {
        continue;
      }

      // For other errors, throw immediately
      throw new Error(
        `Failed to generate embedding with model ${model}: ${errorObj?.message || "Unknown error"}`
      );
    }
  }

  // If all models failed, return empty embeddings to prevent complete failure
  console.error(
    `All embedding models failed. Tried: ${modelsToTry.join(", ")}. Please check your OpenAI project settings.`
  );
  console.warn(
    "Returning empty embeddings to prevent complete failure. Website scraping will continue without vector search."
  );
  console.warn(
    "To disable embeddings completely, set EMBEDDINGS_ENABLED=false in your environment variables."
  );

  // Return empty embeddings array with correct dimensions (1536 for text-embedding-3-small)
  return new Array(1536).fill(0);
}

/**
 * Generate embeddings for multiple texts (batch) with fallback models
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!openai) {
    throw new Error("OpenAI API key not configured");
  }

  const modelsToTry = [
    EMBEDDING_MODEL,
    EMBEDDING_MODEL_FALLBACK,
    EMBEDDING_MODEL_FALLBACK2,
  ];

  for (const model of modelsToTry) {
    try {
      console.log(`Trying embedding model: ${model}`);
      const response = await openai.embeddings.create({
        model: model,
        input: texts,
      });

      console.log(`Successfully generated embeddings using model: ${model}`);
      return response.data.map((item) => item.embedding);
    } catch (error: unknown) {
      const errorObj = error as {
        message?: string;
        status?: number;
        code?: string;
      };
      console.warn(`Model ${model} failed:`, errorObj?.message || error);

      // If it's a model access error, try the next model
      if (
        errorObj?.status === 403 &&
        (errorObj?.code === "model_not_found" ||
          errorObj?.message?.includes("does not have access") ||
          (errorObj?.message?.includes("Project") &&
            errorObj?.message?.includes("does not have access")))
      ) {
        console.warn(`Model ${model} not accessible, trying next model...`);
        continue;
      }

      // For other errors, throw immediately
      throw new Error(
        `Failed to generate embeddings with model ${model}: ${errorObj?.message || "Unknown error"}`
      );
    }
  }

  // If all models failed, return empty embeddings to prevent complete failure
  console.error(
    `All embedding models failed. Tried: ${modelsToTry.join(", ")}. Please check your OpenAI project settings.`
  );
  console.warn(
    "Returning empty embeddings to prevent complete failure. Website scraping will continue without vector search."
  );
  console.warn(
    "To disable embeddings completely, set EMBEDDINGS_ENABLED=false in your environment variables."
  );

  // Return empty embeddings array with correct dimensions (1536 for text-embedding-3-small)
  return texts.map(() => new Array(1536).fill(0));
}

/**
 * Estimate token count (approximate)
 */
export function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters for English
  return Math.ceil(text.length / 4);
}

/**
 * Calculate cost for embedding generation
 */
export function calculateEmbeddingCost(tokenCount: number): number {
  // $0.02 per 1M tokens
  return (tokenCount / 1_000_000) * 0.02;
}

/**
 * Generate AI response using knowledge base context
 */
export { getCachedOrGenerate };

export async function generateAIResponse(
  question: string,
  context: Array<{
    type: string;
    title: string;
    content: string;
    score: number;
    url?: string;
  }>,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    language?: string;
    tone?: string;
    conversationHistory?: Array<{
      role: "user" | "assistant";
      content: string;
    }>;
  } = {}
): Promise<{
  answer: string;
  tokensUsed: number;
  confidence: number;
  suggestedQuestions?: string[];
}> {
  if (!openai) {
    throw new Error("OpenAI API key not configured");
  }

  const {
    model = CHAT_MODEL,
    temperature = 0.1,
    maxTokens = 500,
    systemPrompt,
    language = "nl",
    tone = "professional",
    conversationHistory = [],
  } = options;

  // Multi-source context met betere structuur - VERHOOGD naar 8 bronnen
  const topSources = context
    .filter((r) => r.score >= 0.35) // Iets lagere threshold voor meer diversiteit
    .slice(0, 8); // Top 8 bronnen voor meer context

  const contextString = topSources
    .map((item, index) => {
      const metadata = [
        `Relevantie: ${(item.score * 100).toFixed(0)}%`,
        item.type && `Type: ${item.type}`,
        item.url && `URL: ${item.url}`,
      ]
        .filter(Boolean)
        .join(" | ");

      return `### Bron ${index + 1}: ${item.title}
${metadata}

${item.content}

---`;
    })
    .join("\n\n");

  // Tone-specific instructions
  const toneInstructions = {
    professional: "Wees professioneel, formeel en zakelijk in je communicatie.",
    friendly: "Wees vriendelijk, warm en benaderbaar in je communicatie.",
    casual: "Wees informeel, relaxed en casual in je communicatie.",
    helpful: "Wees extra behulpzaam, geduldig en ondersteunend.",
    expert: "Wees deskundig, autoritair en toon expertise in je antwoorden.",
  };

  const toneInstruction =
    toneInstructions[tone as keyof typeof toneInstructions] ||
    toneInstructions.professional;

  // Check if we have sufficient context
  if (context.length === 0) {
    return {
      answer:
        "Sorry, ik kan deze vraag niet beantwoorden op basis van de beschikbare informatie in onze knowledge base.",
      tokensUsed: 0,
      confidence: 0.1,
    };
  }

  // Build conversation history context if available
  const conversationContext =
    conversationHistory.length > 0
      ? `\n\nGESPREKSGESCHIEDENIS (laatste ${conversationHistory.length} berichten):\n${conversationHistory
          .map(
            (msg) =>
              `${msg.role === "user" ? "Gebruiker" : "Assistent"}: ${msg.content}`
          )
          .join("\n")}\n`
      : "";

  // Build context-based answering instructions
  const contextInstructions = `
BELANGRIJKE RICHTLIJNEN VOOR ANTWOORDEN:
1. Baseer je antwoord UITSLUITEND op de informatie in de onderstaande bronnen
2. Gebruik markdown formatting voor betere leesbaarheid:
   - **vetgedrukt** voor belangrijke punten en kernwoorden
   - Bullet points (- of •) voor opsommingen
   - Numbered lists voor stapsgewijze instructies
3. Citeer bronnen subtiel in je antwoord met [Bron X] waar relevant
4. Als een bron een URL bevat, vermeld deze als: "Meer informatie: [URL]"
5. Combineer informatie uit meerdere bronnen voor een compleet, coherent antwoord
6. ${toneInstruction}
${conversationContext ? "7. Gebruik de gespreksgeschiedenis om follow-up vragen in context te plaatsen" : ""}

ANTWOORD STRUCTUUR & KWALITEIT:
- Begin DIRECT met het antwoord - geen inleidende zinnen zoals "Op basis van..." of "Volgens de bronnen..."
- Geef eerst het belangrijkste antwoord, dan aanvullende details
- Gebruik concrete feiten: cijfers, prijzen, data, specificaties uit de bronnen
- Optimale lengte: 75-200 woorden (informatief maar beknopt)
- Eindig indien relevant met een follow-up vraag of call-to-action
- Spreek de gebruiker direct aan (gebruik "je/jij" tenzij formeel vereist)

ANTWOORDKWALITEIT CHECKLIST:
✓ Beantwoordt de vraag volledig en direct
✓ Bevat specifieke details uit de bronnen
✓ Is goed geformatteerd en makkelijk te lezen
✓ Heeft een natuurlijke, menselijke toon
✓ Biedt meerwaarde boven een simpel ja/nee

FORMATTING VOORBEELDEN:
✓ GOED: "Je kunt **maandag t/m vrijdag van 9:00-17:00** bij ons terecht [Bron 1]. Wil je liever telefonisch contact? Bel dan 020-1234567."
✗ FOUT: "Volgens de informatie in bron 1 zijn onze openingstijden maandag tot en met vrijdag."
✓ GOED: "Het retourneren werkt als volgt:\n1. Log in op je account\n2. Ga naar 'Mijn bestellingen'\n3. Kies 'Retourneren'"
✗ FOUT: "Voor retourneren moet je inloggen en dan naar bestellingen gaan."

STRIKTE BEPERKINGEN:
- NOOIT medisch, juridisch of financieel advies geven
- NOOIT informatie verzinnen die niet in de bronnen staat
- Bij onduidelijke vragen: vraag om verduidelijking
- Als informatie ontbreekt: geef aan wat je wel weet en verwijs naar contactopties

${topSources.length > 0 ? `BESCHIKBARE BRONNEN (${topSources.length}):\n${contextString}` : "GEEN RELEVANTE BRONNEN BESCHIKBAAR - Verwijs vriendelijk naar contactopties"}

${conversationContext}
HUIDIGE VRAAG: ${question}

ANTWOORD (gebruik markdown formatting, wees direct en behulpzaam):`;

  // Combine custom personality prompt with context instructions
  let finalSystemPrompt: string;

  if (systemPrompt) {
    // User has a custom mainPrompt (personality) - combine it with context instructions
    console.log(
      "✅ Using custom mainPrompt (personality) combined with context instructions"
    );
    finalSystemPrompt = `${systemPrompt}

${contextInstructions}`;
  } else {
    // No custom prompt - use default personality + context instructions
    const defaultPersonality =
      "Je bent een behulpzame AI-assistent die vragen beantwoordt op basis van de gegeven context informatie.";
    finalSystemPrompt = `${defaultPersonality}

${contextInstructions}`;
  }

  try {
    // Build messages array with conversation history
    const messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [
      {
        role: "system",
        content: finalSystemPrompt,
      },
    ];

    // Add conversation history (last 8 messages max for better context while limiting tokens)
    const recentHistory = conversationHistory.slice(-8);
    messages.push(
      ...recentHistory.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }))
    );

    // Add current question
    messages.push({
      role: "user",
      content: question,
    });

    const completion = await openai.chat.completions.create({
      model: model,
      temperature: temperature !== undefined ? temperature : 0.7, // Use provided temperature or default to 0.7
      max_tokens: maxTokens,
      messages,
    });

    let answer =
      completion.choices[0].message.content ||
      "Sorry, ik kan deze vraag niet beantwoorden op basis van de beschikbare informatie in onze knowledge base.";

    const tokensUsed = completion.usage?.total_tokens || 0;

    // Post-process answer for better formatting
    answer = postProcessAnswer(answer, topSources);

    // Calculate improved confidence with multiple factors
    const confidence = calculateConfidence(context, answer, question);

    // Generate suggested follow-up questions
    const suggestedQuestions = generateSuggestedQuestions(
      question,
      answer,
      context
    );

    // Response validation to prevent hallucinations
    // Re-enabled with improved validation logic
    console.log("🔍 Validating response for factual grounding...");

    const validation = await validateResponse(question, answer, topSources);

    console.log(
      `📊 Validation result: ${validation.isGrounded ? "✅ Grounded" : "❌ Not grounded"}`
    );
    console.log(`   Confidence: ${(validation.confidence * 100).toFixed(0)}%`);
    console.log(`   Reasoning: ${validation.reasoning}`);

    if (validation.unsupportedClaims.length > 0) {
      console.log(
        `   ⚠️  Unsupported claims: ${validation.unsupportedClaims.join(", ")}`
      );
    }

    // Lower threshold (0.4) - balance between quality and availability
    // Only reject if validation confidence is very low AND it's marked as not grounded
    if (!validation.isGrounded && validation.confidence < 0.4) {
      console.log("⚠️ Response validation FAILED - using fallback");
      console.log(
        `   Unsupported claims: ${validation.unsupportedClaims.join(", ")}`
      );

      // Return fallback response if validation fails
      return {
        answer:
          "Sorry, ik kan deze vraag niet beantwoorden op basis van de beschikbare informatie in onze knowledge base. " +
          "De informatie die ik heb gevonden is niet specifiek genoeg om een betrouwbaar antwoord te geven.",
        tokensUsed,
        confidence: 0.1,
        suggestedQuestions: [],
      };
    }

    // Adjust final confidence based on validation
    const finalConfidence = Math.min(confidence, validation.confidence);

    console.log(
      `✅ Response validation passed (final confidence: ${(finalConfidence * 100).toFixed(0)}%)`
    );

    return {
      answer,
      tokensUsed,
      confidence: finalConfidence,
      suggestedQuestions,
    };
  } catch (error) {
    logger.error("Error generating AI response", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error(
      `Failed to generate AI response: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Post-process answer for better formatting and link extraction
 */
function postProcessAnswer(
  answer: string,
  sources: Array<{ title: string; url?: string; type: string }>
): string {
  let processed = answer;

  // Cleanup common issues
  processed = processed.trim();

  // Remove phrases that sound too robotic
  const roboticPhrases = [
    "Op basis van de bronnen",
    "Volgens de verstrekte informatie",
    "Op grond van de context",
    "Uit de bronnen blijkt",
  ];

  roboticPhrases.forEach((phrase) => {
    const regex = new RegExp(`^${phrase}[,:]?\\s*`, "i");
    processed = processed.replace(regex, "");
  });

  // Ensure proper markdown formatting
  // Fix bullet points
  processed = processed.replace(/^- /gm, "• ");
  processed = processed.replace(/^\* /gm, "• ");

  // Add line breaks before bullet points if missing
  processed = processed.replace(/([.!?])\s+(•)/g, "$1\n\n$2");

  // Ensure URLs are properly formatted
  sources.forEach((source, index) => {
    if (source.url) {
      // Replace [Bron X] with clickable link if URL available
      const sourceRef = `[Bron ${index + 1}]`;
      const linkText = source.title || source.url;
      // Don't replace if already has URL
      if (!processed.includes(source.url)) {
        processed = processed.replace(
          new RegExp(sourceRef.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
          `${sourceRef}`
        );
      }
    }
  });

  return processed;
}

/**
 * Generate suggested follow-up questions based on context
 */
function generateSuggestedQuestions(
  question: string,
  answer: string,
  context: Array<{ type: string; title: string; content: string }>
): string[] {
  const suggestions: string[] = [];

  // Question type detection
  const questionLower = question.toLowerCase();
  const isWhatQuestion =
    questionLower.includes("wat") || questionLower.includes("welke");
  const isHowQuestion = questionLower.includes("hoe");
  const isPriceQuestion =
    questionLower.includes("prijs") || questionLower.includes("kost");
  const isWhenQuestion =
    questionLower.includes("wanneer") || questionLower.includes("tijd");

  // Generate contextual suggestions based on available sources
  const hasDocuments = context.some((c) => c.type === "document");
  const hasWebsites = context.some(
    (c) => c.type === "website" || c.type === "website_page"
  );
  const hasFAQs = context.some((c) => c.type === "faq");

  // Generic but contextual suggestions
  if (isPriceQuestion && suggestions.length < 3) {
    suggestions.push("Welke betalingsmethoden accepteren jullie?");
    suggestions.push("Zijn er kortingen beschikbaar?");
  }

  if (isHowQuestion && suggestions.length < 3) {
    suggestions.push("Wat zijn de volgende stappen?");
    suggestions.push("Hoelang duurt dit proces?");
  }

  if (isWhatQuestion && suggestions.length < 3) {
    suggestions.push("Hoe kan ik dit gebruiken?");
    suggestions.push("Wat zijn de voordelen hiervan?");
  }

  // Contact/support suggestions if nothing specific
  if (suggestions.length < 2) {
    suggestions.push("Hoe kan ik contact opnemen voor meer informatie?");
    suggestions.push("Waar kan ik meer details vinden?");
  }

  return suggestions.slice(0, 3); // Max 3 suggestions
}

/**
 * Calculate improved confidence with multiple factors
 */
function calculateConfidence(
  knowledgeResults: Array<{
    score: number;
    type: string;
    title: string;
    content: string;
  }>,
  answer: string,
  question: string
): number {
  if (knowledgeResults.length === 0) return 0.1;

  // Factor 1: Best result score (60% gewicht) - most important!
  const bestScore = knowledgeResults[0]?.score || 0;

  // Factor 2: Answer completeness (20% gewicht)
  const answerLength = answer.length;
  let completenessScore = Math.min(answerLength / 200, 1.0);

  // Don't penalize short answers too much if we have good matches
  if (answerLength < 50 && bestScore > 0.7) {
    completenessScore = Math.max(completenessScore, 0.7); // Minimum 70% if we have good matches
  }

  // Factor 3: Aantal resultaten (20% gewicht)
  const resultCountScore = Math.min(knowledgeResults.length / 3, 1.0);

  // Base confidence - heavily weighted towards best match
  let confidence =
    bestScore * 0.6 + completenessScore * 0.2 + resultCountScore * 0.2;

  // Boost confidence significantly if we have a very strong match
  if (bestScore >= 0.9) {
    confidence = Math.min(confidence * 1.3, 1.0); // 30% boost for excellent matches
  } else if (bestScore >= 0.7) {
    confidence = Math.min(confidence * 1.15, 1.0); // 15% boost for good matches
  }

  // Always return at least 30% confidence if we have any results with score > 0.5
  if (knowledgeResults.some((r) => r.score > 0.5)) {
    confidence = Math.max(confidence, 0.3);
  }

  return Math.min(Math.max(confidence, 0.1), 1.0);
}

/**
 * Improved response validation with better prompts and scoring
 * Checks if answer is grounded in provided context
 */
async function validateResponse(
  question: string,
  answer: string,
  context: Array<{
    title: string;
    content: string;
    score: number;
  }>
): Promise<{
  isGrounded: boolean;
  confidence: number;
  unsupportedClaims: string[];
  reasoning: string;
}> {
  try {
    // Build context strings for validation
    const contextStrings = context.map(
      (item, index) =>
        `[Bron ${index + 1}] ${item.title} (Relevantie: ${(item.score * 100).toFixed(0)}%):\n${item.content}`
    );

    const validationPrompt = `Je bent een fact-checker die controleert of antwoorden gefundeerd zijn in de gegeven bronnen.

BRONNEN:
${contextStrings.join("\n\n---\n\n")}

VRAAG: ${question}

ANTWOORD OM TE VALIDEREN:
${answer}

VALIDATIE CRITERIA:
1. Alle feitelijke claims in het antwoord moeten DIRECT afleidbaar zijn uit de bronnen
2. Generieke/veilige uitspraken zonder claims zijn TOEGESTAAN (bijv. "Neem contact op voor meer info")
3. Parafraseringen en samenvatting van bronnen zijn TOEGESTAAN
4. Gevolgtrekkingen uit expliciete feiten in bronnen zijn TOEGESTAAN
5. Informatie die NIET in de bronnen staat is NIET toegestaan

SCORING:
- confidence: 1.0 = Volledig onderbouwd door bronnen
- confidence: 0.7-0.9 = Grotendeels onderbouwd, kleine gevolgtrekkingen
- confidence: 0.4-0.6 = Deels onderbouwd, bevat algemene info
- confidence: 0.0-0.3 = Niet onderbouwd, hallucinations

Geef een JSON response (zonder extra tekst):
{
  "isGrounded": true/false,
  "confidence": 0.0-1.0,
  "unsupportedClaims": ["specifieke claim die niet in bronnen staat"],
  "reasoning": "korte uitleg van de score"
}`;

    if (!openai) {
      throw new Error("OpenAI client not initialized");
    }

    const validation = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Je bent een nauwkeurige fact-checker. Wees streng maar niet te streng - generieke adviezen zonder claims zijn OK.",
        },
        {
          role: "user",
          content: validationPrompt,
        },
      ],
      temperature: 0.1, // Low temperature for consistent validation
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(validation.choices[0].message.content || "{}");

    return {
      isGrounded: result.isGrounded !== false, // Default to true if ambiguous
      confidence: result.confidence || 0.5,
      unsupportedClaims: result.unsupportedClaims || [],
      reasoning: result.reasoning || "No reasoning provided",
    };
  } catch (error) {
    console.error("Error in response validation:", error);
    // If validation fails, be lenient and assume response is OK
    return {
      isGrounded: true,
      confidence: 0.6, // Medium confidence when validation fails
      unsupportedClaims: [],
      reasoning: "Validation process failed - accepting response",
    };
  }
}

// ============================================================================
// RAG Chatbot Integration Functions
// ============================================================================

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * Genereert een AI response met RAG (Retrieval Augmented Generation)
 * Dit is de all-in-one functie die je in je chatbot kunt gebruiken
 */
export async function generateChatbotResponse(
  userMessage: string,
  assistantId: string,
  conversationHistory: ChatMessage[] = [],
  systemPrompt?: string
): Promise<{
  response: string;
  sources: any[];
  tokensUsed: number;
}> {
  // Import search functions dynamically to avoid circular dependencies
  const { searchRelevantContext, formatContextForAI } =
    await import("./search");

  // Stap 1: Zoek relevante context
  const searchResults = await searchRelevantContext(userMessage, assistantId, {
    limit: 5,
    threshold: 0.7,
  });

  // Stap 2: Format context voor AI
  const contextString = formatContextForAI(searchResults);

  // Stap 3: Bouw de messages array
  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        systemPrompt ||
        `Je bent een behulpzame AI assistent. 
Gebruik de onderstaande context om vragen te beantwoorden. 
Als de context niet voldoende informatie bevat, geef dat dan eerlijk aan.

${contextString}`,
    },
    ...conversationHistory,
    {
      role: "user",
      content: userMessage,
    },
  ];

  if (!openai) {
    throw new Error("OpenAI API key not configured");
  }

  // Stap 4: Genereer AI response
  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: messages as any,
    temperature: 0.7,
    max_tokens: 500,
  });

  const response = completion.choices[0].message.content || "";
  const tokensUsed = completion.usage?.total_tokens || 0;

  return {
    response,
    sources: searchResults,
    tokensUsed,
  };
}

/**
 * Streaming variant voor real-time responses
 * Retourneert een stream die je in een API route kunt gebruiken
 */
export async function streamChatbotResponse(
  userMessage: string,
  assistantId: string,
  conversationHistory: ChatMessage[] = [],
  systemPrompt?: string
): Promise<{
  stream: AsyncIterable<string>;
  sources: any[];
}> {
  // Import search functions dynamically
  const { searchRelevantContext, formatContextForAI } =
    await import("./search");

  // Zoek context
  const searchResults = await searchRelevantContext(userMessage, assistantId);
  const contextString = formatContextForAI(searchResults);

  // Bouw messages
  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        systemPrompt || `Je bent een behulpzame AI assistent. ${contextString}`,
    },
    ...conversationHistory,
    {
      role: "user",
      content: userMessage,
    },
  ];

  if (!openai) {
    throw new Error("OpenAI API key not configured");
  }

  // Create streaming completion
  const stream = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: messages as any,
    temperature: 0.7,
    max_tokens: 500,
    stream: true,
  });

  // Convert OpenAI stream naar string stream
  async function* generateStream() {
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }

  return {
    stream: generateStream(),
    sources: searchResults,
  };
}

/**
 * Complete chat request handler met conversation history
 * Gebruik dit als voorbeeld voor je API routes
 */
export async function handleChatRequest(
  userMessage: string,
  assistantId: string,
  sessionId: string
) {
  try {
    // Import prisma
    const { prisma } = await import("./search");

    // Haal conversatie geschiedenis op
    const session = await prisma.conversationSession.findUnique({
      where: { sessionId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 10, // Laatste 10 berichten
        },
      },
    });

    // Converteer naar ChatMessage format
    const conversationHistory: ChatMessage[] =
      session?.messages.map((msg) => ({
        role: msg.messageType === "USER" ? "user" : "assistant",
        content: msg.content,
      })) || [];

    // Genereer response
    const result = await generateChatbotResponse(
      userMessage,
      assistantId,
      conversationHistory
    );

    // Sla berichten op
    await prisma.conversationMessage.create({
      data: {
        sessionId,
        messageType: "USER",
        content: userMessage,
        createdAt: new Date(),
      },
    });

    await prisma.conversationMessage.create({
      data: {
        sessionId,
        messageType: "ASSISTANT",
        content: result.response,
        tokensUsed: result.tokensUsed,
        model: CHAT_MODEL,
        createdAt: new Date(),
      },
    });

    // Update session
    await prisma.conversationSession.update({
      where: { sessionId },
      data: {
        lastActivity: new Date(),
        messageCount: { increment: 2 },
        totalTokens: { increment: result.tokensUsed },
      },
    });

    return {
      success: true,
      message: result.response,
      sources: result.sources,
      tokensUsed: result.tokensUsed,
    };
  } catch (error) {
    console.error("Chat request error:", error);
    throw error;
  }
}
