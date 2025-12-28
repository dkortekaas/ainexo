/**
 * Webhook Delivery Service
 *
 * Handles the delivery of webhooks to configured endpoints with:
 * - Retry logic with exponential backoff
 * - Signature generation for security
 * - Timeout handling
 * - Comprehensive logging
 */

import crypto from "crypto";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  WebhookPayload,
  WebhookConfig,
  DEFAULT_RETRY_CONFIG,
  WEBHOOK_TIMEOUT_MS,
  WEBHOOK_SIGNATURE_HEADER,
  WEBHOOK_TIMESTAMP_HEADER,
  WEBHOOK_EVENT_HEADER,
} from "./types";

/**
 * Generate HMAC-SHA256 signature for webhook payload
 */
export function generateWebhookSignature(
  payload: string,
  secret: string,
  timestamp: number
): string {
  const data = `${timestamp}.${payload}`;
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  timestamp: number,
  maxAgeSeconds: number = 300 // 5 minutes
): boolean {
  // Check timestamp is recent (prevent replay attacks)
  const now = Math.floor(Date.now() / 1000);
  if (now - timestamp > maxAgeSeconds) {
    return false;
  }

  const expectedSignature = generateWebhookSignature(
    payload,
    secret,
    timestamp
  );
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Deliver webhook to endpoint
 */
async function deliverWebhook(
  config: WebhookConfig,
  payload: WebhookPayload
): Promise<{
  success: boolean;
  status?: number;
  body?: string;
  error?: string;
}> {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const payloadString = JSON.stringify(payload);
    const signature = generateWebhookSignature(
      payloadString,
      config.secret,
      timestamp
    );

    // Prepare headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      [WEBHOOK_SIGNATURE_HEADER]: signature,
      [WEBHOOK_TIMESTAMP_HEADER]: timestamp.toString(),
      [WEBHOOK_EVENT_HEADER]: payload.event,
      "User-Agent": "AI-Chat-Webhooks/1.0",
    };

    // Add custom headers if configured
    if (config.headers) {
      Object.assign(headers, config.headers);
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

    try {
      const response = await fetch(config.url, {
        method: "POST",
        headers,
        body: payloadString,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseBody = await response.text();

      if (response.ok) {
        return {
          success: true,
          status: response.status,
          body: responseBody,
        };
      }

      return {
        success: false,
        status: response.status,
        body: responseBody,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      if (fetchError.name === "AbortError") {
        return {
          success: false,
          error: `Timeout after ${WEBHOOK_TIMEOUT_MS}ms`,
        };
      }

      throw fetchError;
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || String(error),
    };
  }
}

/**
 * Send webhook with automatic retry logic
 */
export async function sendWebhook(
  config: WebhookConfig,
  payload: WebhookPayload
): Promise<void> {
  // Create delivery record
  const delivery = await db.webhookDelivery.create({
    data: {
      webhookConfigId: config.id,
      eventType: payload.event,
      payload: payload as any,
      status: "PENDING",
      attempts: 0,
    },
  });

  const retryConfig = config.retryConfig || DEFAULT_RETRY_CONFIG;
  let attempt = 0;
  let lastError: string | undefined;

  while (attempt <= retryConfig.maxRetries) {
    attempt++;

    logger.info("Attempting webhook delivery", {
      context: {
        deliveryId: delivery.id,
        webhookConfigId: config.id,
        eventType: payload.event,
        attempt,
        maxRetries: retryConfig.maxRetries,
      },
    });

    // Update delivery record
    await db.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        attempts: attempt,
        lastAttemptAt: new Date(),
        status: attempt === 1 ? "PENDING" : "RETRYING",
      },
    });

    // Attempt delivery
    const result = await deliverWebhook(config, payload);

    if (result.success) {
      // Success! Update record and exit
      await db.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "SUCCESS",
          responseStatus: result.status,
          responseBody: result.body?.substring(0, 1000), // Limit response body size
          error: null,
          nextRetryAt: null,
        },
      });

      logger.info("Webhook delivered successfully", {
        context: {
          deliveryId: delivery.id,
          webhookConfigId: config.id,
          eventType: payload.event,
          attempt,
          responseStatus: result.status,
        },
      });

      return;
    }

    // Failed - log error
    lastError = result.error;
    logger.warn("Webhook delivery failed", {
      context: {
        deliveryId: delivery.id,
        webhookConfigId: config.id,
        eventType: payload.event,
        attempt,
        error: result.error,
        status: result.status,
      },
    });

    // Check if we should retry
    if (attempt <= retryConfig.maxRetries) {
      const delayIndex = attempt - 1;
      const delay =
        retryConfig.retryDelays[delayIndex] ||
        retryConfig.retryDelays[retryConfig.retryDelays.length - 1];

      const nextRetryAt = new Date(Date.now() + delay);

      await db.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "RETRYING",
          nextRetryAt,
          error: lastError,
          responseStatus: result.status,
          responseBody: result.body?.substring(0, 1000),
        },
      });

      logger.info("Scheduling webhook retry", {
        context: {
          deliveryId: delivery.id,
          nextRetryAt,
          delayMs: delay,
        },
      });

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // All retries exhausted - mark as failed
  await db.webhookDelivery.update({
    where: { id: delivery.id },
    data: {
      status: "FAILED",
      error: lastError || "All retry attempts exhausted",
    },
  });

  logger.error("Webhook delivery failed after all retries", {
    context: {
      deliveryId: delivery.id,
      webhookConfigId: config.id,
      eventType: payload.event,
      attempts: attempt,
      lastError,
    },
  });
}

