import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { sendWebhook } from "@/lib/webhooks/delivery";
import { buildWebhookPayload } from "@/lib/webhooks/builder";
import { WebhookEventType } from "@/lib/webhooks/types";

/**
 * POST /api/webhooks/[id]/test
 * Send a test webhook to verify configuration
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        trialStartDate: true,
        trialEndDate: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "ADMIN" && user.role !== "SUPERUSER") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Await params to get the actual values
    const { id } = await params;

    // Fetch webhook config
    const webhook = await db.webhookConfig.findUnique({
      where: { id },
    });

    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    if (!webhook.isActive) {
      return NextResponse.json(
        { error: "Webhook is not active" },
        { status: 400 }
      );
    }

    // Build test payload using current user's subscription data
    const testPayload = buildWebhookPayload(
      WebhookEventType.SUBSCRIPTION_ACTIVATED, // Use a neutral test event
      {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan,
        trialStartDate: user.trialStartDate,
        trialEndDate: user.trialEndDate,
        subscriptionStartDate: user.subscriptionStartDate,
        subscriptionEndDate: user.subscriptionEndDate,
      },
      {
        test: true,
        testType: "manual",
        triggeredBy: user.id,
      }
    );

    // Override event type to indicate this is a test
    testPayload.event = "subscription.test" as WebhookEventType;

    // Send test webhook
    try {
      await sendWebhook(
        {
          ...webhook,
          events: webhook.events as any[], // Cast to WebhookEventType[]
          description: webhook.description || undefined, // Convert null to undefined
          retryConfig: webhook.retryDelays
            ? {
                maxRetries: webhook.maxRetries,
                retryDelays: webhook.retryDelays as number[],
              }
            : undefined,
          headers: webhook.headers as Record<string, string> | undefined,
        },
        testPayload
      );

      logger.info("Test webhook sent", {
        context: {
          webhookId: webhook.id,
          url: webhook.url,
          triggeredBy: user.id,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Test webhook sent successfully",
        payload: {
          ...testPayload,
          // Don't expose full payload in response for security
          data: {
            user: {
              id: testPayload.data.user.id,
              email: testPayload.data.user.email,
            },
            subscription: testPayload.data.subscription,
          },
        },
      });
    } catch (webhookError) {
      logger.error("Test webhook failed", {
        context: {
          webhookId: webhook.id,
          error:
            webhookError instanceof Error
              ? webhookError.message
              : String(webhookError),
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: "Test webhook failed",
          details:
            webhookError instanceof Error
              ? webhookError.message
              : String(webhookError),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Failed to send test webhook", {
      context: {
        error: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json(
      { success: false, error: "Failed to send test webhook" },
      { status: 500 }
    );
  }
}
