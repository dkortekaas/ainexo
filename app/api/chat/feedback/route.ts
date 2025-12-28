import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { getCorsHeaders, validateCorsOrigin } from "@/lib/cors";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/redis-rate-limiter";

const feedbackSchema = z.object({
  messageId: z.string().min(1),
  sessionId: z.string().min(1),
  rating: z.enum(["thumbs_up", "thumbs_down"]),
  feedback: z.string().optional(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
});

export async function POST(request: NextRequest) {
  // Get origin early for CORS headers in error cases
  const origin = request.headers.get("origin");
  let corsHeaders = getCorsHeaders(origin, []);

  try {
    const body = await request.json();
    const { messageId, sessionId, rating, feedback, userAgent, ipAddress } =
      feedbackSchema.parse(body);

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

    // Lookup chatbot settings by API key for CORS validation
    const chatbotSettings = await db.chatbotSettings.findUnique({
      where: { apiKey },
      select: {
        allowedDomains: true,
        isActive: true,
      },
    });

    if (!chatbotSettings || !chatbotSettings.isActive) {
      return NextResponse.json(
        { success: false, error: "Invalid API key" },
        {
          status: 401,
          headers: corsHeaders,
        }
      );
    }

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

    // Check rate limiting (Redis-based, more lenient for feedback - 30 requests per minute)
    const rateLimitResult = await checkRateLimit(`feedback:${apiKey}`, 30, 60000);

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

    // Verify the message exists and belongs to the correct session
    const message = await db.conversationMessage.findFirst({
      where: {
        id: messageId,
        sessionId: sessionId,
        messageType: "ASSISTANT",
      },
      include: {
        session: {
          include: {
            // Get assistant info through session
          },
        },
      },
    });

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message not found" },
        {
          status: 404,
          headers: corsHeaders,
        }
      );
    }

    // Check if feedback already exists for this message
    const existingFeedback = await db.messageFeedback.findFirst({
      where: {
        messageId: messageId,
      },
    });

    if (existingFeedback) {
      // Update existing feedback
      const updatedFeedback = await db.messageFeedback.update({
        where: {
          id: existingFeedback.id,
        },
        data: {
          rating: rating.toUpperCase() as any,
          feedback: feedback || null,
          updatedAt: new Date(),
        },
      });

      console.log(`📝 Updated feedback for message ${messageId}: ${rating}`);
    } else {
      // Create new feedback
      const newFeedback = await db.messageFeedback.create({
        data: {
          messageId: messageId,
          sessionId: sessionId,
          rating: rating.toUpperCase() as any,
          feedback: feedback || null,
          userAgent: userAgent || request.headers.get("user-agent"),
          ipAddress:
            ipAddress ||
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip"),
        },
      });

      console.log(`📝 New feedback for message ${messageId}: ${rating}`);
    }

    // If it's a thumbs down, analyze the poor response
    if (rating === "thumbs_down") {
      await analyzePoorResponse(messageId, message, feedback);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Feedback recorded successfully",
      },
      {
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("Error in feedback endpoint:", error);

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

/**
 * Analyze poor responses and suggest improvements
 */
async function analyzePoorResponse(
  messageId: string,
  message: any,
  userFeedback?: string
) {
  try {
    console.log(`🔍 Analyzing poor response for message ${messageId}`);

    // Get the conversation context
    const conversationContext = await db.conversationMessage.findMany({
      where: {
        sessionId: message.sessionId,
        createdAt: {
          lte: message.createdAt,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 10, // Last 10 messages for context
    });

    // Get sources used for this response
    const sources = await db.conversationSource.findMany({
      where: {
        messageId: messageId,
      },
      include: {
        document: true,
      },
    });

    // Create analysis record
    const analysis = await db.poorResponseAnalysis.create({
      data: {
        messageId: messageId,
        sessionId: message.sessionId,
        originalQuestion:
          conversationContext.find((m) => m.messageType === "USER")?.content ||
          "",
        originalAnswer: message.content,
        userFeedback: userFeedback || null,
        confidence: message.confidence || 0,
        tokensUsed: message.tokensUsed || 0,
        model: message.model || "unknown",
        sourcesUsed: sources.length,
        analysisStatus: "PENDING",
      },
    });

    console.log(`📊 Created analysis record ${analysis.id} for poor response`);

    // Generate improvement suggestions
    await generateImprovementSuggestions(
      analysis.id,
      message,
      sources,
      userFeedback
    );
  } catch (error) {
    console.error("Error analyzing poor response:", error);
  }
}

/**
 * Generate improvement suggestions for poor responses
 */
async function generateImprovementSuggestions(
  analysisId: string,
  message: any,
  sources: any[],
  userFeedback?: string
) {
  try {
    console.log(
      `💡 Generating improvement suggestions for analysis ${analysisId}`
    );

    const suggestions = [];

    // Analyze confidence score
    if (message.confidence < 0.5) {
      suggestions.push({
        type: "LOW_CONFIDENCE",
        description:
          "Het antwoord had een lage confidence score. Overweeg meer relevante bronnen toe te voegen aan de knowledge base.",
        priority: "HIGH",
      });
    }

    // Analyze sources
    if (sources.length === 0) {
      suggestions.push({
        type: "NO_SOURCES",
        description:
          "Geen bronnen gebruikt voor dit antwoord. Voeg relevante informatie toe aan de knowledge base.",
        priority: "HIGH",
      });
    } else if (sources.length < 2) {
      suggestions.push({
        type: "INSUFFICIENT_SOURCES",
        description:
          "Weinig bronnen gebruikt. Overweeg meer relevante documenten toe te voegen.",
        priority: "MEDIUM",
      });
    }

    // Analyze answer length
    if (message.content.length < 50) {
      suggestions.push({
        type: "TOO_SHORT",
        description:
          "Antwoord was te kort. Overweeg meer context toe te voegen aan de knowledge base.",
        priority: "MEDIUM",
      });
    } else if (message.content.length > 1000) {
      suggestions.push({
        type: "TOO_LONG",
        description:
          "Antwoord was te lang. Overweeg de maxResponseLength instelling aan te passen.",
        priority: "LOW",
      });
    }

    // Analyze user feedback
    if (userFeedback) {
      const feedbackLower = userFeedback.toLowerCase();
      if (
        feedbackLower.includes("niet relevant") ||
        feedbackLower.includes("off-topic")
      ) {
        suggestions.push({
          type: "IRRELEVANT_CONTENT",
          description:
            "Gebruiker vond het antwoord niet relevant. Controleer de zoekalgoritme en knowledge base kwaliteit.",
          priority: "HIGH",
        });
      }
      if (
        feedbackLower.includes("onvolledig") ||
        feedbackLower.includes("incomplete")
      ) {
        suggestions.push({
          type: "INCOMPLETE_ANSWER",
          description:
            "Antwoord was onvolledig. Voeg meer gedetailleerde informatie toe aan de knowledge base.",
          priority: "HIGH",
        });
      }
    }

    // Save suggestions
    for (const suggestion of suggestions) {
      await db.improvementSuggestion.create({
        data: {
          analysisId: analysisId,
          type: suggestion.type as any,
          description: suggestion.description,
          priority: suggestion.priority as any,
          status: "PENDING",
        },
      });
    }

    // Update analysis status
    await db.poorResponseAnalysis.update({
      where: {
        id: analysisId,
      },
      data: {
        analysisStatus: "COMPLETED",
        suggestionsCount: suggestions.length,
      },
    });

    console.log(`✅ Generated ${suggestions.length} improvement suggestions`);
  } catch (error) {
    console.error("Error generating improvement suggestions:", error);

    // Update analysis status to failed
    await db.poorResponseAnalysis.update({
      where: {
        id: analysisId,
      },
      data: {
        analysisStatus: "FAILED",
      },
    });
  }
}

export async function OPTIONS(request: NextRequest) {
  // For OPTIONS preflight requests, we need to allow the request
  // The actual CORS validation happens in the POST request
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
