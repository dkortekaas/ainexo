import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import * as Sentry from "@sentry/nextjs";
import Stripe from "stripe";

/**
 * GDPR Account Deletion Endpoint (Article 17 - Right to Erasure)
 *
 * Permanently deletes a user account and all associated personal data.
 *
 * DELETE /api/users/[id]/delete-account
 *
 * Body:
 * {
 *   "confirmation": "DELETE",  // Required confirmation
 *   "reason": "optional reason for deletion"
 * }
 *
 * Security:
 * - Requires authentication
 * - Users can only delete their own account (or admins can delete any user)
 * - Requires explicit confirmation string
 * - Creates audit log before deletion
 * - Irreversible operation
 *
 * Deletes:
 * - User account
 * - All chatbot settings/assistants
 * - All conversations and messages
 * - All notifications
 * - All invitations
 * - OAuth accounts
 * - Sessions
 * - Subscription notifications
 * - Personal data in all related tables
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  let userId: string | undefined;

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
    const requestingUserId = session.user.id;

    // Authorization check
    if (userId !== requestingUserId && session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: "Forbidden - You can only delete your own account",
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Require explicit confirmation
    if (body.confirmation !== "DELETE") {
      return NextResponse.json(
        {
          error: "Confirmation required",
          message:
            'Please confirm deletion by sending {"confirmation": "DELETE"}',
        },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        chatbot_settings: {
          select: { id: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Cancel Stripe subscription if exists
    let stripeMessage = "";
    if (user.stripeSubscriptionId) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
          apiVersion: "2025-08-27.basil",
        });
        await stripe.subscriptions.cancel(user.stripeSubscriptionId);
        stripeMessage = "Stripe subscription canceled. ";
      } catch (stripeError) {
        console.error("Stripe cancellation error:", stripeError);
        Sentry.captureException(stripeError, {
          tags: { operation: "stripe-cancellation" },
        });
        // Continue with deletion even if Stripe fails
        stripeMessage = "Warning: Stripe subscription cancellation failed. ";
      }
    }

    // Create audit log BEFORE deletion
    const auditLog = await db.systemLog.create({
      data: {
        level: "WARNING",
        message: "User account deletion initiated (GDPR Article 17)",
        context: {
          deletedUserId: userId,
          deletedUserEmail: user.email,
          deletedUserName: user.name,
          requestedBy: requestingUserId,
          reason: body.reason || "Not provided",
          stripeCustomerId: user.stripeCustomerId,
          subscriptionStatus: user.subscriptionStatus,
          accountCreatedAt: user.createdAt,
          accountAge: Math.floor(
            (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          ),
        },
        userId: requestingUserId, // Log who requested the deletion
      },
    });

    // Get assistant IDs for cleaning up conversations
    const assistantIds = user.chatbot_settings.map((s) => s.id);

    // Begin cascading deletion
    const deletionSummary = {
      user: 0,
      chatbotSettings: 0,
      actionButtons: 0,
      conversations: 0,
      conversationMessages: 0,
      conversationSources: 0,
      messageFeedback: 0,
      notifications: 0,
      invitationsReceived: 0,
      invitationsSent: 0,
      subscriptionNotifications: 0,
      accounts: 0,
      sessions: 0,
    };

    // Use transaction for atomic deletion
    await db.$transaction(async (tx) => {
      // 1. Delete conversations and related data for user's assistants
      if (assistantIds.length > 0) {
        // Delete conversation sources first
        const conversationSessions = await tx.conversationSession.findMany({
          where: { assistantId: { in: assistantIds } },
          select: { sessionId: true },
        });

        const sessionIds = conversationSessions.map((s) => s.sessionId);

        if (sessionIds.length > 0) {
          // Delete message feedback
          const messageFeedbackResult = await tx.messageFeedback.deleteMany({
            where: {
              message: {
                sessionId: { in: sessionIds },
              },
            },
          });
          deletionSummary.messageFeedback = messageFeedbackResult.count;

          // Delete conversation sources
          const conversationSourcesResult =
            await tx.conversationSource.deleteMany({
              where: {
                messageId: {
                  in: (
                    await tx.conversationMessage.findMany({
                      where: { sessionId: { in: sessionIds } },
                      select: { id: true },
                    })
                  ).map((m) => m.id),
                },
              },
            });
          deletionSummary.conversationSources = conversationSourcesResult.count;

          // Delete conversation messages
          const messagesResult = await tx.conversationMessage.deleteMany({
            where: { sessionId: { in: sessionIds } },
          });
          deletionSummary.conversationMessages = messagesResult.count;

          // Delete conversation sessions
          const conversationsResult = await tx.conversationSession.deleteMany({
            where: { sessionId: { in: sessionIds } },
          });
          deletionSummary.conversations = conversationsResult.count;
        }

        // 2. Delete action buttons for assistants
        const actionButtonsResult = await tx.actionButton.deleteMany({
          where: { assistantId: { in: assistantIds } },
        });
        deletionSummary.actionButtons = actionButtonsResult.count;

        // 3. Delete chatbot settings (assistants)
        const chatbotSettingsResult = await tx.chatbotSettings.deleteMany({
          where: { id: { in: assistantIds } },
        });
        deletionSummary.chatbotSettings = chatbotSettingsResult.count;
      }

      // 4. Delete notifications
      const notificationsResult = await tx.notification.deleteMany({
        where: { createdBy: userId },
      });
      deletionSummary.notifications = notificationsResult.count;

      // 5. Delete invitations (received and sent)
      const invitationsReceivedResult = await tx.invitation.deleteMany({
        where: { recipientId: userId },
      });
      deletionSummary.invitationsReceived = invitationsReceivedResult.count;

      const invitationsSentResult = await tx.invitation.deleteMany({
        where: { senderId: userId },
      });
      deletionSummary.invitationsSent = invitationsSentResult.count;

      // 6. Delete subscription notifications
      const subscriptionNotificationsResult =
        await tx.subscriptionNotification.deleteMany({
          where: { userId },
        });
      deletionSummary.subscriptionNotifications =
        subscriptionNotificationsResult.count;

      // 7. Delete OAuth accounts (will cascade due to onDelete: Cascade)
      const accountsResult = await tx.account.deleteMany({
        where: { userId },
      });
      deletionSummary.accounts = accountsResult.count;

      // 8. Delete sessions (will cascade due to onDelete: Cascade)
      const sessionsResult = await tx.session.deleteMany({
        where: { userId },
      });
      deletionSummary.sessions = sessionsResult.count;

      // 9. Finally, delete the user account
      // This will also cascade delete any remaining relations with onDelete: Cascade
      await tx.user.delete({
        where: { id: userId },
      });
      deletionSummary.user = 1;
    });

    // Log successful deletion
    console.log("User account deleted:", {
      userId,
      email: user.email,
      deletionSummary,
      duration: `${Date.now() - startTime}ms`,
    });

    return NextResponse.json(
      {
        success: true,
        message: `${stripeMessage}Account and all associated data permanently deleted.`,
        deletionSummary,
        metadata: {
          deletedAt: new Date().toISOString(),
          deletionDuration: `${Date.now() - startTime}ms`,
          auditLogId: auditLog.id,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Account deletion error:", error);

    Sentry.captureException(error, {
      level: "fatal",
      tags: {
        endpoint: "/api/users/[id]/delete-account",
        operation: "gdpr-deletion",
      },
      extra: {
        userId,
      },
    });

    return NextResponse.json(
      {
        error: "Failed to delete account",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