/**
 * Send webhook to all configured endpoints for a specific event type
 */
export async function triggerWebhooks(payload: WebhookPayload): Promise<void> {
  // Find all active webhook configs that subscribe to this event type
  const configs = await db.webhookConfig.findMany({
    where: {
      isActive: true,
      events: {
        has: payload.event,
      },
    },
  });

  if (configs.length === 0) {
    logger.info("No webhook configs found for event", {
      context: { eventType: payload.event },
    });
    return;
  }

  logger.info("Triggering webhooks", {
    context: {
      eventType: payload.event,
      configCount: configs.length,
    },
  });

  // Log the event
  await db.webhookEventLog.create({
    data: {
      userId: payload.data.user.id,
      eventType: payload.event,
      eventData: payload.data as any,
      triggered: configs.length > 0,
    },
  });

  // Send webhooks concurrently (they handle retries internally)
  await Promise.allSettled(
    configs.map((config) =>
      sendWebhook(
        {
          ...config,
          events: config.events as any[], // Cast to WebhookEventType[]
          description: config.description || undefined, // Convert null to undefined
          retryConfig: config.retryDelays
            ? {
                maxRetries: config.maxRetries,
                retryDelays: config.retryDelays as number[],
              }
            : DEFAULT_RETRY_CONFIG,
          headers: config.headers as Record<string, string> | undefined,
        },
        payload
      )
    )
  );
}

/**
 * Retry failed webhook deliveries
 * This can be called by a cron job to retry deliveries that failed due to temporary issues
 */
export async function retryFailedWebhooks(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const stats = {
    processed: 0,
    succeeded: 0,
    failed: 0,
  };

  // Find failed deliveries that haven't exceeded max retries
  const failedDeliveries = await db.webhookDelivery.findMany({
    where: {
      status: "FAILED",
      attempts: {
        lt: 3, // Less than max retries
      },
      createdAt: {
        // Only retry deliveries from the last 24 hours
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
    include: {
      webhookConfig: true,
    },
    take: 50, // Process max 50 at a time
  });

  for (const delivery of failedDeliveries) {
    if (!delivery.webhookConfig.isActive) {
      continue;
    }

    stats.processed++;

    try {
      await sendWebhook(
        {
          ...delivery.webhookConfig,
          events: delivery.webhookConfig.events as any[], // Cast to WebhookEventType[]
          description: delivery.webhookConfig.description || undefined, // Convert null to undefined
          retryConfig: delivery.webhookConfig.retryDelays
            ? {
                maxRetries: delivery.webhookConfig.maxRetries,
                retryDelays: delivery.webhookConfig.retryDelays as number[],
              }
            : DEFAULT_RETRY_CONFIG,
          headers: delivery.webhookConfig.headers as
            | Record<string, string>
            | undefined,
        },
        delivery.payload as unknown as WebhookPayload
      );

      stats.succeeded++;
    } catch (error) {
      stats.failed++;
      logger.error("Failed to retry webhook delivery", {
        context: {
          deliveryId: delivery.id,
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  logger.info("Webhook retry job completed", { context: stats });

  return stats;
}
