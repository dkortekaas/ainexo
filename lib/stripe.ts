import Stripe from "stripe";
import {
  SUBSCRIPTION_PLANS,
  type SubscriptionPlanType,
} from "@/lib/subscriptionPlans";
import { logger } from "./logger";

// Lazy initialization of Stripe client to allow builds without STRIPE_SECRET_KEY
let stripeInstance: Stripe | null = null;

function getStripeInstance(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error(
        "STRIPE_SECRET_KEY is not set. Please check your .env.local file. See docs/STRIPE_SETUP_NL.md for setup instructions."
      );
    }

    // Validate the Stripe key format
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey.startsWith("sk_test_") && !stripeKey.startsWith("sk_live_")) {
      logger.warn(
        "STRIPE_SECRET_KEY does not appear to be valid. It should start with 'sk_test_' or 'sk_live_'. See docs/STRIPE_SETUP_NL.md"
      );
    }

    stripeInstance = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
      typescript: true,
    });
  }

  return stripeInstance;
}

// Export a getter that lazily initializes Stripe
export const stripe = new Proxy({} as Stripe, {
  get: (_target, prop) => {
    const instance = getStripeInstance();
    const value = instance[prop as keyof Stripe];
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

// Warn about missing price IDs
const missingPriceIds: string[] = [];
if (!process.env.STRIPE_STARTER_PRICE_ID) missingPriceIds.push("STARTER");
if (!process.env.STRIPE_PROFESSIONAL_PRICE_ID)
  missingPriceIds.push("PROFESSIONAL");
if (!process.env.STRIPE_ENTERPRISE_PRICE_ID) missingPriceIds.push("ENTERPRISE");

if (missingPriceIds.length > 0) {
  logger.warn("Missing Stripe Price IDs", {
    missingPlans: missingPriceIds.join(", "),
    message: "Subscription upgrades for these plans will fail. See docs/STRIPE_SETUP_NL.md",
  });
}

// Add price IDs to subscription plans
export const SUBSCRIPTION_PLANS_WITH_PRICES = {
  STARTER: {
    ...SUBSCRIPTION_PLANS.STARTER,
    priceId: process.env.STRIPE_STARTER_PRICE_ID,
  },
  PROFESSIONAL: {
    ...SUBSCRIPTION_PLANS.PROFESSIONAL,
    priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
  },
  ENTERPRISE: {
    ...SUBSCRIPTION_PLANS.ENTERPRISE,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
  },
} as const;

// Helper function to get plan by price ID
export function getPlanByPriceId(priceId: string): SubscriptionPlanType | null {
  for (const [planKey, plan] of Object.entries(
    SUBSCRIPTION_PLANS_WITH_PRICES
  )) {
    if (plan.priceId === priceId) {
      return planKey as SubscriptionPlanType;
    }
  }
  return null;
}

// Re-export subscription plans and types for server-side use
export { SUBSCRIPTION_PLANS, type SubscriptionPlanType };
