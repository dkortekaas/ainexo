"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface SubscriptionWidgetProps {
  compact?: boolean;
  showDetails?: boolean;
}

export function SubscriptionWidget({
  compact = false,
  showDetails = true,
}: SubscriptionWidgetProps) {
  const router = useRouter();
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch("/api/subscriptions");
      if (response.ok) {
        const data = await response.json();
        setSubscriptionData(data.user);
      }
    } catch (error) {
      console.error("Failed to fetch subscription data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
      </Card>
    );
  }

  if (!subscriptionData) {
    return null;
  }

  const isTrial = subscriptionData.subscriptionStatus === "TRIAL";
  const isActive = subscriptionData.subscriptionStatus === "ACTIVE";
  const trialDaysRemaining = subscriptionData.trialDaysRemaining || 0;
  const isInGracePeriod = subscriptionData.gracePeriod?.isInGracePeriod || false;
  const graceDaysRemaining = subscriptionData.gracePeriod?.daysRemaining || 0;

  // Calculate subscription days remaining
  let daysRemaining = 0;
  let totalDays = 0;
  let endDate: Date | null = null;

  if (isTrial && subscriptionData.trialEndDate) {
    endDate = new Date(subscriptionData.trialEndDate);
    const startDate = subscriptionData.trialStartDate
      ? new Date(subscriptionData.trialStartDate)
      : new Date();
    totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    daysRemaining = trialDaysRemaining;
  } else if (subscriptionData.subscriptionEndDate) {
    endDate = new Date(subscriptionData.subscriptionEndDate);
    const startDate = subscriptionData.subscriptionStartDate
      ? new Date(subscriptionData.subscriptionStartDate)
      : new Date();
    totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const now = new Date();
    daysRemaining = Math.max(
      0,
      Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );
  }

  const progress = totalDays > 0 ? ((totalDays - daysRemaining) / totalDays) * 100 : 0;

  // Determine status and styling
  let statusColor = "text-green-600";
  let statusBg = "bg-green-50";
  let statusBorder = "border-green-200";
  let statusIcon = <CheckCircle className="w-5 h-5" />;
  let statusText = "Actief";

  if (isInGracePeriod) {
    statusColor = "text-orange-600";
    statusBg = "bg-orange-50";
    statusBorder = "border-orange-200";
    statusIcon = <AlertTriangle className="w-5 h-5" />;
    statusText = "Grace Period";
  } else if (daysRemaining <= 7 && daysRemaining > 0) {
    statusColor = "text-yellow-600";
    statusBg = "bg-yellow-50";
    statusBorder = "border-yellow-200";
    statusIcon = <Clock className="w-5 h-5" />;
    statusText = "Verloopt Binnenkort";
  } else if (daysRemaining === 0) {
    statusColor = "text-red-600";
    statusBg = "bg-red-50";
    statusBorder = "border-red-200";
    statusIcon = <AlertTriangle className="w-5 h-5" />;
    statusText = "Verlopen";
  }

  const handleManageSubscription = () => {
    router.push("/account?tab=subscription");
  };

  // Compact version for sidebar/header
  if (compact) {
    return (
      <Card className={`p-4 ${statusBg} border ${statusBorder}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={statusColor}>{statusIcon}</div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {isTrial ? "Trial" : subscriptionData.subscriptionPlan || "Premium"}
              </p>
              <p className={`text-xs ${statusColor}`}>
                {isInGracePeriod
                  ? `${graceDaysRemaining} dag${graceDaysRemaining === 1 ? "" : "en"} grace`
                  : daysRemaining > 0
                    ? `${daysRemaining} dag${daysRemaining === 1 ? "" : "en"} resterend`
                    : "Verlopen"}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant={daysRemaining <= 7 || isInGracePeriod ? "default" : "outline"}
            onClick={handleManageSubscription}
          >
            {isTrial ? "Upgrade" : "Verlengen"}
          </Button>
        </div>
      </Card>
    );
  }

  // Full version for dashboard
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Abonnement Status
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {isTrial ? "Trial periode" : "Premium abonnement"}
          </p>
        </div>
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${statusBg} ${statusColor}`}>
          {statusIcon}
          <span className="text-sm font-medium">{statusText}</span>
        </div>
      </div>

      {/* Days Remaining */}
      <div className="mb-4">
        <div className="flex items-baseline justify-between mb-2">
          <div>
            {isInGracePeriod ? (
              <>
                <span className="text-3xl font-bold text-orange-600">
                  {graceDaysRemaining}
                </span>
                <span className="text-sm text-gray-600 ml-2">
                  {graceDaysRemaining === 1 ? "dag" : "dagen"} grace period
                </span>
              </>
            ) : daysRemaining > 0 ? (
              <>
                <span className="text-3xl font-bold text-gray-900">
                  {daysRemaining}
                </span>
                <span className="text-sm text-gray-600 ml-2">
                  {daysRemaining === 1 ? "dag" : "dagen"} resterend
                </span>
              </>
            ) : (
              <span className="text-xl font-bold text-red-600">Verlopen</span>
            )}
          </div>
          {endDate && daysRemaining > 0 && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Verloopt op</p>
              <p className="text-sm font-medium text-gray-900">
                {endDate.toLocaleDateString("nl-NL", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {!isInGracePeriod && totalDays > 0 && (
          <div className="space-y-2">
            <Progress
              value={progress}
              className="h-2"
              indicatorClassName={
                daysRemaining <= 7
                  ? "bg-red-500"
                  : daysRemaining <= 14
                    ? "bg-yellow-500"
                    : "bg-green-500"
              }
            />
            <p className="text-xs text-gray-500">
              {Math.round(progress)}% van abonnement verbruikt
            </p>
          </div>
        )}
      </div>

      {/* Grace Period Warning */}
      {isInGracePeriod && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-900">
            <strong>Let op:</strong> Je abonnement is verlopen. Je hebt nog{" "}
            {graceDaysRemaining} {graceDaysRemaining === 1 ? "dag" : "dagen"}{" "}
            toegang tot premium features.
          </p>
        </div>
      )}

      {/* Quick Stats */}
      {showDetails && (
        <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t">
          <div>
            <p className="text-xs text-gray-500 mb-1">Plan</p>
            <p className="text-sm font-medium text-gray-900">
              {isTrial
                ? "Trial"
                : subscriptionData.currentPlan?.name || "Premium"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Status</p>
            <p className="text-sm font-medium text-gray-900">
              {subscriptionData.subscriptionStatus}
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {isTrial ? (
          <Button
            onClick={handleManageSubscription}
            className="flex-1"
            variant="default"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Upgrade naar Premium
          </Button>
        ) : daysRemaining <= 14 || isInGracePeriod ? (
          <Button
            onClick={handleManageSubscription}
            className="flex-1"
            variant={isInGracePeriod ? "destructive" : "default"}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            {isInGracePeriod ? "Verlengen Nu" : "Verlengen Abonnement"}
          </Button>
        ) : (
          <Button
            onClick={handleManageSubscription}
            className="flex-1"
            variant="outline"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Beheer Abonnement
          </Button>
        )}
        <Button
          onClick={() => router.push("/account?tab=subscription")}
          variant="ghost"
          size="icon"
        >
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Additional Info */}
      {daysRemaining > 0 && daysRemaining <= 7 && !isInGracePeriod && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-900">
            💡 <strong>Tip:</strong> Verlengen nu om geen onderbreking te ervaren
            in je service.
          </p>
        </div>
      )}
    </Card>
  );
}
