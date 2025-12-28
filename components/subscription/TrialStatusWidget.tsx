"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, AlertTriangle, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface TrialStatusWidgetProps {
  compact?: boolean;
}

interface TrialData {
  trialDaysRemaining: number;
  trialEndDate: string | null;
  trialStartDate: string | null;
  isTrialActive: boolean;
  gracePeriod?: {
    isInGracePeriod: boolean;
    daysRemaining: number;
  };
}

export function TrialStatusWidget({ compact = false }: TrialStatusWidgetProps) {
  const router = useRouter();
  const [trialData, setTrialData] = useState<TrialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    fetchTrialData();
  }, []);

  useEffect(() => {
    if (!trialData?.trialEndDate) return;

    const updateCountdown = () => {
      if (!trialData?.trialEndDate) return;
      const now = new Date().getTime();
      const endDate = new Date(trialData.trialEndDate).getTime();
      const difference = endDate - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeRemaining({ days, hours, minutes, seconds });
      } else {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [trialData?.trialEndDate]);

  const fetchTrialData = async () => {
    try {
      const response = await fetch("/api/subscriptions");
      if (response.ok) {
        const data = await response.json();
        setTrialData({
          trialDaysRemaining: data.user.trialDaysRemaining || 0,
          trialEndDate: data.user.trialEndDate,
          trialStartDate: data.user.trialStartDate,
          isTrialActive: data.user.isTrialActive,
          gracePeriod: data.user.gracePeriod,
        });
      }
    } catch (error) {
      console.error("Failed to fetch trial data:", error);
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

  if (!trialData || !trialData.isTrialActive) {
    return null;
  }

  const isInGracePeriod = trialData.gracePeriod?.isInGracePeriod || false;
  const daysRemaining = isInGracePeriod
    ? trialData.gracePeriod?.daysRemaining || 0
    : trialData.trialDaysRemaining;

  // Calculate progress
  const trialStart = trialData.trialStartDate
    ? new Date(trialData.trialStartDate)
    : new Date();
  const trialEnd = trialData.trialEndDate
    ? new Date(trialData.trialEndDate)
    : new Date();
  const totalDays = Math.ceil(
    (trialEnd.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  const progress =
    totalDays > 0 ? ((totalDays - daysRemaining) / totalDays) * 100 : 0;

  // Determine status
  let statusColor = "text-blue-600";
  let statusBg = "bg-blue-50";
  let statusBorder = "border-blue-200";
  let statusIcon = <Clock className="w-5 h-5" />;
  let statusText = "Trial Actief";

  if (isInGracePeriod) {
    statusColor = "text-orange-600";
    statusBg = "bg-orange-50";
    statusBorder = "border-orange-200";
    statusIcon = <AlertTriangle className="w-5 h-5" />;
    statusText = "Grace Period";
  } else if (daysRemaining <= 3 && daysRemaining > 0) {
    statusColor = "text-yellow-600";
    statusBg = "bg-yellow-50";
    statusBorder = "border-yellow-200";
    statusIcon = <AlertTriangle className="w-5 h-5" />;
    statusText = "Verloopt Binnenkort";
  } else if (daysRemaining === 0) {
    statusColor = "text-red-600";
    statusBg = "bg-red-50";
    statusBorder = "border-red-200";
    statusIcon = <AlertTriangle className="w-5 h-5" />;
    statusText = "Verlopen";
  }

  const handleUpgrade = () => {
    router.push("/account?tab=subscription");
  };

  // Compact version
  if (compact) {
    return (
      <Card className={`p-4 ${statusBg} border ${statusBorder}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={statusColor}>{statusIcon}</div>
            <div>
              <p className="text-sm font-medium text-gray-900">Trial</p>
              {timeRemaining && timeRemaining.days > 0 ? (
                <p className={`text-xs ${statusColor}`}>
                  {timeRemaining.days} dag{timeRemaining.days === 1 ? "" : "en"}{" "}
                  resterend
                </p>
              ) : timeRemaining ? (
                <p className={`text-xs ${statusColor}`}>
                  {timeRemaining.hours}u {timeRemaining.minutes}m
                </p>
              ) : (
                <p className={`text-xs ${statusColor}`}>
                  {daysRemaining} dag{daysRemaining === 1 ? "" : "en"} resterend
                </p>
              )}
            </div>
          </div>
          <Button size="sm" onClick={handleUpgrade}>
            Upgrade
          </Button>
        </div>
      </Card>
    );
  }

  // Full version
  return (
    <Card className={`p-6 ${statusBg} border ${statusBorder}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Trial Status</h3>
          <p className="text-sm text-gray-600 mt-1">
            {isInGracePeriod
              ? "Je trial is verlopen, maar je hebt nog tijdelijk toegang"
              : "Je proefperiode loopt nog"}
          </p>
        </div>
        <div
          className={`flex items-center space-x-2 px-3 py-1 rounded-full ${statusBg} ${statusColor}`}
        >
          {statusIcon}
          <span className="text-sm font-medium">{statusText}</span>
        </div>
      </div>

      {/* Countdown Timer */}
      {timeRemaining && daysRemaining > 0 && (
        <div className="mb-4">
          <div className="flex items-baseline justify-between mb-2">
            <div>
              {daysRemaining > 0 ? (
                <>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {timeRemaining.days}
                    </span>
                    <span className="text-sm text-gray-600">dagen</span>
                    <span className="text-2xl font-bold text-gray-700">:</span>
                    <span className="text-3xl font-bold text-gray-900">
                      {String(timeRemaining.hours).padStart(2, "0")}
                    </span>
                    <span className="text-sm text-gray-600">uur</span>
                    <span className="text-2xl font-bold text-gray-700">:</span>
                    <span className="text-3xl font-bold text-gray-900">
                      {String(timeRemaining.minutes).padStart(2, "0")}
                    </span>
                    <span className="text-sm text-gray-600">min</span>
                    <span className="text-2xl font-bold text-gray-700">:</span>
                    <span className="text-3xl font-bold text-gray-900">
                      {String(timeRemaining.seconds).padStart(2, "0")}
                    </span>
                    <span className="text-sm text-gray-600">sec</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Verloopt op{" "}
                    {trialData.trialEndDate
                      ? new Date(trialData.trialEndDate).toLocaleDateString(
                          "nl-NL",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )
                      : ""}
                  </p>
                </>
              ) : (
                <span className="text-xl font-bold text-red-600">
                  Trial Verlopen
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {!isInGracePeriod && totalDays > 0 && (
            <div className="space-y-2">
              <Progress
                value={progress}
                className="h-2"
                indicatorClassName={
                  daysRemaining <= 3
                    ? "bg-red-500"
                    : daysRemaining <= 7
                      ? "bg-yellow-500"
                      : "bg-blue-500"
                }
              />
              <p className="text-xs text-gray-500">
                {Math.round(progress)}% van trial verbruikt
              </p>
            </div>
          )}
        </div>
      )}

      {/* Grace Period Warning */}
      {isInGracePeriod && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-900">
            <strong>Let op:</strong> Je trial is verlopen. Je hebt nog{" "}
            {trialData.gracePeriod?.daysRemaining || 0}{" "}
            {trialData.gracePeriod?.daysRemaining === 1 ? "dag" : "dagen"}{" "}
            toegang tot premium features.
          </p>
        </div>
      )}

      {/* Action Button */}
      <Button
        onClick={handleUpgrade}
        className="w-full"
        variant={daysRemaining <= 3 || isInGracePeriod ? "default" : "outline"}
      >
        <TrendingUp className="w-4 h-4 mr-2" />
        Upgrade naar Premium
      </Button>

      {/* Warning Message */}
      {daysRemaining > 0 && daysRemaining <= 3 && !isInGracePeriod && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-900">
            ⚠️ <strong>Waarschuwing:</strong> Je trial verloopt binnenkort.
            Upgrade nu om geen onderbreking te ervaren.
          </p>
        </div>
      )}
    </Card>
  );
}
