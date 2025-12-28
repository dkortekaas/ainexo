import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import * as Sentry from "@sentry/nextjs";

/**
 * GDPR Data Export Endpoint (Article 20 - Right to Data Portability)
 *
 * Allows users to export all their personal data in a portable format (JSON).
 *
 * GET /api/users/[id]/export
 *
 * Security:
 * - Requires authentication
 * - Users can only export their own data (or admins can export any user)
 * - Sensitive data (passwords, 2FA secrets) are excluded
 *
 * Returns JSON with:
 * - User profile
 * - All assistants/chatbot settings
 * - All conversations and messages
 * - All documents
 * - All notifications
 * - Usage statistics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  let userId: string | undefined;
  let requestingUserId: string | undefined;

  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }
    const { id } = await params;
    userId = id;
    requestingUserId = session.user.id;

    // Authorization check: Users can only export their own data, unless they're admin
    if (userId !== requestingUserId && session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: "Forbidden - You can only export your own data",
        },
        { status: 403 }
      );
    }

    // Fetch user with all related data
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        // OAuth accounts
        accounts: {
          select: {
            provider: true,
            providerAccountId: true,
            type: true,
            // Exclude tokens for security
          },
        },

        // Chatbot settings (AI assistants)
        chatbot_settings: {
          include: {
            actionButtons: true,
          },
        },

        // Notifications
        notifications: {
          orderBy: { createdAt: "desc" },
        },

        // Invitations (received and sent)
        receivedInvitations: {
          include: {
            company: {
              select: { name: true },
            },
            sender: {
              select: { name: true, email: true },
            },
          },
        },
        sentInvitations: {
          include: {
            company: {
              select: { name: true },
            },
            recipient: {
              select: { name: true, email: true },
            },
          },
        },

        // Subscription notifications
        subscriptionNotifications: {
          orderBy: { sentAt: "desc" },
        },

        // Company
        company: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch conversations separately (they don't have direct user FK)
    // We identify them via chatbot settings
    const assistantIds = user.chatbot_settings.map((s) => s.id);

    const conversations = await db.conversationSession.findMany({
      where: {
        assistantId: { in: assistantIds },
      },
      include: {
        messages: {
          include: {
            sources: {
              include: {
                document: {
                  select: {
                    name: true,
                    type: true,
                  },
                },
              },
            },
            feedback: true,
          },
        },
      },
      orderBy: { startedAt: "desc" },
    });

    // Fetch documents associated with user's assistants via projects
    const projectIds = user.chatbot_settings
      .map((s) => s.projectId)
      .filter(Boolean) as string[];

    let documents: any[] = [];
    if (projectIds.length > 0) {
      const projectDocs = await db.project_documents.findMany({
        where: {
          projectId: { in: projectIds },
        },
        include: {
          documents: {
            select: {
              id: true,
              name: true,
              originalName: true,
              type: true,
              mimeType: true,
              fileSize: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });

      documents = projectDocs.map((pd) => pd.documents);
    }

    // Calculate usage statistics
    const totalMessages = conversations.reduce(
      (sum, conv) => sum + conv.messageCount,
      0
    );
    const totalTokens = conversations.reduce(
      (sum, conv) => sum + conv.totalTokens,
      0
    );

    // Build export data (exclude sensitive fields)
    const exportData = {
      exportedAt: new Date().toISOString(),
      exportVersion: "1.0",
      userId: user.id,

      // User Profile
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
        twoFactorMethod: user.twoFactorMethod,
        twoFactorVerified: user.twoFactorVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isActive: user.isActive,
        // Exclude: password, twoFactorSecret, twoFactorBackupCodes, resetToken
      },

      // Subscription Information
      subscription: {
        status: user.subscriptionStatus,
        plan: user.subscriptionPlan,
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId,
        trialStartDate: user.trialStartDate,
        trialEndDate: user.trialEndDate,
        subscriptionStartDate: user.subscriptionStartDate,
        subscriptionEndDate: user.subscriptionEndDate,
        subscriptionCancelAt: user.subscriptionCancelAt,
        subscriptionCanceled: user.subscriptionCanceled,
      },

      // Connected Accounts (OAuth)
      connectedAccounts: user.accounts,

      // AI Assistants / Chatbot Settings
      assistants: user.chatbot_settings.map((assistant) => ({
        id: assistant.id,
        name: assistant.name,
        description: assistant.description,
        mainPrompt: assistant.mainPrompt,
        temperature: assistant.temperature,
        welcomeMessage: assistant.welcomeMessage,
        placeholderText: assistant.placeholderText,
        primaryColor: assistant.primaryColor,
        position: assistant.position,
        createdAt: assistant.createdAt,
        updatedAt: assistant.updatedAt,
        actionButtons: assistant.actionButtons,
      })),

      // Conversations
      conversations: conversations.map((conv) => ({
        id: conv.id,
        sessionId: conv.sessionId,
        assistantId: conv.assistantId,
        startedAt: conv.startedAt,
        lastActivity: conv.lastActivity,
        messageCount: conv.messageCount,
        totalTokens: conv.totalTokens,
        avgResponseTime: conv.avgResponseTime,
        rating: conv.rating,
        ratingNotes: conv.ratingNotes,
        ratedAt: conv.ratedAt,
        messages: conv.messages.map((msg) => ({
          id: msg.id,
          type: msg.messageType,
          content: msg.content,
          responseTime: msg.responseTime,
          tokensUsed: msg.tokensUsed,
          model: msg.model,
          confidence: msg.confidence,
          createdAt: msg.createdAt,
          sources: msg.sources.map((src) => ({
            documentName: src.document.name,
            documentType: src.document.type,
            relevanceScore: src.relevanceScore,
          })),
          feedback: msg.feedback,
        })),
      })),

      // Documents
      documents,

      // Notifications
      notifications: user.notifications.map((notif) => ({
        id: notif.id,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        priority: notif.priority,
        isRead: notif.isRead,
        createdAt: notif.createdAt,
      })),

      // Invitations
      invitations: {
        received: user.receivedInvitations,
        sent: user.sentInvitations,
      },

      // Subscription Notifications
      subscriptionNotifications: user.subscriptionNotifications,

      // Company
      company: user.company,

      // Usage Statistics
      statistics: {
        totalAssistants: user.chatbot_settings.length,
        totalConversations: conversations.length,
        totalMessages,
        totalTokens,
        totalDocuments: documents.length,
        totalNotifications: user.notifications.length,
        accountAge: Math.floor(
          (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        ), // days
      },

      // Metadata
      metadata: {
        exportDuration: `${Date.now() - startTime}ms`,
        dataSize: 0, // Will be calculated below
      },
    };

    // Calculate data size
    const dataSize = Buffer.byteLength(JSON.stringify(exportData), "utf8");
    exportData.metadata.dataSize = dataSize;

    // Log export for audit trail
    await db.systemLog.create({
      data: {
        level: "INFO",
        message: "User data exported (GDPR Article 20)",
        context: {
          userId,
          requestedBy: requestingUserId,
          dataSize,
          exportDuration: `${Date.now() - startTime}ms`,
        },
        userId,
      },
    });

    // Return data as downloadable JSON file
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="user-data-export-${userId}-${Date.now()}.json"`,
        "X-Export-Duration": `${Date.now() - startTime}ms`,
        "X-Data-Size": `${dataSize} bytes`,
      },
    });
  } catch (error) {
    console.error("Data export error:", error);

    Sentry.captureException(error, {
      tags: {
        endpoint: "/api/users/[id]/export",
      },
      extra: {
        userId,
      },
    });

    return NextResponse.json(
      {
        error: "Failed to export user data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
