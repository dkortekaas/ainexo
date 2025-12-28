"use client";

import { TrialStatusWidget } from "@/components/subscription/TrialStatusWidget";
import { QuotaIndicator } from "@/components/subscription/QuotaIndicator";

export function TrialDashboardWidgets() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
      <TrialStatusWidget />
      <QuotaIndicator />
    </div>
  );
}

