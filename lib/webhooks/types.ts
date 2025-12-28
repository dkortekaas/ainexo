/**
 * Webhook Types and Event Definitions
 *
 * This module defines all webhook event types and payload structures
 * for subscription lifecycle events.
 */

// Webhook Event Types
export enum WebhookEventType {
  // Trial Events
  TRIAL_STARTED = "subscription.trial_started",
  TRIAL_EXPIRING = "subscription.trial_expiring",
  TRIAL_EXPIRED = "subscription.trial_expired",

  // Subscription Events
  SUBSCRIPTION_ACTIVATED = "subscription.activated",
  SUBSCRIPTION_RENEWED = "subscription.renewed",
  SUBSCRIPTION_EXPIRING = "subscription.expiring",
  SUBSCRIPTION_EXPIRED = "subscription.expired",
  SUBSCRIPTION_CANCELLED = "subscription.cancelled",

  // Grace Period Events
  GRACE_PERIOD_STARTED = "subscription.grace_period_started",
  GRACE_PERIOD_ENDING = "subscription.grace_period_ending",
  GRACE_PERIOD_ENDED = "subscription.grace_period_ended",

  // Payment Events
  PAYMENT_SUCCEEDED = "subscription.payment_succeeded",
  PAYMENT_FAILED = "subscription.payment_failed",
}

// Base webhook payload structure
export interface WebhookPayload {
  id: string; // Unique webhook delivery ID
  event: WebhookEventType;
  timestamp: string; // ISO 8601 timestamp
  data: WebhookData;
  previous?: Partial<WebhookData>; // For change events
}

// Webhook data structure
export interface WebhookData {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  subscription: {
    status: string;
    plan: string | null;
    startDate: string | null;
    endDate: string | null;
    isTrial: boolean;
    daysRemaining: number;
    gracePeriod?: {
      isInGracePeriod: boolean;
      daysRemaining: number;
      endsAt: string | null;
    };
  };
  metadata?: Record<string, any>; // Additional custom data
}

// Webhook configuration
export interface WebhookConfig {
  id: string;
  url: string;
  secret: string;
  events: WebhookEventType[];
  isActive: boolean;
  description?: string;
  retryConfig?: {
    maxRetries: number;
    retryDelays: number[]; // Delays in milliseconds
  };
  headers?: Record<string, string>; // Custom headers
}

// Webhook delivery attempt
export interface WebhookDelivery {
  id: string;
  webhookConfigId: string;
  eventType: WebhookEventType;
  payload: WebhookPayload;
  status: "pending" | "success" | "failed" | "retrying";
  attempts: number;
  lastAttemptAt: Date | null;
  nextRetryAt: Date | null;
  responseStatus?: number;
  responseBody?: string;
  error?: string;
  createdAt: Date;
}

// Webhook signature verification
export interface WebhookSignature {
  timestamp: number;
  signature: string;
}

// Default retry configuration
export const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelays: [
    1000,    // 1 second
    5000,    // 5 seconds
    30000,   // 30 seconds
  ],
};

// Webhook timeout (10 seconds)
export const WEBHOOK_TIMEOUT_MS = 10000;

// Webhook signature header name
export const WEBHOOK_SIGNATURE_HEADER = "X-Webhook-Signature";
export const WEBHOOK_TIMESTAMP_HEADER = "X-Webhook-Timestamp";
export const WEBHOOK_EVENT_HEADER = "X-Webhook-Event";
