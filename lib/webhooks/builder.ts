/**
 * Webhook Payload Builder
 *
 * Utilities for building webhook payloads from subscription events
 */

import { v4 as uuidv4 } from "uuid";
import { WebhookPayload, WebhookData, WebhookEventType } from "./types";
import { checkGracePeriod } from "@/lib/subscription";

interface UserData {
  id: string;
  email: string;
  name: string | null;
  subscriptionStatus: string;
  subscriptionPlan: string | null;
  trialStartDate?: Date | null;
  trialEndDate?: Date | null;
  subscriptionStartDate?: Date | null;
  subscriptionEndDate?: Date | null;
}

/**
 * Calculate days remaining until subscription end
 */
function calculateDaysRemaining(endDate: Date | null): number {
  if (!endDate) return 0;

  const now = new Date();
  const daysRemaining = Math.max(
    0,
    Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  return daysRemaining;
}

/**
 * Build webhook data from user subscription information
 */
export function buildWebhookData(
  user: UserData,
  metadata?: Record<string, any>
): WebhookData {
  const isTrial = user.subscriptionStatus === "TRIAL";
  const endDate = isTrial ? user.trialEndDate : user.subscriptionEndDate;
  const startDate = isTrial ? user.trialStartDate : user.subscriptionStartDate;
  const daysRemaining = calculateDaysRemaining(endDate || null);

  // Check grace period status
  const gracePeriodCheck = checkGracePeriod(
    user.subscriptionStatus,
    user.trialEndDate,
    user.subscriptionEndDate
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    subscription: {
      status: user.subscriptionStatus,
      plan: user.subscriptionPlan,
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate ? endDate.toISOString() : null,
      isTrial,
      daysRemaining,
      gracePeriod: {
        isInGracePeriod: gracePeriodCheck.isInGracePeriod,
        daysRemaining: gracePeriodCheck.daysRemainingInGrace,
        endsAt: gracePeriodCheck.gracePeriodEndsAt
          ? gracePeriodCheck.gracePeriodEndsAt.toISOString()
          : null,
      },
    },
    metadata,
  };
}

/**
 * Build complete webhook payload
 */
export function buildWebhookPayload(
  eventType: WebhookEventType,
  user: UserData,
  metadata?: Record<string, any>,
  previousData?: Partial<WebhookData>
): WebhookPayload {
  return {
    id: uuidv4(),
    event: eventType,
    timestamp: new Date().toISOString(),
    data: buildWebhookData(user, metadata),
    previous: previousData,
  };
}

/**
 * Helper functions for common webhook events
 */

export function buildTrialStartedPayload(user: UserData): WebhookPayload {
  return buildWebhookPayload(WebhookEventType.TRIAL_STARTED, user);
}

export function buildTrialExpiringPayload(
  user: UserData,
  daysRemaining: number
): WebhookPayload {
  return buildWebhookPayload(WebhookEventType.TRIAL_EXPIRING, user, {
    daysRemaining,
    notificationType: `${daysRemaining}_days`,
  });
}

export function buildTrialExpiredPayload(user: UserData): WebhookPayload {
  return buildWebhookPayload(WebhookEventType.TRIAL_EXPIRED, user);
}

export function buildSubscriptionActivatedPayload(
  user: UserData,
  previousStatus?: string
): WebhookPayload {
  const payload = buildWebhookPayload(
    WebhookEventType.SUBSCRIPTION_ACTIVATED,
    user
  );

  if (previousStatus) {
    payload.previous = {
      subscription: {
        status: previousStatus,
      } as any,
    };
  }

  return payload;
}

export function buildSubscriptionRenewedPayload(
  user: UserData,
  previousEndDate?: Date
): WebhookPayload {
  const payload = buildWebhookPayload(
    WebhookEventType.SUBSCRIPTION_RENEWED,
    user
  );

  if (previousEndDate) {
    payload.previous = {
      subscription: {
        endDate: previousEndDate.toISOString(),
      } as any,
    };
  }

  return payload;
}

export function buildSubscriptionExpiringPayload(
  user: UserData,
  daysRemaining: number
): WebhookPayload {
  return buildWebhookPayload(WebhookEventType.SUBSCRIPTION_EXPIRING, user, {
    daysRemaining,
    notificationType: `${daysRemaining}_days`,
  });
}

export function buildSubscriptionExpiredPayload(
  user: UserData
): WebhookPayload {
  return buildWebhookPayload(WebhookEventType.SUBSCRIPTION_EXPIRED, user);
}

export function buildSubscriptionCancelledPayload(
  user: UserData,
  reason?: string
): WebhookPayload {
  return buildWebhookPayload(WebhookEventType.SUBSCRIPTION_CANCELLED, user, {
    reason,
  });
}

export function buildGracePeriodStartedPayload(user: UserData): WebhookPayload {
  return buildWebhookPayload(WebhookEventType.GRACE_PERIOD_STARTED, user);
}

export function buildGracePeriodEndingPayload(
  user: UserData,
  daysRemaining: number
): WebhookPayload {
  return buildWebhookPayload(WebhookEventType.GRACE_PERIOD_ENDING, user, {
    daysRemaining,
  });
}

export function buildGracePeriodEndedPayload(user: UserData): WebhookPayload {
  return buildWebhookPayload(WebhookEventType.GRACE_PERIOD_ENDED, user);
}

export function buildPaymentSucceededPayload(
  user: UserData,
  paymentInfo?: {
    amount?: number;
    currency?: string;
    transactionId?: string;
  }
): WebhookPayload {
  return buildWebhookPayload(WebhookEventType.PAYMENT_SUCCEEDED, user, {
    payment: paymentInfo,
  });
}

export function buildPaymentFailedPayload(
  user: UserData,
  error?: {
    code?: string;
    message?: string;
  }
): WebhookPayload {
  return buildWebhookPayload(WebhookEventType.PAYMENT_FAILED, user, {
    error,
  });
}
