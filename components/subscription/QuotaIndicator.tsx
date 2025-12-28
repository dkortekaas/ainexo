"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, FileText, Globe, Bot, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface QuotaIndicatorProps {
  compact?: boolean;
}

interface UsageData {
  usage: {
    assistants: number;
    documents: number;
    websites: number;
    conversations: number;
  };
  limits: {
    assistants: number;
    documents: number;
    websites: number;
    conversations: number;
  };
  subscription: {
    plan: string | null;
    isTrial: boolean;
    isExpired: boolean;
  };
}

export function QuotaIndicator({ compact = false }: QuotaIndicatorProps) {
  const router = useRouter();
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsageData();
  }, []);

  const fetchUsageData = async () => {
    try {
      const response = await fetch("/api/subscriptions/usage");
      if (response.ok) {
        const data = await response.json();
        setUsageData(data);
      }
    } catch (error) {
      console.error("Failed to fetch usage data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  if (!usageData) {
    return null;
  }

  const { usage, limits, subscription } = usageData;

  const getProgress = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min(100, (used / limit) * 100);
  };

  const getProgressColor = (used: number, limit: number) => {
    if (limit === -1) return "bg-green-500";
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-yellow-500";
    return "bg-blue-500";
  };

  const quotaItems = [
    {
      label: "Conversaties",
      icon: MessageSquare,
      used: usage.conversations,
      limit: limits.conversations,
      unit: "gesprekken",
    },
    {
      label: "Assistenten",
      icon: Bot,
      used: usage.assistants,
      limit: limits.assistants,
      unit: "assistenten",
    },
    {
      label: "Documenten",
      icon: FileText,
      used: usage.documents,
      limit: limits.documents,
      unit: "documenten",
    },
    {
      label: "Websites",
      icon: Globe,
      used: usage.websites,
      limit: limits.websites,
      unit: "websites",
    },
  ];

  // Compact version
  if (compact) {
    const conversations = quotaItems[0];
    const progress = getProgress(conversations.used, conversations.limit);
    const isNearLimit = progress >= 75;

    return (
      <Card
        className={`p-4 ${
          isNearLimit ? "border-yellow-200 bg-yellow-50" : "border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">
              {conversations.label}
            </span>
          </div>
          <span className="text-sm text-gray-600">
            {conversations.used} /{" "}
            {conversations.limit === -1 ? "∞" : conversations.limit}
          </span>
        </div>
        {conversations.limit !== -1 && (
          <Progress
            value={progress}
            className="h-2"
            indicatorClassName={getProgressColor(
              conversations.used,
              conversations.limit
            )}
          />
        )}
        {isNearLimit && conversations.limit !== -1 && (
          <p className="text-xs text-yellow-700 mt-2">
            ⚠️ Bijna limiet bereikt
          </p>
        )}
      </Card>
    );
  }

  // Full version
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Gebruik & Limieten
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {subscription.isTrial ? "Trial plan" : subscription.plan || "Plan"}
          </p>
        </div>
        {subscription.isTrial && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push("/account?tab=subscription")}
          >
            Upgrade
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {quotaItems.map((item) => {
          const progress = getProgress(item.used, item.limit);
          const isUnlimited = item.limit === -1;
          const isNearLimit = !isUnlimited && progress >= 75;
          const isAtLimit = !isUnlimited && progress >= 100;

          return (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <item.icon className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {isAtLimit && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      isAtLimit
                        ? "text-red-600"
                        : isNearLimit
                          ? "text-yellow-600"
                          : "text-gray-600"
                    }`}
                  >
                    {item.used} / {isUnlimited ? "∞" : item.limit}{" "}
                    {item.unit}
                  </span>
                </div>
              </div>
              {!isUnlimited && (
                <>
                  <Progress
                    value={progress}
                    className="h-2"
                    indicatorClassName={getProgressColor(item.used, item.limit)}
                  />
                  {isNearLimit && (
                    <p className="text-xs text-yellow-700 mt-1">
                      {isAtLimit
                        ? "⚠️ Limiet bereikt"
                        : "⚠️ Bijna limiet bereikt"}
                    </p>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Warning for trial users near limit */}
      {subscription.isTrial && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-900">
            💡 <strong>Tip:</strong> Upgrade naar een premium plan voor hogere
            limieten en meer features.
          </p>
        </div>
      )}
    </Card>
  );
}

