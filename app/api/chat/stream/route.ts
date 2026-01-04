/**
 * Streaming Chat API Endpoint
 *
 * Provides real-time streaming responses for chat messages.
 * Uses Server-Sent Events (SSE) for progressive response delivery.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { streamChatbotResponse } from "@/lib/openai";
import { z } from "zod";
import { getCorsHeaders } from "@/lib/cors";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/redis-rate-limiter";
import { checkGracePeriod } from "@/lib/subscription";
import { logger } from "@/lib/logger";
import {
  checkConversationQuota,
  trackConversationSession,
  updateConversationSession,
} from "@/lib/usage-tracking";
import { randomBytes } from "crypto";

const messageSchema = z.object({
  question: z.string().min(1).max(1000),
  sessionId: z.string().optional(),
  metadata: z
    .object({
      userAgent: z.string().optional(),
      referrer: z.string().optional(),
    })
    .optional(),
});

/**
 * POST /api/chat/stream
 *
 * Streams chat responses in real-time using Server-Sent Events (SSE).
 *
 * Request body:
 * {
 *   "question": string,
 *   "sessionId": string (optional),
 *   "metadata": { userAgent, referrer } (optional)
 * }
 *
 * Response format (SSE):
 * data: {"type":"content","content":"Hello"}
 * data: {"type":"content","content":" world"}
 * data: {"type":"sources","sources":[...]}
 * data: {"type":"done"}
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  let corsHeaders = getCorsHeaders(origin, []);

  try {
    const body = await request.json();
    const { question, sessionId, metadata } = messageSchema.parse(body);

    // Get API key from headers
    const apiKey = request.headers.get("X-Chatbot-API-Key");

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Missing API key" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Lookup chatbot settings by API key
    let chatbotSettings;
    try {
      chatbotSettings = await db.chatbotSettings.findUnique({
        where: { apiKey },
        include: {
          users: {
            select: {
              id: true,
              subscriptionStatus: true,
              subscriptionPlan: true,
              trialEndDate: true,
              subscriptionEndDate: true,
              subscriptionCanceled: true,
              isActive: true,
            },
          },
          assistants: {
            select: {
              id: true,
              name: true,
              personality: true,
              instructions: true,
              language: true,
            },
          },
        },
      });
    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
      logger.error("Database error:", {
        message: errorMessage,
      });
      return NextResponse.json(
        { success: false, error: "Database connection error" },
        { status: 500, headers: corsHeaders }
      );
    }

    if (!chatbotSettings || !chatbotSettings.isActive) {
      return NextResponse.json(
        { success: false, error: "Invalid API key" },
        { status: 401, headers: corsHeaders }
      );
    }

    const user = chatbotSettings.users;
    if (!user || !user.isActive) {
      corsHeaders = getCorsHeaders(origin, chatbotSettings.allowedDomains);
      return NextResponse.json(
        { success: false, error: "User account is inactive" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Check subscription and grace period
    const graceCheck = checkGracePeriod(
      user.subscriptionStatus,
      user.subscriptionEndDate,
      user.trialEndDate
    );

    if (
      !graceCheck.isActive &&
      user.subscriptionStatus !== "TRIALING" &&
      user.subscriptionStatus !== "ACTIVE"
    ) {
      corsHeaders = getCorsHeaders(origin, chatbotSettings.allowedDomains);
      return NextResponse.json(
        {
          success: false,
          error: "Subscription expired",
          gracePeriodEnded: true,
        },
        { status: 402, headers: corsHeaders }
      );
    }

    const assistant = chatbotSettings.assistants;
    if (!assistant) {
      return NextResponse.json(
        { success: false, error: "No assistant configured" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Update CORS headers with allowed domains
    corsHeaders = getCorsHeaders(origin, chatbotSettings.allowedDomains);

    // Rate limiting: 60 requests per minute per API key
    const rateLimitKey = `chat:${apiKey}`;
    const rateLimit = await checkRateLimit(rateLimitKey, 60, 60);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded" },
        {
          status: 429,
          headers: {
            ...corsHeaders,
            ...getRateLimitHeaders(rateLimit),
          },
        }
      );
    }

    // Check conversation quota
    const quotaCheck = await checkConversationQuota(user.id, user.subscriptionPlan);
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: quotaCheck.message,
          quotaExceeded: true,
        },
        { status: 402, headers: corsHeaders }
      );
    }

    // Get or create session
    let session;
    const providedSessionId = sessionId || `session-${randomBytes(16).toString("hex")}`;

    session = await db.conversationSession.findFirst({
      where: {
        sessionId: providedSessionId,
        assistantId: assistant.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 4, // Last 4 messages for context (reduced from 8)
        },
      },
    });

    if (!session) {
      session = await db.conversationSession.create({
        data: {
          sessionId: providedSessionId,
          assistantId: assistant.id,
          userId: user.id,
          lastActivityAt: new Date(),
        },
        include: {
          messages: true,
        },
      });

      // Track new session
      await trackConversationSession(user.id);
    } else {
      // Update last activity
      await updateConversationSession(session.id);
    }

    // Create user message
    const userMessage = await db.conversationMessage.create({
      data: {
        sessionId: session.id,
        content: question,
        role: "USER",
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    // Prepare conversation history
    const conversationHistory = session.messages
      .reverse()
      .map((msg) => ({
        role: msg.role === "USER" ? ("user" as const) : ("assistant" as const),
        content: msg.content,
      }));

    // Build system prompt
    const systemPrompt = [
      assistant.instructions || "You are a helpful AI assistant.",
      assistant.personality ? `Personality: ${assistant.personality}` : "",
      assistant.language ? `Respond in ${assistant.language}.` : "",
    ]
      .filter(Boolean)
      .join(" ");

    logger.debug("[STREAM_CHAT_POST] Generating streaming response", {
      question: question.substring(0, 100),
      assistantId: assistant.id,
      sessionId: session.sessionId,
    });

    // Generate streaming response
    const { stream, sources } = await streamChatbotResponse(
      question,
      assistant.id,
      conversationHistory,
      systemPrompt
    );

    // Create readable stream for SSE
    let fullResponse = "";
    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // Stream content chunks
          for await (const chunk of stream) {
            fullResponse += chunk;

            // Send content chunk via SSE
            const data = JSON.stringify({
              type: "content",
              content: chunk,
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          // Send sources
          const sourcesData = JSON.stringify({
            type: "sources",
            sources: sources,
          });
          controller.enqueue(encoder.encode(`data: ${sourcesData}\n\n`));

          // Save assistant message to database
          const assistantMessage = await db.conversationMessage.create({
            data: {
              sessionId: session.id,
              content: fullResponse,
              role: "ASSISTANT",
            },
          });

          // Save sources
          if (sources && sources.length > 0) {
            const documentNames = sources.map((s) => s.documentName);
            const documents = await db.document.findMany({
              where: { name: { in: documentNames } },
            });

            const documentMap = new Map(documents.map((doc) => [doc.name, doc]));

            const sourcesToCreate = sources
              .map((source) => {
                const document = documentMap.get(source.documentName);
                return document
                  ? {
                      messageId: assistantMessage.id,
                      documentId: document.id,
                      chunkContent: source.documentName,
                      relevanceScore: source.relevanceScore || 0.8,
                    }
                  : null;
              })
              .filter((s): s is NonNullable<typeof s> => s !== null);

            if (sourcesToCreate.length > 0) {
              await db.conversationSource.createMany({
                data: sourcesToCreate,
              });
            }
          }

          // Send completion signal
          const doneData = JSON.stringify({
            type: "done",
            messageId: assistantMessage.id,
            sessionId: session.sessionId,
          });
          controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));

          controller.close();

          logger.debug("[STREAM_CHAT_POST] Stream completed", {
            responseLength: fullResponse.length,
            sourcesCount: sources.length,
          });
        } catch (error) {
          logger.error("[STREAM_CHAT_POST] Stream error:", error);

          const errorData = JSON.stringify({
            type: "error",
            error: "Failed to generate response",
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    // Return SSE response
    return new NextResponse(readableStream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no", // Disable buffering in nginx
      },
    });
  } catch (error) {
    logger.error("[STREAM_CHAT_POST] Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request body", details: error.errors },
        { status: 400, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(origin, []),
  });
}
