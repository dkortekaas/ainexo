import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  sendSubscriptionExpiringEmail,
  sendSubscriptionExpiredEmail,
} from "@/lib/email";
import { logger } from "@/lib/logger";
import {
  triggerWebhooks,
  buildTrialExpiringPayload,
  buildTrialExpiredPayload,
  buildSubscriptionExpiringPayload,
  buildSubscriptionExpiredPayload,
  buildGracePeriodStartedPayload,
} from "@/lib/webhooks";

/**
 * Subscription Expiration Notification Cron Job
 *
 * This endpoint should be called daily (preferably at 9 AM local time)
 * to check for expiring subscriptions and send notification emails.
 *
 * Notifications are sent at:
 * - 7 days before expiration
 * - 3 days before expiration
 * - 1 day before expiration
 * - On expiration day
 * - 1 day after expiration (final reminder)
 *
 * Setup:
 * 1. Vercel Cron: Add to vercel.json:
 *    {
 *      "crons": [{
 *        "path": "/api/cron/subscription-notifications",
 *        "schedule": "0 9 * * *"
 *      }]
 *    }
 *
 * 2. External Cron (e.g., cron-job.org):
 *    - URL: https://your-domain.com/api/cron/subscription-notifications
 *    - Method: POST
 *    - Header: X-Cron-Secret: your-secret-key
 *    - Schedule: Daily at 9 AM
 *
 * Security:
 * - Requires CRON_SECRET in environment variables
 * - Vercel Cron requests are automatically authenticated
 */

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for non-Vercel requests
    const authHeader = request.headers.get("authorization");
    const cronSecret = request.headers.get("x-cron-secret");

    if (
      !authHeader?.includes("Bearer") &&
      cronSecret !== process.env.CRON_SECRET
    ) {
      logger.warn("Unauthorized cron request", {
        context: {
          hasAuth: !!authHeader,
          hasCronSecret: !!cronSecret,
        },
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const stats = {
      checked: 0,
      notified: 0,
      webhooksTriggered: 0,
      errors: 0,
      byStatus: {
        expiring7Days: 0,
        expiring3Days: 0,
        expiring1Day: 0,
        expiringToday: 0,
        expired1Day: 0,
      },
    };

    logger.info("Starting subscription notification cron job", {
      context: { timestamp: now.toISOString() },
    });

    // Find all users with active subscriptions or trials
    const users = await db.user.findMany({
      where: {
        isActive: true,
        subscriptionStatus: {
          in: ["TRIAL", "ACTIVE"],
        },
        OR: [
          { trialEndDate: { not: null } },
          { subscriptionEndDate: { not: null } },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        trialStartDate: true,
        trialEndDate: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
      },
    });

    stats.checked = users.length;

    for (const user of users) {
      try {
        // Determine which date to check
        const endDate =
          user.subscriptionStatus === "TRIAL"
            ? user.trialEndDate
            : user.subscriptionEndDate;

        if (!endDate) continue;

        // Calculate days until expiration
        const daysUntilExpiration = Math.ceil(
          (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Check if we should send a notification
        let shouldNotify = false;
        let notificationType: string = "";

        if (daysUntilExpiration === 7) {
          shouldNotify = true;
          notificationType = "7_days";
          stats.byStatus.expiring7Days++;
        } else if (daysUntilExpiration === 3) {
          shouldNotify = true;
          notificationType = "3_days";
          stats.byStatus.expiring3Days++;
        } else if (daysUntilExpiration === 1) {
          shouldNotify = true;
          notificationType = "1_day";
          stats.byStatus.expiring1Day++;
        } else if (daysUntilExpiration === 0) {
          shouldNotify = true;
          notificationType = "today";
          stats.byStatus.expiringToday++;
        } else if (daysUntilExpiration === -1) {
          shouldNotify = true;
          notificationType = "expired_1_day";
          stats.byStatus.expired1Day++;
        }

        if (shouldNotify) {
          // Check if we already sent this notification today
          const existingNotification = await db.subscriptionNotification.findFirst({
            where: {
              userId: user.id,
              notificationType: notificationType,
              sentAt: {
                gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
              },
            },
          });

          if (existingNotification) {
            logger.info("Notification already sent today", {
              context: {
                userId: user.id,
                type: notificationType,
              },
            });
            continue;
          }

          // Send appropriate email
          if (daysUntilExpiration >= 0) {
            await sendSubscriptionExpiringEmail(user.email, user, Math.max(0, daysUntilExpiration));
          } else {
            await sendSubscriptionExpiredEmail(
              user.email,
              user,
              Math.abs(daysUntilExpiration)
            );
          }

          // Record notification in database
          await db.subscriptionNotification.create({
            data: {
              userId: user.id,
              notificationType: notificationType,
              daysUntilExpiration: daysUntilExpiration,
              sentAt: now,
            },
          });

          // Trigger webhooks based on event type
          try {
            const isTrial = user.subscriptionStatus === "TRIAL";

            if (daysUntilExpiration > 0) {
              // Expiring soon
              if (isTrial) {
                await triggerWebhooks(
                  buildTrialExpiringPayload(user, daysUntilExpiration)
                );
              } else {
                await triggerWebhooks(
                  buildSubscriptionExpiringPayload(user, daysUntilExpiration)
                );
              }
            } else if (daysUntilExpiration === 0) {
              // Expiring today - also trigger grace period started
              if (isTrial) {
                await triggerWebhooks(buildTrialExpiredPayload(user));
              } else {
                await triggerWebhooks(buildSubscriptionExpiredPayload(user));
              }

              // Grace period starts when subscription expires
              await triggerWebhooks(buildGracePeriodStartedPayload(user));
            } else {
              // Already expired (during grace period)
              if (isTrial) {
                await triggerWebhooks(buildTrialExpiredPayload(user));
              } else {
                await triggerWebhooks(buildSubscriptionExpiredPayload(user));
              }
            }

            stats.webhooksTriggered++;
          } catch (webhookError) {
            // Don't fail the whole process if webhooks fail
            logger.error("Failed to trigger webhook", {
              context: {
                userId: user.id,
                error: webhookError instanceof Error ? webhookError.message : String(webhookError),
              },
            });
          }

          stats.notified++;

          logger.info("Subscription notification sent", {
            context: {
              userId: user.id,
              email: user.email,
              type: notificationType,
              daysUntilExpiration,
            },
          });
        }
      } catch (error) {
        stats.errors++;
        logger.error("Failed to process user subscription notification", {
          context: {
            userId: user.id,
            error: error instanceof Error ? error.message : String(error),
          },
        });
      }
    }

    logger.info("Subscription notification cron job completed", {
      context: stats,
    });

    return NextResponse.json({
      success: true,
      message: "Subscription notifications processed",
      stats,
    });
  } catch (error) {
    logger.error("Subscription notification cron job failed", {
      context: {
        error: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process subscription notifications",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// GET endpoint for manual testing (development only)
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "GET method not allowed in production" },
      { status: 405 }
    );
  }

  // Redirect to POST for development testing
  return POST(request);
}
