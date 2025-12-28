import { db } from "@/lib/db";
import { stripe, getPlanByPriceId } from "@/lib/stripe";
import {
  SUBSCRIPTION_PLANS_WITH_PRICES,
  type SubscriptionPlanType,
} from "@/lib/stripe";
import { SubscriptionStatus, SubscriptionPlan } from "@prisma/client";
import Stripe from "stripe";

/**
 * Subscription data interface
 */
export interface SubscriptionData {
  id: string;
  userId: string;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPlan: SubscriptionPlan | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  trialStartDate: Date | null;
  trialEndDate: Date | null;
  subscriptionStartDate: Date | null;
  subscriptionEndDate: Date | null;
  subscriptionCancelAt: Date | null;
  subscriptionCanceled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Options for creating a subscription
 */
export interface CreateSubscriptionOptions {
  plan: SubscriptionPlanType;
  trialDays?: number;
  createStripeCheckout?: boolean; // If true, creates Stripe checkout session instead of direct subscription
  successUrl?: string;
  cancelUrl?: string;
}

/**
 * Data for updating a subscription
 */
export interface UpdateSubscriptionData {
  subscriptionStatus?: SubscriptionStatus;
  subscriptionPlan?: SubscriptionPlan;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  trialStartDate?: Date | null;
  trialEndDate?: Date | null;
  subscriptionStartDate?: Date | null;
  subscriptionEndDate?: Date | null;
  subscriptionCancelAt?: Date | null;
  subscriptionCanceled?: boolean;
}

/**
 * Get subscription data for a user
 * @param userId - User ID
 * @returns Subscription data or null if user not found
 */
export async function getSubscription(
  userId: string
): Promise<SubscriptionData | null> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        trialStartDate: true,
        trialEndDate: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        subscriptionCancelAt: true,
        subscriptionCanceled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      userId: user.id,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionPlan: user.subscriptionPlan,
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: user.stripeSubscriptionId,
      trialStartDate: user.trialStartDate,
      trialEndDate: user.trialEndDate,
      subscriptionStartDate: user.subscriptionStartDate,
      subscriptionEndDate: user.subscriptionEndDate,
      subscriptionCancelAt: user.subscriptionCancelAt,
      subscriptionCanceled: user.subscriptionCanceled,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (error) {
    console.error("Error getting subscription:", error);
    throw error;
  }
}

/**
 * Initialize a trial subscription for a new user
 * @param userId - User ID
 * @param trialDays - Number of days for trial (default: 30)
 * @returns Updated subscription data
 */
export async function initializeTrialSubscription(
  userId: string,
  trialDays: number = 30
): Promise<SubscriptionData> {
  try {
    const now = new Date();
    const trialEndDate = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

    const user = await db.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: SubscriptionStatus.TRIAL,
        subscriptionPlan: SubscriptionPlan.TRIAL,
        trialStartDate: now,
        trialEndDate: trialEndDate,
      },
      select: {
        id: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        trialStartDate: true,
        trialEndDate: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        subscriptionCancelAt: true,
        subscriptionCanceled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      id: user.id,
      userId: user.id,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionPlan: user.subscriptionPlan,
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: user.stripeSubscriptionId,
      trialStartDate: user.trialStartDate,
      trialEndDate: user.trialEndDate,
      subscriptionStartDate: user.subscriptionStartDate,
      subscriptionEndDate: user.subscriptionEndDate,
      subscriptionCancelAt: user.subscriptionCancelAt,
      subscriptionCanceled: user.subscriptionCanceled,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (error) {
    console.error("Error initializing trial subscription:", error);
    throw error;
  }
}

/**
 * Create a subscription (either trial or paid via Stripe checkout)
 * @param userId - User ID
 * @param options - Subscription creation options
 * @returns Subscription data or Stripe checkout URL
 */
export async function createSubscription(
  userId: string,
  options: CreateSubscriptionOptions
): Promise<SubscriptionData | { checkoutUrl: string }> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        stripeCustomerId: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // If creating Stripe checkout session
    if (options.createStripeCheckout) {
      if (!(options.plan in SUBSCRIPTION_PLANS_WITH_PRICES)) {
        throw new Error(`Invalid plan: ${options.plan}`);
      }

      const selectedPlan =
        SUBSCRIPTION_PLANS_WITH_PRICES[
          options.plan as keyof typeof SUBSCRIPTION_PLANS_WITH_PRICES
        ];

      if (!selectedPlan.priceId) {
        throw new Error(`Plan ${options.plan} not configured with Stripe price ID`);
      }

      // Create or get Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name || undefined,
          metadata: {
            userId: user.id,
          },
        });

        customerId = customer.id;

        await db.user.update({
          where: { id: user.id },
          data: { stripeCustomerId: customerId },
        });
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price: selectedPlan.priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url:
          options.successUrl ||
          `${process.env.NEXTAUTH_URL}/account?success=true`,
        cancel_url:
          options.cancelUrl ||
          `${process.env.NEXTAUTH_URL}/account?canceled=true`,
        metadata: {
          userId: user.id,
          plan: options.plan,
        },
      });

      return { checkoutUrl: session.url || "" };
    }

    // For trial subscriptions, use initializeTrialSubscription
    if (options.plan === "TRIAL") {
      return await initializeTrialSubscription(
        userId,
        options.trialDays || 30
      );
    }

    throw new Error(
      "Direct subscription creation is only supported for TRIAL plans. Use createStripeCheckout for paid plans."
    );
  } catch (error) {
    console.error("Error creating subscription:", error);
    throw error;
  }
}

