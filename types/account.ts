export interface Invitation {
  id: string;
  email: string;
  role: string;
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "CANCELLED";
  expires: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SubscriptionData {
  user: {
    id: string;
    email: string;
    subscriptionStatus: string;
    subscriptionPlan: string | null;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    trialStartDate: string | null;
    trialEndDate: string | null;
    subscriptionStartDate: string | null;
    subscriptionEndDate: string | null;
    subscriptionCancelAt: string | null;
    subscriptionCanceled: boolean;
    createdAt: string;
    isTrialActive: boolean;
    trialDaysRemaining: number;
    currentPlan: {
      id: string;
      name: string;
      price: number;
      interval: string;
      limits?: {
        assistants: number;
        conversationsPerMonth: number;
        documentsPerAssistant: number;
        websitesPerAssistant: number;
      };
    };
  };
}

export interface TeamMember {
  id: string;
  initials: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  registered: string;
  lastLogin: string;
}
