"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { safeRedirect } from "@/lib/safe-redirect";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  sortOrder: number;
  isActive: boolean;
  stripeProductId: string | null;
  stripePriceId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

interface SubscriptionUpgradeFormProps {
  plans: Plan[];
  currentSubscription: any;
  companyId: string;
}

export function SubscriptionUpgradeForm({
  plans,
  currentSubscription,
  companyId,
}: SubscriptionUpgradeFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState<string | null>(null);

  const handleUpgrade = async (planId: string) => {
    try {
      setIsLoading(planId);
      const response = await fetch("/api/subscription/upgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId,
          companyId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to upgrade subscription");
      }

      const { url } = await response.json();

      // Safely redirect to Stripe Checkout with validation
      toast.info("Redirecting to checkout...");
      safeRedirect(url);
    } catch (error) {
      console.error("Error upgrading subscription:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to upgrade subscription"
      );
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan) => {
        const isCurrentPlan = currentSubscription?.planId === plan.id;
        const isUpgrade = currentSubscription?.planId !== plan.id;

        return (
          <Card key={plan.id} className="relative">
            {isCurrentPlan && (
              <Badge className="absolute top-4 right-4">
                {t("subscription.upgradeDetails.currentPlan")}
              </Badge>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-3xl font-bold">
                  €{plan.price}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{t(`subscription.upgradeDetails.${plan.interval}`)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <span className="mr-2">•</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full bg-primary hover:bg-primary/80 text-white"
                  variant={isCurrentPlan ? "secondary" : "default"}
                  disabled={isCurrentPlan || !!isLoading}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {isLoading === plan.id
                    ? t("common.statuses.processing")
                    : isCurrentPlan
                      ? t("subscription.upgradeDetails.currentPlan")
                      : isUpgrade
                        ? t("subscription.upgrade")
                        : t("subscription.upgradeDetails.select")}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
