import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import crypto from "crypto";
import { WebhookEventType, DEFAULT_RETRY_CONFIG } from "@/lib/webhooks/types";

/**
 * GET /api/webhooks
 * List all webhook configurations for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only admins can manage webhooks (you can adjust this based on your requirements)
    if (user.role !== "ADMIN" && user.role !== "SUPERUSER") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Fetch all webhook configs
    const webhooks = await db.webhookConfig.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            deliveries: true,
          },
        },
      },
    });

    // Don't expose the secret in the response
    const sanitizedWebhooks = webhooks.map((webhook) => ({
      ...webhook,
      secret: undefined,
      hasSecret: !!webhook.secret,
      deliveryCount: webhook._count.deliveries,
    }));

    return NextResponse.json({
      success: true,
      webhooks: sanitizedWebhooks,
    });
  } catch (error) {
    logger.error("Failed to fetch webhooks", {
      context: { error: error instanceof Error ? error.message : String(error) },
    });

    return NextResponse.json(
      { success: false, error: "Failed to fetch webhooks" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/webhooks
 * Create a new webhook configuration
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only admins can manage webhooks
    if (user.role !== "ADMIN" && user.role !== "SUPERUSER") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { url, events, description, isActive, maxRetries, retryDelays, headers } =
      body;

    // Validation
    if (!url || !url.startsWith("http")) {
      return NextResponse.json(
        { error: "Valid webhook URL is required" },
        { status: 400 }
      );
    }

    if (!events || !Array.isArray(events) || events.length === 0) {
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

    // Generate a secure secret for the webhook
    const secret = crypto.randomBytes(32).toString("hex");

    // Create webhook config
    const webhook = await db.webhookConfig.create({
      data: {
        url,
        secret,
        events,
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
        maxRetries: maxRetries || DEFAULT_RETRY_CONFIG.maxRetries,
        retryDelays: retryDelays || DEFAULT_RETRY_CONFIG.retryDelays,
        headers: headers || null,
      },
    });

    logger.info("Webhook configuration created", {
      context: {
        webhookId: webhook.id,
        url: webhook.url,
        events: webhook.events,
        createdBy: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      webhook: {
        ...webhook,
        secret: webhook.secret, // Return secret only on creation
      },
      message:
        "Webhook created successfully. Store the secret securely - it will not be shown again.",
    });
  } catch (error) {
    logger.error("Failed to create webhook", {
      context: { error: error instanceof Error ? error.message : String(error) },
    });

    return NextResponse.json(
      { success: false, error: "Failed to create webhook" },
      { status: 500 }
    );
  }
}
