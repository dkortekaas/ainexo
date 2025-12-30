/**
 * Subscription Guard
 *
 * Component that checks if user's subscription is active and redirects
 * to subscription page if expired or inactive.
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSubscription } from "@/hooks/useSubscription";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface TrialGuardProps {
  children: React.ReactNode;
  feature?: "assistant" | "document" | "website";
  redirectUrl?: string;
}

export function TrialGuard({
  children,
  feature,
  redirectUrl = "/account?tab=subscription",
}: TrialGuardProps) {
  const router = useRouter();
  const { subscriptionStatus, loading } = useSubscription();
  const t = useTranslations();

  useEffect(() => {
    if (loading) return;

    // Only redirect if subscription status is loaded AND explicitly expired
    // Don't redirect if subscriptionStatus is null (still loading/error state)
    if (!subscriptionStatus) {
      return;
    }

    // Only redirect if subscription is explicitly expired (trial ended or subscription ended AND grace period ended)
    if (subscriptionStatus.isExpired) {
      console.log(
        "🚫 Subscription expired - redirecting to subscription page"
      );
      router.push(redirectUrl);
      return;
    }

    // If specific feature check requested and subscription is not active
    if (feature && !subscriptionStatus.isActive) {
      let canAccess = false;

      switch (feature) {
        case "assistant":
          canAccess = subscriptionStatus.canCreateAssistant;
          break;
        case "document":
          canAccess = subscriptionStatus.canCreateDocument;
          break;
        case "website":
          canAccess = subscriptionStatus.canCreateWebsite;
          break;
      }

      if (!canAccess) {
        console.log(
          `🚫 No access to ${feature} - redirecting to subscription page`
        );
        router.push(redirectUrl);
      }
    }
  }, [subscriptionStatus, loading, feature, router, redirectUrl]);

  // Show loading state while checking subscription
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        </div>
      </div>
    );
  }

  // If subscription is explicitly expired, show redirect message
  if (subscriptionStatus?.isExpired) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-gray-600">
            {t("common.statuses.redirecting")}
          </p>
        </div>
      </div>
    );
  }

  // All checks passed, render children
  return <>{children}</>;
}
