import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  getUserSubscriptionStatus,
  SubscriptionStatus,
} from "@/lib/subscription";

export function useSubscription() {
  const { data: session } = useSession();
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    const fetchSubscriptionStatus = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/subscriptions");
        if (response.ok) {
          const data = await response.json();
          // Convert the API response to our SubscriptionStatus format
          const isTrial = data.user.subscriptionStatus === "TRIAL";
          const isActive = data.user.subscriptionStatus === "ACTIVE";
          const isExpired = isTrial ? !data.user.isTrialActive : false;

          // Consider trial as active if not expired
          const isEffectivelyActive = (isTrial && !isExpired) || (isActive && !isExpired);

          const status: SubscriptionStatus = {
            isActive: isEffectivelyActive,
            isTrial,
            isExpired,
            plan: data.user.subscriptionPlan,
            trialDaysRemaining: data.user.trialDaysRemaining,
            subscriptionEndDate: data.user.subscriptionEndDate
              ? new Date(data.user.subscriptionEndDate)
              : null,
            canCreateAssistant:
              data.user.subscriptionStatus !== "TRIAL" ||
              data.user.isTrialActive,
            canCreateDocument:
              data.user.subscriptionStatus !== "TRIAL" ||
              data.user.isTrialActive,
            canCreateWebsite:
              data.user.subscriptionStatus !== "TRIAL" ||
              data.user.isTrialActive,
            assistantsLimit: data.user.currentPlan?.limits?.assistants || 1,
            documentsLimit:
              data.user.currentPlan?.limits?.documentsPerAssistant || 10,
            websitesLimit:
              data.user.currentPlan?.limits?.websitesPerAssistant || 3,
            conversationsLimit:
              data.user.currentPlan?.limits?.conversationsPerMonth || 100,
          };
          setSubscriptionStatus(status);
        } else {
          setError("Failed to fetch subscription status");
        }
      } catch (err) {
        console.error("Error fetching subscription status:", err);
        setError("Failed to fetch subscription status");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionStatus();
  }, [session?.user?.id]);

  const checkAccess = (
    feature: "assistant" | "document" | "website" | "conversation"
  ) => {
    if (!subscriptionStatus) return { allowed: false, reason: "Loading..." };

    if (subscriptionStatus.isExpired) {
      return {
        allowed: false,
        reason:
          "Je trial periode is verlopen. Upgrade naar een betaald abonnement om door te gaan.",
      };
    }

    switch (feature) {
      case "assistant":
        if (!subscriptionStatus.canCreateAssistant) {
          return {
            allowed: false,
            reason: `Je hebt de limiet van ${subscriptionStatus.assistantsLimit} chatbot(s) bereikt. Upgrade je abonnement voor meer chatbots.`,
          };
        }
        break;
      case "document":
        if (!subscriptionStatus.canCreateDocument) {
          return {
            allowed: false,
            reason: "Je hebt geen toegang om documenten toe te voegen.",
          };
        }
        break;
      case "website":
        if (!subscriptionStatus.canCreateWebsite) {
          return {
            allowed: false,
            reason: "Je hebt geen toegang om websites toe te voegen.",
          };
        }
        break;
      case "conversation":
        // For conversations, we would need to check monthly usage
        break;
    }

    return { allowed: true };
  };

  const refresh = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/subscriptions");
      if (response.ok) {
        const data = await response.json();
        const isTrial = data.user.subscriptionStatus === "TRIAL";
        const isActive = data.user.subscriptionStatus === "ACTIVE";
        const isExpired = isTrial ? !data.user.isTrialActive : false;

        // Consider trial as active if not expired
        const isEffectivelyActive = (isTrial && !isExpired) || (isActive && !isExpired);

        const status: SubscriptionStatus = {
          isActive: isEffectivelyActive,
          isTrial,
          isExpired,
          plan: data.user.subscriptionPlan,
          trialDaysRemaining: data.user.trialDaysRemaining,
          subscriptionEndDate: data.user.subscriptionEndDate
            ? new Date(data.user.subscriptionEndDate)
            : null,
          canCreateAssistant:
            data.user.subscriptionStatus !== "TRIAL" || data.user.isTrialActive,
          canCreateDocument:
            data.user.subscriptionStatus !== "TRIAL" || data.user.isTrialActive,
          canCreateWebsite:
            data.user.subscriptionStatus !== "TRIAL" || data.user.isTrialActive,
          assistantsLimit: data.user.currentPlan?.limits?.assistants || 1,
          documentsLimit:
            data.user.currentPlan?.limits?.documentsPerAssistant || 10,
          websitesLimit:
            data.user.currentPlan?.limits?.websitesPerAssistant || 3,
          conversationsLimit:
            data.user.currentPlan?.limits?.conversationsPerMonth || 100,
        };
        setSubscriptionStatus(status);
      } else {
        setError("Failed to refresh subscription status");
      }
    } catch (err) {
      console.error("Error refreshing subscription status:", err);
      setError("Failed to refresh subscription status");
    } finally {
      setLoading(false);
    }
  };

  return {
    subscriptionStatus,
    loading,
    error,
    checkAccess,
    refresh,
  };
}
