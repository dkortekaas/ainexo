/**
 * Streaming support for AI responses
 * Provides real-time streaming of AI-generated answers for better UX
 */

import OpenAI from "openai";
import { openai } from "./openai";

export interface StreamChunk {
  type: 'start' | 'content' | 'sources' | 'suggestions' | 'end' | 'error';
  content?: string;
  sources?: Array<{
    documentName: string;
    documentType: string;
    relevanceScore: number;
    url?: string;
  }>;
  suggestedQuestions?: string[];
  confidence?: number;
  error?: string;
}

/**
 * Generate AI response with streaming support
 * Returns an async generator that yields chunks of the response
 */
export async function* generateStreamingResponse(
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
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  } = {}
): AsyncGenerator<StreamChunk> {
  if (!openai) {
    yield { type: 'error', error: 'OpenAI API key not configured' };
    return;
  }

  const {
    model = 'gpt-4o-mini',
    temperature = 0.7,
    maxTokens = 500,
    systemPrompt,
    language = 'nl',
    tone = 'professional',
    conversationHistory = [],
  } = options;

  try {
    // Yield start event with sources
    const topSources = context
      .filter((r) => r.score >= 0.35)
      .slice(0, 8);

    yield {
      type: 'start',
      sources: topSources
        .filter((r) => r.score >= 0.4)
        .slice(0, 3)
        .map((result) => ({
          documentName: result.title,
          documentType: result.type,
          relevanceScore: result.score,
          url: result.url,
        })),
    };

    // Build prompt (similar to generateAIResponse)
    const contextString = topSources
      .map((item, index) => {
        const sourceNum = index + 1;
        const metadata = [
          `Relevantie: ${(item.score * 100).toFixed(0)}%`,
          item.type && `Type: ${item.type}`,
          item.url && `URL: ${item.url}`,
        ]
          .filter(Boolean)
          .join(" | ");

        return `[Bron ${sourceNum}] ${item.title}
${metadata}
${item.content}
---`;
      })
      .join("\n\n");

    const toneInstructions: Record<string, string> = {
      professional: "Wees professioneel, formeel en zakelijk in je communicatie.",
      friendly: "Wees vriendelijk, warm en benaderbaar in je communicatie.",
      casual: "Wees informeel, relaxed en casual in je communicatie.",
      helpful: "Wees extra behulpzaam, geduldig en ondersteunend.",
      expert: "Wees deskundig, autoritair en toon expertise in je antwoorden.",
    };

    const toneInstruction = toneInstructions[tone] || toneInstructions.professional;

    const conversationContext = conversationHistory.length > 0
      ? `\n\nGESPREKSGESCHIEDENIS (laatste ${conversationHistory.length} berichten):\n${conversationHistory
          .map((msg) => `${msg.role === 'user' ? 'Gebruiker' : 'Assistent'}: ${msg.content}`)
          .join('\n')}\n`
      : '';

    const contextInstructions = `
BELANGRIJKE RICHTLIJNEN VOOR ANTWOORDEN:
1. Baseer je antwoord ALLEEN op de informatie in de onderstaande bronnen
2. Gebruik markdown formatting voor betere leesbaarheid
3. Citeer bronnen met [Bron 1], [Bron 2], etc.
4. Begin direct met het antwoord
5. ${toneInstruction}

${topSources.length > 0 ? `BESCHIKBARE BRONNEN (${topSources.length}):\n${contextString}` : 'GEEN RELEVANTE BRONNEN BESCHIKBAAR'}

${conversationContext}
HUIDIGE VRAAG: ${question}

ANTWOORD (gebruik markdown formatting):`;

    const finalSystemPrompt = systemPrompt
      ? `${systemPrompt}\n\n${contextInstructions}`
      : `Je bent een behulpzame AI-assistent die vragen beantwoordt op basis van de gegeven context informatie.\n\n${contextInstructions}`;

    // Build messages array
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      {
        role: "system",
        content: finalSystemPrompt,
      },
    ];

    // Add conversation history
    const recentHistory = conversationHistory.slice(-5);
    messages.push(...recentHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })));

    // Add current question
    messages.push({
      role: "user",
      content: question,
    });

    // Stream the response
    const stream = await openai.chat.completions.create({
      model,
      temperature,
      max_tokens: maxTokens,
      messages,
      stream: true,
    });

    let fullAnswer = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';

      if (content) {
        fullAnswer += content;
        yield {
          type: 'content',
          content,
        };
      }
    }

    // Generate suggested questions based on full answer
    // Simple implementation - could be improved
    const suggestedQuestions: string[] = [];
    const questionLower = question.toLowerCase();

    if (questionLower.includes('prijs') || questionLower.includes('kost')) {
      suggestedQuestions.push('Welke betalingsmethoden accepteren jullie?');
    }
    if (questionLower.includes('hoe')) {
      suggestedQuestions.push('Wat zijn de volgende stappen?');
    }
    if (suggestedQuestions.length < 2) {
      suggestedQuestions.push('Hoe kan ik contact opnemen voor meer informatie?');
    }

    // Yield suggestions
    if (suggestedQuestions.length > 0) {
      yield {
        type: 'suggestions',
        suggestedQuestions: suggestedQuestions.slice(0, 3),
      };
    }

    // Calculate confidence
    const bestScore = context[0]?.score || 0;
    const confidence = Math.min(bestScore * 1.2, 1.0);

    // Yield end event
    yield {
      type: 'end',
      confidence,
    };

  } catch (error) {
    console.error('Streaming error:', error);
    yield {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown streaming error',
    };
  }
}

/**
 * Convert streaming chunks to Server-Sent Events (SSE) format
 */
export function chunkToSSE(chunk: StreamChunk): string {
  return `data: ${JSON.stringify(chunk)}\n\n`;
}
