// Subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  TRIAL: {
    name: 'Trial',
    price: 0,
    features: [
      '1 chatbot (gratis)',
      '10 gesprekken per maand',
      'Basis functionaliteit',
      '7 dagen trial periode'
    ],
    limits: {
      assistants: 1,
      conversationsPerMonth: 10,
      documentsPerAssistant: 3,
      websitesPerAssistant: 1
    }
  },
  STARTER: {
    name: 'Starter',
    price: 19,
    features: [
      '1 chatbot',
      '100 gesprekken per maand',
      'Basis support',
      'Standaard templates'
    ],
    limits: {
      assistants: 1,
      conversationsPerMonth: 100,
      documentsPerAssistant: 10,
      websitesPerAssistant: 3
    }
  },
  PROFESSIONAL: {
    name: 'Professional',
    price: 49,
    features: [
      '3 chatbots',
      '500 gesprekken per maand',
      'Prioriteit support',
      'Aangepaste templates',
      'Analytics dashboard'
    ],
    limits: {
      assistants: 3,
      conversationsPerMonth: 500,
      documentsPerAssistant: 50,
      websitesPerAssistant: 10
    }
  },
  BUSINESS: {
    name: 'Business',
    price: 149,
    features: [
      '10 chatbots',
      '2000 gesprekken per maand',
      'Premium support',
      'API toegang',
      'Geavanceerde analytics',
      'White-label opties'
    ],
    limits: {
      assistants: 10,
      conversationsPerMonth: 2000,
      documentsPerAssistant: 200,
      websitesPerAssistant: 50
    }
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 499,
    features: [
      'Onbeperkte chatbots',
      'Onbeperkte gesprekken',
      'Dedicated support',
      'Volledige API toegang',
      'Custom integraties',
      'SLA garantie',
      'On-premise opties'
    ],
    limits: {
      assistants: -1, // unlimited
      conversationsPerMonth: -1, // unlimited
      documentsPerAssistant: -1, // unlimited
      websitesPerAssistant: -1 // unlimited
    }
  }
} as const;

export type SubscriptionPlanType = keyof typeof SUBSCRIPTION_PLANS;

// Helper function to check if user has access to feature
export function hasAccessToFeature(
  userPlan: SubscriptionPlanType | null,
  feature: keyof typeof SUBSCRIPTION_PLANS.STARTER.limits
): boolean {
  if (!userPlan) return false;
  
  const plan = SUBSCRIPTION_PLANS[userPlan];
  const limit = plan.limits[feature];
  
  // -1 means unlimited
  return limit === -1;
}

// Helper function to get usage limit
export function getUsageLimit(
  userPlan: SubscriptionPlanType | null,
  feature: keyof typeof SUBSCRIPTION_PLANS.TRIAL.limits
): number {
  // Default to TRIAL if no plan specified (for new users)
  if (!userPlan) {
    return SUBSCRIPTION_PLANS.TRIAL.limits[feature];
  }

  const plan = SUBSCRIPTION_PLANS[userPlan];
  return plan.limits[feature];
}
