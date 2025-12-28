"use client";

import { useEffect, useState } from "react";
import { X, AlertTriangle, Clock, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface GracePeriodBannerProps {
  isInGracePeriod: boolean;
  daysRemaining: number;
  urgency: "none" | "info" | "warning" | "critical";
  message: string;
  onDismiss?: () => void;
}

export function GracePeriodBanner({
  isInGracePeriod,
  daysRemaining,
  urgency,
  message,
  onDismiss,
}: GracePeriodBannerProps) {
  const router = useRouter();
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if not in grace period or already dismissed
  if (!isInGracePeriod || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleUpgrade = () => {
    router.push("/account?tab=subscription");
  };

  // Determine styles based on urgency
  const styles = {
    none: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-800",
      button: "bg-blue-600 hover:bg-blue-700",
      icon: <AlertCircle className="h-5 w-5" />,
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-800",
      button: "bg-blue-600 hover:bg-blue-700",
      icon: <Clock className="h-5 w-5" />,
    },
    warning: {
      bg: "bg-yellow-50",
      border: "border-yellow-300",
      text: "text-yellow-900",
      button: "bg-yellow-600 hover:bg-yellow-700",
      icon: <AlertTriangle className="h-5 w-5" />,
    },
    critical: {
      bg: "bg-red-50",
      border: "border-red-300",
      text: "text-red-900",
      button: "bg-red-600 hover:bg-red-700",
      icon: <AlertTriangle className="h-5 w-5 animate-pulse" />,
    },
  };

  const style = styles[urgency] || styles.warning;

  const title =
    daysRemaining === 0
      ? "⚠️ Laatste dag van grace period!"
      : daysRemaining === 1
        ? "⏰ Grace period eindigt morgen"
        : `📅 Grace period: ${daysRemaining} dagen resterend`;

  const description =
    daysRemaining === 0
      ? "Je abonnement is verlopen. Verlengen vandaag om toegang te behouden."
      : daysRemaining === 1
        ? "Je abonnement is verlopen. Verlengen nu om je features te behouden."
        : "Je abonnement is verlopen, maar je hebt nog tijdelijk toegang. Verlengen binnenkort om geen onderbreking te ervaren.";

  return (
    <div
      className={`${style.bg} border-b ${style.border} ${style.text} px-4 py-3 sticky top-0 z-50 shadow-md`}
      role="alert"
    >
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <div className="flex-shrink-0">{style.icon}</div>
          <div className="flex-1">
            <p className="font-bold text-sm md:text-base">{title}</p>
            <p className="text-xs md:text-sm mt-1">{description}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={handleUpgrade}
            className={`${style.button} text-white px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap`}
          >
            {daysRemaining === 0 ? "Verlengen Nu" : "Verlengen Abonnement"}
          </button>
          <button
            onClick={handleDismiss}
            className={`${style.text} hover:${style.text}/80 p-1`}
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
