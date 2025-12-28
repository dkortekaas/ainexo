"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, Card, Badge, SaveButton } from "@/components/ui";
import { RefreshCw, CreditCard, AlertCircle, CheckCircle } from "lucide-react";
import { SUBSCRIPTION_PLANS } from "@/lib/subscriptionPlans";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import { SubscriptionData } from "@/types/account";
import { safeRedirect } from "@/lib/safe-redirect";

export function SubscriptionTab() {
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [managing, setManaging] = useState(false);
  const { toast } = useToast();
  const t = useTranslations();

  const fetchSubscriptionData = useCallback(async () => {
    try {
      const response = await fetch("/api/subscriptions");
      if (response.ok) {
        const data = await response.json();
        setSubscriptionData(data);
      } else {
        toast({
          title: "Error",
          description: t("account.subscriptions.failedToFetchSubscriptionData"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
      toast({
        title: "Error",
        description: t("account.subscriptions.failedToFetchSubscriptionData"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  const handleUpgrade = async (plan: string) => {
    setUpgrading(true);
    try {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      });

      if (response.ok) {
        const { url } = await response.json();
        toast({
          title: "Redirecting",
          description: "Taking you to checkout...",
        });
        safeRedirect(url);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description:
            error.error ||
            t("account.subscriptions.failedToCreateSubscription"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating subscription:", error);
      toast({
        title: "Error",
        description: t("account.subscriptions.failedToCreateSubscription"),
        variant: "destructive",
      });
    } finally {
      setUpgrading(false);
    }
  };

  const handleManageSubscription = async () => {
    setManaging(true);
    try {
      const response = await fetch("/api/subscriptions/manage");
      if (response.ok) {
        const data = await response.json();

        if (data.url) {
          toast({
            title: "Redirecting",
            description: "Opening subscription management...",
          });
          safeRedirect(data.url);
        } else {
          console.error("No URL returned from manage subscription API");
          toast({
            title: "Error",
            description: "No subscription management URL available",
            variant: "destructive",
          });
        }
      } else {
        const errorData = await response.json();
        //console.error("Manage subscription error:", errorData);

        if (errorData.error === "No subscription found") {
          toast({
            title: "No Subscription",
            description:
              "You don't have an active subscription to manage. Please upgrade your plan first.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description:
              errorData.error ||
              t("account.subscriptions.failedToOpenSubscriptionManagement"),
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error managing subscription:", error);
      toast({
        title: "Error",
        description: t(
          "account.subscriptions.failedToOpenSubscriptionManagement"
        ),
        variant: "destructive",
      });
    } finally {
      setManaging(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin" />
        <span className="ml-2">
          {t("account.subscriptions.loadingSubscriptionData")}
        </span>
      </div>
    );
  }

  if (!subscriptionData) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">
          {t("account.subscriptions.failedToLoadSubscriptionData")}
        </p>
      </div>
    );
  }

  const { user } = subscriptionData;
  const isTrial = user.subscriptionStatus === "TRIAL";
  const isActive = user.subscriptionStatus === "ACTIVE";
  const isExpired = isTrial ? !user.isTrialActive : false;

  // Consider trial as active if not expired
  const isEffectivelyActive =
    (isTrial && !isExpired) || (isActive && !isExpired);

  return (
    <div className="space-y-6">
      {/* Trial Status Alert */}
      {isTrial && (
        <Card
          className={`p-4 ${isExpired ? "border-red-200 bg-red-50" : "border-blue-200 bg-indigo-50"}`}
        >
          <div className="flex items-center space-x-3">
            {isExpired ? (
              <AlertCircle className="w-5 h-5 text-red-500" />
            ) : (
              <CheckCircle className="w-5 h-5 text-primary" />
            )}
            <div>
              <h3
                className={`font-medium ${isExpired ? "text-red-800" : "text-blue-800"}`}
              >
                {isExpired
                  ? t("account.subscriptions.trialPeriodExpired")
                  : t("account.subscriptions.trialPeriodActive")}
              </h3>
              <p
                className={`text-sm ${isExpired ? "text-red-600" : "text-blue-600"}`}
              >
                {isExpired
                  ? t("account.subscriptions.trialPeriodExpiredDescription")
                  : t("account.subscriptions.trialPeriodExpiredDescription", {
                      days: user.trialDaysRemaining,
                    })}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Subscription Card */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("account.subscriptions.currentSubscription")}
              </h3>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900">
                {isTrial
                  ? t("account.subscriptions.trialPeriod")
                  : user.currentPlan?.name ||
                    t("account.subscriptions.noSubscription")}
              </h4>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge
                  className={`${
                    isTrial
                      ? "bg-blue-100 text-blue-800"
                      : isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {isTrial
                    ? t("account.subscriptions.trial")
                    : user.subscriptionStatus}
                </Badge>
                {user.subscriptionCanceled && (
                  <Badge className="bg-orange-100 text-orange-800">
                    Geannuleerd
                  </Badge>
                )}
                {(subscriptionData.user as any).gracePeriod
                  ?.isInGracePeriod && (
                  <Badge className="bg-amber-100 text-amber-800">
                    Grace Period (
                    {(subscriptionData.user as any).gracePeriod.daysRemaining}{" "}
                    dagen)
                  </Badge>
                )}
              </div>
            </div>

            {/* Subscription Status Section */}
            <div className="pt-4 border-t">
              <h5 className="font-medium text-gray-900 mb-2">
                Status & Datums
              </h5>
              <div className="space-y-2 text-sm">
                {!isTrial && user.subscriptionStartDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Abonnement gestart:</span>
                    <span className="font-medium">
                      {new Date(user.subscriptionStartDate).toLocaleDateString(
                        "nl-NL",
                        { day: "numeric", month: "long", year: "numeric" }
                      )}
                    </span>
                  </div>
                )}
                {user.subscriptionEndDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {user.subscriptionCanceled
                        ? "Verloopt op:"
                        : t("account.subscriptions.expires")}
                      :
                    </span>
                    <span
                      className={`font-medium ${user.subscriptionCanceled ? "text-orange-600" : ""}`}
                    >
                      {new Date(user.subscriptionEndDate).toLocaleDateString(
                        "nl-NL",
                        { day: "numeric", month: "long", year: "numeric" }
                      )}
                    </span>
                  </div>
                )}
                {(subscriptionData.user as any).gracePeriod
                  ?.isInGracePeriod && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Grace period eindigt:</span>
                    <span className="font-medium text-amber-600">
                      {(subscriptionData.user as any).gracePeriod.endsAt
                        ? new Date(
                            (subscriptionData.user as any).gracePeriod.endsAt
                          ).toLocaleDateString("nl-NL", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "-"}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span
                    className={`font-medium ${
                      isEffectivelyActive && !user.subscriptionCanceled
                        ? "text-green-600"
                        : (subscriptionData.user as any).gracePeriod
                              ?.isInGracePeriod
                          ? "text-amber-600"
                          : "text-gray-600"
                    }`}
                  >
                    {isEffectivelyActive && !user.subscriptionCanceled
                      ? "Actief"
                      : (subscriptionData.user as any).gracePeriod
                            ?.isInGracePeriod
                        ? "Verlopen (Grace Period actief)"
                        : isExpired
                          ? "Verlopen"
                          : "Inactief"}
                  </span>
                </div>
              </div>
            </div>

            {user.currentPlan && (
              <div className="pt-4 border-t">
                <h5 className="font-medium text-gray-900 mb-2">Plan Details</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {t("account.subscriptions.price")}:
                    </span>
                    <span className="font-medium">
                      €{user.currentPlan.price}/{t("common.month")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {t("account.subscriptions.chatbots")}:
                    </span>
                    <span className="font-medium">
                      {user.currentPlan.limits?.assistants === -1
                        ? t("account.subscriptions.unlimited")
                        : user.currentPlan.limits?.assistants || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {t("account.subscriptions.conversationsPerMonth")}:
                    </span>
                    <span className="font-medium">
                      {user.currentPlan.limits?.conversationsPerMonth === -1
                        ? t("account.subscriptions.unlimited")
                        : user.currentPlan.limits?.conversationsPerMonth || 0}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {isTrial && !isExpired && (
              <div className="pt-4 border-t">
                <h5 className="font-medium text-gray-900 mb-2">
                  {t("account.subscriptions.trialDetails")}
                </h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {t("account.subscriptions.started")}:
                    </span>
                    <span className="font-medium">
                      {user.trialStartDate
                        ? new Date(user.trialStartDate).toLocaleDateString(
                            "nl-NL"
                          )
                        : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {t("account.subscriptions.expires")}:
                    </span>
                    <span className="font-medium">
                      {user.trialEndDate
                        ? new Date(user.trialEndDate).toLocaleDateString(
                            "nl-NL"
                          )
                        : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {t("account.subscriptions.daysRemaining")}:
                    </span>
                    <span className="font-medium text-blue-600">
                      {user.trialDaysRemaining}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              {isActive && (
                <Button
                  onClick={handleManageSubscription}
                  disabled={managing}
                  variant="outline"
                  className="border-primary text-primary hover:bg-indigo-50"
                >
                  {managing
                    ? t("common.statuses.loading")
                    : t("account.subscriptions.manageSubscription")}
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Available Plans Card */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("account.subscriptions.availablePlans")}
              </h3>
            </div>

            <div className="space-y-3">
              {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => (
                <div key={key} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                    <span className="text-lg font-bold text-primary">
                      €{plan.price}/{t("common.month")}
                    </span>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1 mb-3">
                    {plan.features.slice(0, 3).map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handleUpgrade(key)}
                    disabled={
                      upgrading ||
                      (!isExpired && !isTrial && user.subscriptionPlan === key)
                    }
                    className="w-full bg-primary hover:bg-primary/80 text-white"
                    size="sm"
                  >
                    {upgrading
                      ? t("common.statuses.loading")
                      : !isExpired && !isTrial && user.subscriptionPlan === key
                        ? t("account.subscriptions.currentPlan")
                        : isExpired
                          ? "Upgrade"
                          : t("account.subscriptions.upgrade")}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Payment Methods Card */}
      {user.stripeCustomerId && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("account.subscriptions.paymentMethods")}
              </h3>
            </div>

            <div className="flex items-center space-x-3">
              <CreditCard className="w-8 h-8 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">
                  {t("account.subscriptions.managePaymentMethods")}
                </p>
                <p className="text-sm text-gray-600">
                  {t("account.subscriptions.managePaymentMethodsDescription")}
                </p>
              </div>
              <SaveButton
                onClick={handleManageSubscription}
                disabled={managing}
                className="ml-auto"
              >
                {managing ? t("common.statuses.loading") : t("common.manage")}
              </SaveButton>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