/**
 * Update subscription data
 * @param userId - User ID
 * @param data - Subscription data to update
 * @returns Updated subscription data
 */
export async function updateSubscription(
  userId: string,
  data: UpdateSubscriptionData
): Promise<SubscriptionData> {
  try {
    const updateData: any = {};

    if (data.subscriptionStatus !== undefined) {
      updateData.subscriptionStatus = data.subscriptionStatus;
    }
    if (data.subscriptionPlan !== undefined) {
      updateData.subscriptionPlan = data.subscriptionPlan;
    }
    if (data.stripeCustomerId !== undefined) {
      updateData.stripeCustomerId = data.stripeCustomerId;
    }
    if (data.stripeSubscriptionId !== undefined) {
      updateData.stripeSubscriptionId = data.stripeSubscriptionId;
    }
    if (data.trialStartDate !== undefined) {
      updateData.trialStartDate = data.trialStartDate;
    }
    if (data.trialEndDate !== undefined) {
      updateData.trialEndDate = data.trialEndDate;
    }
    if (data.subscriptionStartDate !== undefined) {
      updateData.subscriptionStartDate = data.subscriptionStartDate;
    }
    if (data.subscriptionEndDate !== undefined) {
      updateData.subscriptionEndDate = data.subscriptionEndDate;
    }
    if (data.subscriptionCancelAt !== undefined) {
      updateData.subscriptionCancelAt = data.subscriptionCancelAt;
    }
    if (data.subscriptionCanceled !== undefined) {
      updateData.subscriptionCanceled = data.subscriptionCanceled;
    }

    const user = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        trialStartDate: true,
        trialEndDate: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        subscriptionCancelAt: true,
        subscriptionCanceled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      id: user.id,
      userId: user.id,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionPlan: user.subscriptionPlan,
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: user.stripeSubscriptionId,
      trialStartDate: user.trialStartDate,
      trialEndDate: user.trialEndDate,
      subscriptionStartDate: user.subscriptionStartDate,
      subscriptionEndDate: user.subscriptionEndDate,
      subscriptionCancelAt: user.subscriptionCancelAt,
      subscriptionCanceled: user.subscriptionCanceled,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (error) {
    console.error("Error updating subscription:", error);
    throw error;
  }
}

/**
 * Cancel a subscription (at period end)
 * @param userId - User ID
 * @param immediate - If true, cancel immediately. If false, cancel at period end (default: false)
 * @returns Updated subscription data
 */
export async function cancelSubscription(
  userId: string,
  immediate: boolean = false
): Promise<SubscriptionData> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        stripeSubscriptionId: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.stripeSubscriptionId) {
      throw new Error("No active subscription found");
    }

    if (immediate) {
      // Cancel immediately in Stripe
      await stripe.subscriptions.cancel(user.stripeSubscriptionId);

      // Update database
      return await updateSubscription(userId, {
        subscriptionStatus: SubscriptionStatus.CANCELED,
        subscriptionCanceled: true,
        subscriptionCancelAt: new Date(),
      });
    } else {
      // Cancel at period end in Stripe
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      // Update database
      return await updateSubscription(userId, {
        subscriptionCanceled: true,
      });
    }
  } catch (error) {
    console.error("Error canceling subscription:", error);
    throw error;
  }
}

/**
 * Sync subscription from Stripe
 * @param userId - User ID
 * @returns Updated subscription data
 */
