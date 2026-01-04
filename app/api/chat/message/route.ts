import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  EMBEDDINGS_ENABLED,
  generateAIResponse,
  getCachedOrGenerate,
} from "@/lib/openai";
import { searchRelevantContext, unifiedSearch } from "@/lib/search";
import { z } from "zod";
import { randomBytes } from "crypto";
import { getCorsHeaders, validateCorsOrigin } from "@/lib/cors";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/redis-rate-limiter";
import { checkGracePeriod } from "@/lib/subscription";
import { logger } from "@/lib/logger";
import {
  checkConversationQuota,
  trackConversationSession,
  updateConversationSession,
  createQuotaErrorResponse,
} from "@/lib/usage-tracking";

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

export async function POST(request: NextRequest) {
  // Get origin early for CORS headers in error cases
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
        {
          status: 401,
          headers: corsHeaders,
        }
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
        {
          status: 401,
          headers: corsHeaders,
        }
      );
    }

    // Check if user's subscription is active
    const user = chatbotSettings.users;
    if (!user || !user.isActive) {
      corsHeaders = getCorsHeaders(origin, chatbotSettings.allowedDomains);
      return NextResponse.json(
        { success: false, error: "User account is inactive" },
        {
          status: 403,
          headers: corsHeaders,
        }
      );
    }

    // Check subscription status with grace period support
    const gracePeriodCheck = checkGracePeriod(
      user.subscriptionStatus,
      user.trialEndDate,
      user.subscriptionEndDate
    );

    // Only block access if grace period has ended
    if (gracePeriodCheck.shouldBlockAccess) {
      corsHeaders = getCorsHeaders(origin, chatbotSettings.allowedDomains);
      return NextResponse.json(
        {
          success: false,
          error:
            "Subscription expired. Please renew your subscription to continue using the chatbot.",
          gracePeriod: gracePeriodCheck.isInGracePeriod
            ? {
                active: true,
                daysRemaining: gracePeriodCheck.daysRemainingInGrace,
                message: gracePeriodCheck.message,
              }
            : { active: false },
        },
        {
          status: 403,
          headers: corsHeaders,
        }
      );
    }

    // Log if in grace period (for monitoring)
    if (gracePeriodCheck.isInGracePeriod) {
      logger.debug(
        `⚠️ Widget used during grace period: ${user.id}, ${gracePeriodCheck.daysRemainingInGrace} days remaining`
      );
    }

    // Check conversation quota using usage tracking middleware
    corsHeaders = getCorsHeaders(origin, chatbotSettings.allowedDomains);
    const quotaCheck = await checkConversationQuota(
      user.id,
      chatbotSettings.id
    );

    if (!quotaCheck.allowed) {
      logger.debug(
        `🚫 Quota exceeded: ${quotaCheck.currentCount}/${quotaCheck.limit} for assistant ${chatbotSettings.id}`
      );

      // Auto-disable the assistant if quota exceeded
      if (quotaCheck.error?.code === "QUOTA_EXCEEDED") {
        await db.chatbotSettings.update({
          where: { id: chatbotSettings.id },
          data: { isActive: false },
        });
      }

      return createQuotaErrorResponse(quotaCheck, corsHeaders);
    }

    logger.debug(
      `📊 Quota check passed: ${quotaCheck.currentCount}/${quotaCheck.limit} (${quotaCheck.remaining} remaining) for assistant ${chatbotSettings.id}`
    );

    // Validate CORS origin against allowed domains
    const corsError = validateCorsOrigin(
      origin,
      chatbotSettings.allowedDomains
    );
    corsHeaders = getCorsHeaders(origin, chatbotSettings.allowedDomains);

    if (corsError) {
      return NextResponse.json(
        { success: false, error: "Origin not allowed" },
        {
          status: 403,
          headers: corsHeaders,
        }
      );
    }

    // Check rate limiting (Redis-based for horizontal scaling)
    // Use API key as the rate limit key, with limit from chatbot settings
    const rateLimit = chatbotSettings.rateLimit || 10; // requests per minute
    const rateLimitResult = await checkRateLimit(apiKey, rateLimit, 60000);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded. Please try again later.",
        },
        {
          status: 429,
          headers: {
            ...corsHeaders,
            ...getRateLimitHeaders(rateLimitResult),
          },
        }
      );
    }

    // Generate session ID if not provided - use crypto for security
    const finalSessionId =
      sessionId || `session_${randomBytes(16).toString("hex")}`;

    // Track conversation session using usage tracking middleware
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      undefined;
    await trackConversationSession(finalSessionId, chatbotSettings.id, {
      ipAddress,
      userAgent: metadata?.userAgent,
      referrer: metadata?.referrer,
    });

    // Check if question triggers any forms
    const forms = await db.contactForm.findMany({
      where: {
        assistantId: chatbotSettings.id,
        enabled: true,
      },
    });

    const questionLower = question.toLowerCase();
    const triggeredForm = forms.find((form: { triggers: unknown }) => {
      if (!form.triggers || (form.triggers as string[]).length === 0)
        return false;
      return (form.triggers as string[]).some((trigger: string) =>
        questionLower.includes(trigger.toLowerCase())
      );
    });

    // If a form is triggered, return form data instead of regular response
    if (triggeredForm) {
      logger.debug("📋 Form triggered:", { formName: triggeredForm.name });

      // Save user message
      await db.conversationMessage.create({
        data: {
          sessionId: finalSessionId,
          messageType: "USER",
          content: question,
          createdAt: new Date(),
        },
      });

      // Save form message
      const formMessage = await db.conversationMessage.create({
        data: {
          sessionId: finalSessionId,
          messageType: "FORM",
          content: `Vul het volgende formulier in: ${triggeredForm.name}`,
          formId: triggeredForm.id,
          createdAt: new Date(),
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: {
            conversationId: `conv_${randomBytes(16).toString("hex")}`,
            messageId: formMessage.id,
            answer: `Graag zou ik wat meer informatie van je willen verzamelen. Kun je het volgende formulier invullen?`,
            sessionId: finalSessionId,
            formData: {
              id: triggeredForm.id,
              name: triggeredForm.name,
              description: triggeredForm.description,
              fields: triggeredForm.fields,
              redirectUrl: triggeredForm.redirectUrl,
            },
            responseTime: 0,
          },
        },
        {
          headers: corsHeaders,
        }
      );
    }

    // Search for relevant information in all knowledge base tables
    let sources: any[] = [];
    let answer =
      "Sorry, ik kan deze vraag niet beantwoorden op basis van de beschikbare informatie in onze knowledge base.";
    let tokensUsed = 0;
    let confidence = 0;
    let finalTokensUsed = 0;
    let assistantMessage: any = null;
    let aiResponse: any = null;

    try {
      logger.debug("🔍 Searching for question:", { question });
      logger.debug("🤖 Chatbot ID:", { chatbotId: chatbotSettings.id });

      // Check if we have any FAQs for this assistant
      const totalFaqs = await db.fAQ.count({
        where: { assistantId: chatbotSettings.id },
      });
      logger.debug("📊 Total FAQs in database for this assistant:", { totalFaqs });

      // If no FAQs exist, create some test data
      if (totalFaqs === 0) {
        logger.debug("🔧 Creating test FAQ data...");
        try {
          await db.fAQ.createMany({
            data: [
              {
                assistantId: chatbotSettings.id,
                question: "Wat zijn de prijzen?",
                answer:
                  "Onze prijzen variëren afhankelijk van het pakket. Neem contact met ons op voor een offerte op maat.",
                enabled: true,
                order: 1,
              },
              {
                assistantId: chatbotSettings.id,
                question: "Hoe kan ik contact opnemen?",
                answer:
                  "Je kunt contact met ons opnemen via email (info@example.com) of telefoon (0123-456789).",
                enabled: true,
                order: 2,
              },
              {
                assistantId: chatbotSettings.id,
                question: "Wat zijn jullie openingstijden?",
                answer:
                  "Wij zijn geopend van maandag tot vrijdag van 9:00 tot 17:00 uur.",
                enabled: true,
                order: 3,
              },
            ],
          });
          logger.debug("✅ Test FAQ data created");
        } catch (createError) {
          const errorMessage = createError instanceof Error ? createError.message : String(createError);
          logger.error("❌ Error creating test FAQ data:", {
            message: errorMessage,
          });
        }
      }

      // Search all knowledge base tables
      logger.debug("🧠 Searching all knowledge base tables...");
      logger.debug("🔍 Search parameters:", {
        question: question,
        assistantId: chatbotSettings.id,
        limit: 8,
        threshold: 0.5, // 50% minimum relevance voor unified search
        useAI: EMBEDDINGS_ENABLED,
      });

      const knowledgeResults = await searchRelevantContext(
        question,
        chatbotSettings.id,
        {
          limit: 8,
          threshold: 0.5, // 50% minimum relevance
        }
      );

      logger.debug("📚 Found knowledge base results:", { count: knowledgeResults.length });
      if (knowledgeResults.length > 0) {
        logger.debug("📋 Knowledge base results details:");
        knowledgeResults.forEach((result, index) => {
          logger.debug(`  ${index + 1}. [${result.type}] ${result.title}`);
          logger.debug(`     Relevance: ${(result.score * 100).toFixed(1)}%`);
          logger.debug(
            `     Content preview: ${result.content.substring(0, 100)}...`
          );
          if (result.url) logger.debug(`     URL: ${result.url}`);
        });
      }

      if (knowledgeResults.length > 0) {
        // Use AI to generate response based on knowledge base context (with caching)
        try {
          logger.debug("🤖 Generating AI response...");
          logger.debug("⚙️ AI Settings:", {
            model: "gpt-4o-mini",
            temperature: chatbotSettings.temperature || 0.7,
            maxTokens: chatbotSettings.maxResponseLength || 500,
            language: chatbotSettings.language || "nl",
            tone: chatbotSettings.tone || "professional",
            hasCustomPrompt: !!chatbotSettings.mainPrompt,
          });

          // Get conversation history for context (last 10 messages = 5 exchanges for better context)
          const conversationHistory = await db.conversationMessage.findMany({
            where: { sessionId: finalSessionId },
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
              messageType: true,
              content: true,
            },
          });

          // Reverse to get chronological order and map to correct format
          const historyForAI = conversationHistory.reverse().map((msg: { messageType: string; content: string }) => ({
            role:
              msg.messageType === "USER"
                ? ("user" as const)
                : ("assistant" as const),
            content: msg.content,
          }));

          logger.debug(
            `💬 Including ${historyForAI.length} previous messages for context`
          );

          aiResponse = await getCachedOrGenerate(question, knowledgeResults, {
            model: "gpt-4o-mini",
            temperature: chatbotSettings.temperature || 0.7,
            maxTokens: chatbotSettings.maxResponseLength || 500,
            systemPrompt: chatbotSettings.mainPrompt || undefined,
            language: chatbotSettings.language || "nl",
            tone: chatbotSettings.tone || "professional",
            conversationHistory: historyForAI,
          });

          // Only accept AI response if confidence is high enough
          // Raised threshold to 0.55 (55%) for better quality responses
          if (aiResponse.confidence >= 0.55) {
            answer = aiResponse.answer;
            tokensUsed = aiResponse.tokensUsed;
            confidence = aiResponse.confidence;
            sources = aiResponse.sources; // Sources komen al van de cache functie

            // Optionally update project context cache confidence if using projects

            logger.debug("✅ AI response accepted (high confidence)");
            logger.debug("🎯 Final Answer:", { answer });
            logger.debug("📊 Confidence Score:", {
              confidence: (confidence * 100).toFixed(1) + "%",
            });
            logger.debug("🔢 Tokens Used:", { tokensUsed });
            logger.debug("📚 Sources Used:", {
              count: sources.length,
              relevance: sources
                .map((s: { relevanceScore: number }) => `${(s.relevanceScore * 100).toFixed(0)}%`)
                .join(", "),
            });
          } else {
            logger.debug("❌ AI response rejected (low confidence):", {
              confidence: (aiResponse.confidence * 100).toFixed(1) + "%",
            });
            logger.debug("🔄 Using fallback message instead");
            // Keep the default fallback message
          }
        } catch (aiError) {
          const errorMessage = aiError instanceof Error ? aiError.message : String(aiError);
          logger.error("❌ AI response generation failed:", {
            message: errorMessage,
          });
          logger.debug("🔄 Falling back to best knowledge base result...");

          // Fallback to best knowledge base result
          const bestResult = knowledgeResults[0];
          if (bestResult) {
            answer = bestResult.content;
            sources = [
              {
                documentName: bestResult.title,
                documentType: bestResult.type,
                relevanceScore: bestResult.score,
                url: bestResult.url,
              },
            ];
            confidence = bestResult.score;
            logger.debug("✅ Using fallback result:", { title: bestResult.title });
          }
        }
      }

      // If no knowledge base results found, don't provide fallback answers
      if (knowledgeResults.length === 0) {
        logger.debug(
          "❌ No knowledge base results found - will use fallback message"
        );
        // Keep the original fallback message - don't try other methods
      }

      // Handle greeting messages - only if no knowledge base results found
      if (
        knowledgeResults.length === 0 &&
        (question.toLowerCase().includes("hallo") ||
          question.toLowerCase().includes("hello") ||
          question.toLowerCase().includes("hi"))
      ) {
        logger.debug(
          "👋 Detected greeting message with no knowledge base results"
        );
        answer =
          chatbotSettings.welcomeMessage || "Hallo! Hoe kan ik je helpen?";
        sources = [];
        confidence = 1.0;
        logger.debug("✅ Using welcome message");
      }

      // If no good answer found, provide a clear fallback message
      if (
        !answer ||
        answer ===
          "Sorry, ik kan deze vraag niet beantwoorden op basis van de beschikbare informatie."
      ) {
        logger.debug(
          "❌ No suitable answer found, using knowledge base fallback"
        );
        answer =
          "Sorry, ik kan deze vraag niet beantwoorden op basis van de beschikbare informatie in onze knowledge base. Neem contact op met ons team voor persoonlijke assistentie.";
        sources = [];
        confidence = 0.1; // Very low confidence since no knowledge base info was found
      }
    } catch (searchError) {
      const errorMessage = searchError instanceof Error ? searchError.message : String(searchError);
      logger.error("❌ Search error:", {
        message: errorMessage,
      });
      // Keep the fallback message if search fails
    }

    logger.debug("🎯 Final answer:", { preview: answer.substring(0, 100) + "..." });
    logger.debug("📚 Sources found:", { count: sources.length });

    // Save conversation session and messages
    try {
      const startTime = Date.now();
      finalTokensUsed =
        tokensUsed || Math.ceil((question.length + answer.length) / 4); // Use actual tokens or estimate

      // Get conversation session (already created by trackConversationSession)
      const conversationSession = await db.conversationSession.findUnique({
        where: { sessionId: finalSessionId },
      });

      if (conversationSession) {
        // Update session with message count and tokens using usage tracking
        // This increments messageCount by 2 (user message + assistant response)
        await updateConversationSession(finalSessionId, finalTokensUsed);
      }

      // Save user message
      const userMessage = await db.conversationMessage.create({
        data: {
          sessionId: finalSessionId,
          messageType: "USER",
          content: question,
          createdAt: new Date(),
        },
      });

      // Save assistant response
      assistantMessage = await db.conversationMessage.create({
        data: {
          sessionId: finalSessionId,
          messageType: "ASSISTANT",
          content: answer,
          responseTime: Date.now() - startTime,
          tokensUsed: finalTokensUsed,
          model: "gpt-4o-mini", // Updated model
          confidence: confidence,
          createdAt: new Date(),
        },
      });

      // Save sources for the assistant message (optimized to avoid N+1 queries)
      if (sources && sources.length > 0) {
        // Batch fetch all documents by names (prevents N+1 query problem)
        const documentNames = sources.map((s: any) => s.documentName);
        const documents = await db.document.findMany({
          where: { name: { in: documentNames } },
        });

        // Create a map for quick lookup
        const documentMap = new Map(
          documents.map((doc: { name: string }) => [doc.name, doc])
        );

        // Batch create conversation sources
        const sourcesToCreate = sources
          .map((source: any) => {
            const document = documentMap.get(source.documentName) as { id: string } | undefined;
            if (document) {
              return {
                messageId: assistantMessage.id,
                documentId: document.id,
                chunkContent: source.documentName,
                relevanceScore: source.relevanceScore || 0.8,
              };
            }
            return null;
          })
          .filter((s): s is NonNullable<typeof s> => s !== null);

        // Create all sources in a single transaction
        if (sourcesToCreate.length > 0) {
          await db.conversationSource.createMany({
            data: sourcesToCreate,
          });
        }
      }

      logger.debug("✅ Conversation saved successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("❌ Error saving conversation:", {
        message: errorMessage,
      });
      // Don't fail the request if saving fails
    }

    // Extract relevant URL from sources (website pages only)
    let relevantUrl: string | undefined = undefined;
    if (sources && sources.length > 0) {
      // Find first source with a URL (likely a website page)
      const sourceWithUrl = sources.find((s: any) => s.url);
      if (sourceWithUrl) {
        relevantUrl = sourceWithUrl.url;
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          conversationId: `conv_${randomBytes(16).toString("hex")}`,
          messageId:
            assistantMessage?.id || `msg_${randomBytes(12).toString("hex")}`,
          answer,
          relevantUrl, // Only include URL if available
          responseTime: Date.now(),
          sessionId: finalSessionId,
          confidence: confidence,
          tokensUsed: finalTokensUsed,
          feedbackEnabled: true, // Enable feedback for this response
          suggestedQuestions: (aiResponse as any)?.suggestedQuestions || [], // Add suggested questions if available
        },
      },
      {
        headers: corsHeaders,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Error in chat message endpoint:", {
      message: errorMessage,
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request data" },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  // For OPTIONS preflight requests, we need to allow the request
  // The actual CORS validation happens in the POST request
  // This is standard practice since OPTIONS doesn't have API key yet
  const origin = request.headers.get("origin");

  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-Chatbot-API-Key",
      "Access-Control-Max-Age": "86400",
    },
  });
}
