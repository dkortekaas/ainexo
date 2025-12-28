import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { WebhookEventType } from "@/lib/webhooks/types";

/**
 * GET /api/webhooks/[id]
 * Get a specific webhook configuration
 */
export async function GET(
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
      select: { id: true, role: true },
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

    const webhook = await db.webhookConfig.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            deliveries: true,
            eventLogs: true,
          },
        },
      },
    });

    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      webhook: {
        ...webhook,
        secret: undefined, // Never expose secret in GET
        hasSecret: !!webhook.secret,
        deliveryCount: webhook._count.deliveries,
        eventLogCount: webhook._count.eventLogs,
      },
    });
  } catch (error) {
    logger.error("Failed to fetch webhook", {
      context: {
        error: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json(
      { success: false, error: "Failed to fetch webhook" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/webhooks/[id]
 * Update a webhook configuration
 */
export async function PATCH(
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
      select: { id: true, role: true },
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

    const webhook = await db.webhookConfig.findUnique({
      where: { id },
    });

    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      url,
      events,
      description,
      isActive,
      maxRetries,
      retryDelays,
      headers,
    } = body;

    // Validation
    if (url && !url.startsWith("http")) {
      return NextResponse.json(
        { error: "Valid webhook URL is required" },
        { status: 400 }
      );
    }

    if (events) {
      if (!Array.isArray(events) || events.length === 0) {
        return NextResponse.json(
          { error: "At least one event type is required" },
          { status: 400 }
        );
      }

      // Validate event types
      const validEvents = Object.values(WebhookEventType);
      const invalidEvents = events.filter((e) => !validEvents.includes(e));
      if (invalidEvents.length > 0) {
        return NextResponse.json(
          { error: `Invalid event types: ${invalidEvents.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Update webhook
    const updatedWebhook = await db.webhookConfig.update({
      where: { id },
      data: {
        ...(url && { url }),
        ...(events && { events }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        ...(maxRetries !== undefined && { maxRetries }),
        ...(retryDelays !== undefined && { retryDelays }),
        ...(headers !== undefined && { headers }),
      },
    });

    logger.info("Webhook configuration updated", {
      context: {
        webhookId: updatedWebhook.id,
        updatedBy: user.id,
        changes: Object.keys(body),
      },
    });

    return NextResponse.json({
      success: true,
      webhook: {
        ...updatedWebhook,
        secret: undefined, // Never expose secret
        hasSecret: !!updatedWebhook.secret,
      },
    });
  } catch (error) {
    logger.error("Failed to update webhook", {
      context: {
        error: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json(
      { success: false, error: "Failed to update webhook" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/webhooks/[id]
 * Delete a webhook configuration
 */
export async function DELETE(
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
      select: { id: true, role: true },
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

    const webhook = await db.webhookConfig.findUnique({
      where: { id },
    });

    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    await db.webhookConfig.delete({
      where: { id },
    });

    logger.info("Webhook configuration deleted", {
      context: {
        webhookId: id,
        deletedBy: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Webhook deleted successfully",
    });
  } catch (error) {
    logger.error("Failed to delete webhook", {
      context: {
        error: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json(
      { success: false, error: "Failed to delete webhook" },
      { status: 500 }
    );
  }
}
