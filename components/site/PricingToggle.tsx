"use client";

import { Switch } from "@/components/ui/switch";

interface PricingToggleProps {
  isYearly: boolean;
  onToggle: (isYearly: boolean) => void;
  monthlyLabel: string;
  yearlyLabel: string;
}

export function PricingToggle({
  isYearly,
  onToggle,
  monthlyLabel,
  yearlyLabel,
}: PricingToggleProps) {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-12">
      <div className="flex items-center justify-center gap-4">
        <span
          className={`text-sm font-medium ${!isYearly ? "text-foreground" : "text-muted-foreground"}`}
        >
          {monthlyLabel}
        </span>
        <Switch
          checked={isYearly}
          onCheckedChange={onToggle}
          className="data-[state=checked]:bg-primary"
        />
        <span
          className={`text-sm font-medium ${isYearly ? "text-foreground" : "text-muted-foreground"}`}
        >
          {yearlyLabel}
        </span>
        <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
          17% Discount
        </span>
      </div>
    </section>
  );
}
