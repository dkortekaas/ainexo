// hooks/useOnboarding.ts
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface OnboardingStatus {
  hasCompany: boolean;
  hasInvitedUsers: boolean;
  hasCategories: boolean;
  isCompleted: boolean;
}

export function useOnboarding() {
  const { data: session } = useSession();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOnboardingStatus = async () => {
      if (!session?.user) return;

      try {
        const response = await fetch("/api/onboarding/status");
        if (response.ok) {
          const data = await response.json();
          setStatus(data);
        }
      } catch (error) {
        console.error("Error fetching onboarding status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOnboardingStatus();
  }, [session]);

  const markStepCompleted = async (step: string) => {
    try {
      const response = await fetch("/api/onboarding/complete-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step }),
      });

      if (response.ok) {
        // Refresh status
        const statusResponse = await fetch("/api/onboarding/status");
        if (statusResponse.ok) {
          const data = await statusResponse.json();
          setStatus(data);
        }
      }
    } catch (error) {
      console.error("Error marking step completed:", error);
    }
  };

  const completeOnboarding = async () => {
    try {
      await fetch("/api/onboarding/complete", { method: "POST" });
      setStatus((prev) => (prev ? { ...prev, isCompleted: true } : null));
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
  };

  return {
    status,
    loading,
    markStepCompleted,
    completeOnboarding,
    shouldShowWizard: status && !status.isCompleted,
  };
}