export async function syncSubscriptionFromStripe(
  userId: string
): Promise<SubscriptionData> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        subscriptionStatus: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.stripeCustomerId) {
      // Check if user is in trial
      if (user.subscriptionStatus === SubscriptionStatus.TRIAL) {
        throw new Error(
          "Sync is only available for paid subscriptions. Trial users don't have a Stripe customer yet."
        );
      }
      throw new Error("No Stripe customer found");
    }

    let activeSubscription: Stripe.Subscription | null = null;

    // If we already have a subscription ID, fetch it directly
    if (user.stripeSubscriptionId) {
      try {
        activeSubscription = await stripe.subscriptions.retrieve(
          user.stripeSubscriptionId
        );
      } catch (error) {
        console.log(
          `Failed to retrieve subscription ${user.stripeSubscriptionId}, falling back to list`
        );
        activeSubscription = null;
      }
    }

    // If we don't have a subscription yet, or retrieval failed, list all subscriptions
    if (!activeSubscription) {
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: "all",
        limit: 10,
        expand: ["data.items.data.price"],
      });

      // Find the active or most recent subscription
      activeSubscription =
        subscriptions.data.find(
          (sub) => sub.status === "active" || sub.status === "trialing"
        ) || subscriptions.data[0];

      if (!activeSubscription) {
        throw new Error("No subscription found in Stripe");
      }
    }

    const subscription: Stripe.Subscription = activeSubscription;

    // Get the price ID from the subscription
    const priceId = subscription.items.data[0]?.price.id;
    if (!priceId) {
      throw new Error("No price ID found in subscription");
    }

    // Map price ID to plan
    const plan = getPlanByPriceId(priceId);

    // Map Stripe subscription status to our status
    let status: SubscriptionStatus = user.subscriptionStatus;
    switch (subscription.status) {
      case "active":
        status = SubscriptionStatus.ACTIVE;
        break;
      case "past_due":
        status = SubscriptionStatus.PAST_DUE;
        break;
      case "unpaid":
        status = SubscriptionStatus.UNPAID;
        break;
      case "canceled":
        status = SubscriptionStatus.CANCELED;
        break;
      case "incomplete":
        status = SubscriptionStatus.INCOMPLETE;
        break;
      case "incomplete_expired":
        status = SubscriptionStatus.INCOMPLETE_EXPIRED;
        break;
      case "paused":
        status = SubscriptionStatus.PAUSED;
        break;
      case "trialing":
        status = SubscriptionStatus.TRIAL;
        break;
    }

    // Calculate dates
    const startDate = new Date(
      (subscription as any).current_period_start * 1000
    );
    const endDate = new Date((subscription as any).current_period_end * 1000);
    const cancelAt = (subscription as any).cancel_at
      ? new Date((subscription as any).cancel_at * 1000)
      : null;

    // Update subscription
    return await updateSubscription(userId, {
      stripeSubscriptionId: subscription.id,
      subscriptionPlan: plan || undefined,
      subscriptionStatus: status,
      subscriptionStartDate: startDate,
      subscriptionEndDate: endDate,
      subscriptionCanceled: subscription.cancel_at_period_end || false,
      subscriptionCancelAt: cancelAt,
    });
  } catch (error) {
    console.error("Error syncing subscription from Stripe:", error);
    throw error;
  }
}

/**
 * Update subscription from Stripe webhook event
 * @param subscription - Stripe subscription object
 * @returns Updated subscription data or null if user not found
 */
export async function updateSubscriptionFromStripeWebhook(
  subscription: Stripe.Subscription
): Promise<SubscriptionData | null> {
  try {
    const customerId = subscription.customer as string;
    const subscriptionId = subscription.id;

    // Find user by Stripe customer ID
    const user = await db.user.findFirst({
      where: { stripeCustomerId: customerId },
      select: { id: true },
    });

    if (!user) {
      console.error(`User not found for customer ${customerId}`);
      return null;
    }

    // Get the price ID from the subscription
    const priceId = subscription.items.data[0]?.price.id;
    if (!priceId) {
      console.error("No price ID found in subscription");
      return null;
    }

    // Map price ID to plan
    const plan = getPlanByPriceId(priceId);

    // Map Stripe subscription status to our status
    let status: SubscriptionStatus;
    switch (subscription.status) {
      case "active":
        status = SubscriptionStatus.ACTIVE;
        break;
      case "past_due":
        status = SubscriptionStatus.PAST_DUE;
        break;
      case "unpaid":
        status = SubscriptionStatus.UNPAID;
        break;
      case "canceled":
        status = SubscriptionStatus.CANCELED;
        break;
      case "incomplete":
        status = SubscriptionStatus.INCOMPLETE;
        break;
      case "incomplete_expired":
        status = SubscriptionStatus.INCOMPLETE_EXPIRED;
        break;
      case "paused":
        status = SubscriptionStatus.PAUSED;
        break;
      case "trialing":
        status = SubscriptionStatus.TRIAL;
        break;
      default:
        status = SubscriptionStatus.INCOMPLETE;
    }

    // Calculate dates
    const startDate = new Date(
      (subscription as any).current_period_start * 1000
    );
    const endDate = new Date((subscription as any).current_period_end * 1000);
    const cancelAt = (subscription as any).cancel_at
      ? new Date((subscription as any).cancel_at * 1000)
      : null;

    // Update subscription
    return await updateSubscription(user.id, {
      stripeSubscriptionId: subscriptionId,
      subscriptionPlan: plan || undefined,
      subscriptionStatus: status,
      subscriptionStartDate: startDate,
      subscriptionEndDate: endDate,
      subscriptionCanceled: subscription.cancel_at_period_end || false,
      subscriptionCancelAt: cancelAt,
    });
  } catch (error) {
    console.error("Error updating subscription from Stripe webhook:", error);
    throw error;
  }
}

