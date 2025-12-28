import { db } from "@/lib/db";
import { getUserSubscriptionStatus } from "@/lib/subscription";
import { getUsageLimit, type SubscriptionPlanType } from "@/lib/subscriptionPlans";
import { NextResponse } from "next/server";

/**
 * Usage tracking result
 */
export interface UsageCheckResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
  remaining: number;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Check conversation quota for a user/assistant
 * @param userId - User ID
 * @param assistantId - Assistant ID (optional, for per-assistant limits)
 * @returns Usage check result
 */
export async function checkConversationQuota(
  userId: string,
  assistantId?: string
): Promise<UsageCheckResult> {
  try {
    // Get user subscription status
    const subscriptionStatus = await getUserSubscriptionStatus(userId);

    // Check if subscription is expired
    if (subscriptionStatus.isExpired) {
      return {
        allowed: false,
        currentCount: 0,
        limit: 0,
        remaining: 0,
        error: {
          code: "SUBSCRIPTION_EXPIRED",
          message:
            "Je trial periode is verlopen. Upgrade naar een betaald abonnement om door te gaan.",
        },
      };
    }

    // Get conversation limit for the plan
    const conversationLimit = subscriptionStatus.conversationsLimit;

    // Unlimited plan
    if (conversationLimit === -1) {
      return {
        allowed: true,
        currentCount: 0,
        limit: -1,
        remaining: -1,
      };
    }

    // Calculate start of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Count conversations for this month
    let monthlyConversations: number;

    if (assistantId) {
      // Count for specific assistant
      monthlyConversations = await db.conversationSession.count({
        where: {
          assistantId: assistantId,
          startedAt: {
            gte: startOfMonth,
          },
        },
      });
    } else {
      // Count for all user's assistants
      const userAssistants = await db.chatbotSettings.findMany({
        where: {
          userId: userId,
        },
        select: {
          id: true,
        },
      });

      const assistantIds = userAssistants.map((a) => a.id);

      if (assistantIds.length === 0) {
        monthlyConversations = 0;
      } else {
        monthlyConversations = await db.conversationSession.count({
          where: {
            assistantId: {
              in: assistantIds,
            },
            startedAt: {
              gte: startOfMonth,
            },
          },
        });
      }
    }

    const remaining = Math.max(0, conversationLimit - monthlyConversations);
    const allowed = monthlyConversations < conversationLimit;

    if (!allowed) {
      return {
        allowed: false,
        currentCount: monthlyConversations,
        limit: conversationLimit,
        remaining: 0,
        error: {
          code: "QUOTA_EXCEEDED",
          message: `Je hebt je maandelijkse limiet van ${conversationLimit} conversaties bereikt. Upgrade je abonnement voor meer conversaties.`,
          details: {
            plan: subscriptionStatus.plan || "TRIAL",
            resetDate: new Date(
              now.getFullYear(),
              now.getMonth() + 1,
              1
            ).toISOString(),
          },
        },
      };
    }

    return {
      allowed: true,
      currentCount: monthlyConversations,
      limit: conversationLimit,
      remaining,
    };
  } catch (error) {
    console.error("Error checking conversation quota:", error);
    return {
      allowed: false,
      currentCount: 0,
      limit: 0,
      remaining: 0,
      error: {
        code: "INTERNAL_ERROR",
        message: "Er is een fout opgetreden bij het controleren van je quota.",
      },
    };
  }
}

/**
 * Track a new conversation session
 * @param sessionId - Session ID
 * @param assistantId - Assistant ID
 * @param metadata - Optional metadata (ipAddress, userAgent, referrer)
 * @returns Created session or null if failed
 */
export async function trackConversationSession(
  sessionId: string,
  assistantId: string,
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
  }
) {
  try {
    // Check if session already exists
    const existingSession = await db.conversationSession.findUnique({
      where: { sessionId },
    });

    if (existingSession) {
      // Update last activity
      await db.conversationSession.update({
        where: { sessionId },
        data: {
          lastActivity: new Date(),
        },
      });
      return existingSession;
    }

    // Create new session
    const session = await db.conversationSession.create({
      data: {
        sessionId,
        assistantId,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        referrer: metadata?.referrer,
        startedAt: new Date(),
        lastActivity: new Date(),
        messageCount: 0,
        totalTokens: 0,
        isActive: true,
      },
    });

    return session;
  } catch (error) {
    console.error("Error tracking conversation session:", error);
    return null;
  }
}

/**
 * Update conversation session message count
 * @param sessionId - Session ID
 * @param tokensUsed - Tokens used in this conversation (user + assistant)
 * @param messageIncrement - Number of messages to increment (default: 2 for user + assistant)
 */
export async function updateConversationSession(
  sessionId: string,
  tokensUsed?: number,
  messageIncrement: number = 2
) {
  try {
    await db.conversationSession.update({
      where: { sessionId },
      data: {
        lastActivity: new Date(),
        messageCount: {
          increment: messageIncrement,
        },
        ...(tokensUsed && {
          totalTokens: {
            increment: tokensUsed,
          },
        }),
      },
    });
  } catch (error) {
    console.error("Error updating conversation session:", error);
  }
}

/**
 * Create error response for quota exceeded
 * @param result - Usage check result
 * @param corsHeaders - CORS headers
 * @returns NextResponse with error
 */
export function createQuotaErrorResponse(
  result: UsageCheckResult,
  corsHeaders: Record<string, string> = {}
): NextResponse {
  if (!result.error) {
    return NextResponse.json(
      { success: false, error: "Unknown error" },
      { status: 500, headers: corsHeaders }
    );
  }

  const statusCode =
    result.error.code === "SUBSCRIPTION_EXPIRED" ? 403 : 429;

  return NextResponse.json(
    {
      success: false,
      error: result.error.code,
      message: result.error.message,
      quota: {
        current: result.currentCount,
        limit: result.limit,
        remaining: result.remaining,
      },
      ...(result.error.details && { details: result.error.details }),
    },
    {
      status: statusCode,
      headers: {
        ...corsHeaders,
        "X-Quota-Limit": result.limit.toString(),
        "X-Quota-Remaining": result.remaining.toString(),
        "X-Quota-Reset": result.error.details?.resetDate
          ? new Date(result.error.details.resetDate).toISOString()
          : "",
      },
    }
  );
}

/**
 * Usage tracking middleware for API routes
 * Checks quota before processing request
 */
export async function usageTrackingMiddleware(
  userId: string,
  assistantId?: string
): Promise<{ allowed: boolean; response?: NextResponse }> {
  const quotaCheck = await checkConversationQuota(userId, assistantId);

  if (!quotaCheck.allowed) {
    return {
      allowed: false,
      response: createQuotaErrorResponse(quotaCheck),
    };
  }

  return { allowed: true };
}

