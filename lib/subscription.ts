import { db } from "@/lib/db";
import { SUBSCRIPTION_PLANS, SubscriptionPlanType } from "@/lib/stripe";

export interface SubscriptionStatus {
  isActive: boolean;
  isTrial: boolean;
  isExpired: boolean;
  plan: SubscriptionPlanType | null;
  trialDaysRemaining: number;
  subscriptionEndDate: Date | null;
  canCreateAssistant: boolean;
  canCreateDocument: boolean;
  canCreateWebsite: boolean;
  assistantsLimit: number;
  documentsLimit: number;
  websitesLimit: number;
  conversationsLimit: number;
}

export async function getUserSubscriptionStatus(
  userId: string
): Promise<SubscriptionStatus> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionStatus: true,
      subscriptionPlan: true,
      trialStartDate: true,
      trialEndDate: true,
      subscriptionStartDate: true,
      subscriptionEndDate: true,
      subscriptionCanceled: true,
      subscriptionCancelAt: true,
    },
  });

  if (!user) {
    return getDefaultSubscriptionStatus();
  }

  const now = new Date();
  const isTrial = user.subscriptionStatus === "TRIAL";
  const isActive = user.subscriptionStatus === "ACTIVE";
  const isExpired = isTrial
    ? user.trialEndDate
      ? user.trialEndDate < now
      : false
    : user.subscriptionEndDate
      ? user.subscriptionEndDate < now
      : false;

  // Consider trial as active if not expired
  const isEffectivelyActive = (isTrial && !isExpired) || (isActive && !isExpired);

  const trialDaysRemaining = user.trialEndDate
    ? Math.max(
        0,
        Math.ceil(
          (user.trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  const plan = user.subscriptionPlan as SubscriptionPlanType | null;
  const planConfig = plan ? SUBSCRIPTION_PLANS[plan] : null;

  // Check if user can perform actions
  const canCreateAssistant =
    !isExpired && (planConfig ? planConfig.limits.assistants === -1 : true);
  const canCreateDocument = !isExpired;
  const canCreateWebsite = !isExpired;

  return {
    isActive: isEffectivelyActive,
    isTrial,
    isExpired,
    plan,
    trialDaysRemaining,
    subscriptionEndDate: user.subscriptionEndDate,
    canCreateAssistant,
    canCreateDocument,
    canCreateWebsite,
    assistantsLimit: planConfig?.limits.assistants || 1,
    documentsLimit: planConfig?.limits.documentsPerAssistant || 10,
    websitesLimit: planConfig?.limits.websitesPerAssistant || 3,
    conversationsLimit: planConfig?.limits.conversationsPerMonth || 100,
  };
}

export function getDefaultSubscriptionStatus(): SubscriptionStatus {
  return {
    isActive: false,
    isTrial: false,
    isExpired: true,
    plan: null,
    trialDaysRemaining: 0,
    subscriptionEndDate: null,
    canCreateAssistant: false,
    canCreateDocument: false,
    canCreateWebsite: false,
    assistantsLimit: 0,
    documentsLimit: 0,
    websitesLimit: 0,
    conversationsLimit: 0,
  };
}

export async function checkUserLimits(
  userId: string,
  action: "assistant" | "document" | "website"
): Promise<{ allowed: boolean; reason?: string }> {
  const status = await getUserSubscriptionStatus(userId);

  if (status.isExpired) {
    return {
      allowed: false,
      reason:
        "Je trial periode is verlopen. Upgrade naar een betaald abonnement om door te gaan.",
    };
  }

  switch (action) {
    case "assistant":
      if (!status.canCreateAssistant) {
        return {
          allowed: false,
          reason: `Je hebt de limiet van ${status.assistantsLimit} chatbot(s) bereikt. Upgrade je abonnement voor meer chatbots.`,
        };
      }
      break;
    case "document":
      if (!status.canCreateDocument) {
        return {
          allowed: false,
          reason: "Je hebt geen toegang om documenten toe te voegen.",
        };
      }
      break;
    case "website":
      if (!status.canCreateWebsite) {
        return {
          allowed: false,
          reason: "Je hebt geen toegang om websites toe te voegen.",
        };
      }
      break;
  }

  return { allowed: true };
}

export async function getUsageStats(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      chatbot_settings: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const assistantIds = user.chatbot_settings.map((assistant) => assistant.id);
  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );

  // Get counts for this user's assistants only
  // First get project IDs for user's assistants
  const projects = assistantIds.length > 0
    ? await db.projects.findMany({
        where: {
          ChatbotSettings: {
            some: {
              userId: userId,
            },
          },
        },
        select: {
          id: true,
        },
      })
    : [];
  const projectIds = projects.map((p) => p.id);

  const [totalDocuments, totalWebsites, monthlyConversations] =
    await Promise.all([
      // Count unique documents in projects linked to user's assistants
      projectIds.length > 0
        ? (async () => {
            // Get all document IDs from project_documents
            const projectDocs = await db.project_documents.findMany({
              where: {
                projectId: {
                  in: projectIds,
                },
              },
              select: {
                documentId: true,
              },
            });
            // Count unique document IDs
            const uniqueDocIds = new Set(projectDocs.map((pd) => pd.documentId));
            return uniqueDocIds.size;
          })()
        : Promise.resolve(0),
      // Count websites for user's assistants
      assistantIds.length > 0
        ? db.website.count({
            where: {
              assistantId: {
                in: assistantIds,
              },
            },
          })
        : 0,
      // Count conversation sessions for user's assistants this month
      assistantIds.length > 0
        ? db.conversationSession.count({
            where: {
              assistantId: {
                in: assistantIds,
              },
              startedAt: {
                gte: startOfMonth,
              },
            },
          })
        : 0,
    ]);

  return {
    assistants: user.chatbot_settings.length,
    documents: totalDocuments,
    websites: totalWebsites,
    conversations: monthlyConversations,
  };
}

/**
 * Grace Period Support
 *
 * Allows users to continue using premium features for a limited time
 * after their subscription expires.
 */

// Grace period duration in days (configurable via env)
export const GRACE_PERIOD_DAYS = process.env.SUBSCRIPTION_GRACE_PERIOD_DAYS
  ? parseInt(process.env.SUBSCRIPTION_GRACE_PERIOD_DAYS)
  : 3;

export interface GracePeriodCheck {
  isExpired: boolean;
  isInGracePeriod: boolean;
  daysInGracePeriod: number;
  daysRemainingInGrace: number;
  gracePeriodEndsAt: Date | null;
  shouldBlockAccess: boolean;
  canAccessFeatures: boolean;
  message: string;
  urgency: "none" | "info" | "warning" | "critical";
}

/**
 * Check if a subscription is in grace period
 */
export function checkGracePeriod(
  subscriptionStatus: string,
  trialEndDate: Date | null | undefined,
  subscriptionEndDate: Date | null | undefined
): GracePeriodCheck {
  const now = new Date();

  // Determine which end date to use
  const isTrial = subscriptionStatus === "TRIAL";
  const endDate = isTrial ? trialEndDate : subscriptionEndDate;

  // Default response for active subscriptions
  if (!endDate) {
    return {
      isExpired: false,
      isInGracePeriod: false,
      daysInGracePeriod: 0,
      daysRemainingInGrace: 0,
      gracePeriodEndsAt: null,
      shouldBlockAccess: !["TRIAL", "ACTIVE"].includes(subscriptionStatus),
      canAccessFeatures: ["TRIAL", "ACTIVE"].includes(subscriptionStatus),
      message: "Subscription is active",
      urgency: "none",
    };
  }

  const endDateTime = new Date(endDate).getTime();
  const nowTime = now.getTime();

  // Check if expired
  const isExpired = endDateTime < nowTime;

  if (!isExpired) {
    // Not expired yet
    const daysRemaining = Math.ceil(
      (endDateTime - nowTime) / (1000 * 60 * 60 * 24)
    );
    return {
      isExpired: false,
      isInGracePeriod: false,
      daysInGracePeriod: 0,
      daysRemainingInGrace: 0,
      gracePeriodEndsAt: null,
      shouldBlockAccess: false,
      canAccessFeatures: true,
      message: `Subscription expires in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`,
      urgency: daysRemaining <= 3 ? "warning" : "info",
    };
  }

  // Calculate days since expiration
  const daysSinceExpiration = Math.floor(
    (nowTime - endDateTime) / (1000 * 60 * 60 * 24)
  );

  // Calculate grace period end date
  const gracePeriodEndsAt = new Date(endDateTime);
  gracePeriodEndsAt.setDate(gracePeriodEndsAt.getDate() + GRACE_PERIOD_DAYS);

  // Check if in grace period
  const isInGracePeriod = daysSinceExpiration < GRACE_PERIOD_DAYS;
  const daysRemainingInGrace = Math.max(
    0,
    GRACE_PERIOD_DAYS - daysSinceExpiration
  );

  if (isInGracePeriod) {
    return {
      isExpired: true,
      isInGracePeriod: true,
      daysInGracePeriod: daysSinceExpiration,
      daysRemainingInGrace,
      gracePeriodEndsAt,
      shouldBlockAccess: false, // Still allow access during grace period
      canAccessFeatures: true,
      message: `Grace period: ${daysRemainingInGrace} day${daysRemainingInGrace === 1 ? "" : "s"} remaining`,
      urgency: daysRemainingInGrace === 0 ? "critical" : "warning",
    };
  }

  // Grace period has ended
  return {
    isExpired: true,
    isInGracePeriod: false,
    daysInGracePeriod: daysSinceExpiration,
    daysRemainingInGrace: 0,
    gracePeriodEndsAt,
    shouldBlockAccess: true,
    canAccessFeatures: false,
    message: `Subscription expired ${daysSinceExpiration} days ago`,
    urgency: "critical",
  };
}

/**
 * Format grace period message for UI display
 */
export function getGracePeriodMessage(check: GracePeriodCheck): {
  title: string;
  description: string;
  actionText: string;
} {
  if (!check.isInGracePeriod) {
    return {
      title: "",
      description: "",
      actionText: "",
    };
  }

  if (check.daysRemainingInGrace === 0) {
    return {
      title: "⚠️ Laatste dag van grace period!",
      description:
        "Je abonnement is verlopen. Verlengen vandaag om toegang te behouden.",
      actionText: "Verlengen Nu",
    };
  }

  if (check.daysRemainingInGrace === 1) {
    return {
      title: "⏰ Grace period eindigt morgen",
      description:
        "Je abonnement is verlopen. Verlengen nu om je features te behouden.",
      actionText: "Direct Verlengen",
    };
  }

  return {
    title: `📅 Grace period: ${check.daysRemainingInGrace} dagen resterend`,
    description:
      "Je abonnement is verlopen, maar je hebt nog tijdelijk toegang. Verlengen binnenkort om geen onderbreking te ervaren.",
    actionText: "Verlengen Abonnement",
  };
}

/**
 * Get grace period configuration
 */
export function getGracePeriodConfig() {
  return {
    enabled: GRACE_PERIOD_DAYS > 0,
    days: GRACE_PERIOD_DAYS,
  };
}

