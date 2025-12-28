"use client";

import { PricingTier } from "@/types/types";
import { useState } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface PricingCardProps {
  tier: PricingTier;
  isYearly: boolean;
}

// Lazy initialization of Stripe - only load if key is available
function getStripePromise(): Promise<Stripe | null> {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!publishableKey) {
    console.warn(
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set. Stripe checkout will not work. " +
        "Please add it to your .env.local file. See docs/STRIPE_SETUP_NL.md for setup instructions."
    );
    return Promise.resolve(null);
  }

  return loadStripe(publishableKey);
}

export function PricingCard({ tier, isYearly }: PricingCardProps) {
  const t = useTranslations("pricingPage");
  const price = isYearly ? tier.yearlyPrice : tier.monthlyPrice;
  const displayPrice = price === 0 ? t("free") : `${tier.currency}${price}`;
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    // Get the appropriate price ID based on billing period
    const priceId = isYearly
      ? tier.stripePriceIdYearly
      : tier.stripePriceIdMonthly;

    if (!priceId) {
      // Fallback to regular link if no price ID
      if (tier.ctaLink) {
        window.location.href = tier.ctaLink;
      }
      return;
    }

    setLoading(true);

    try {
      // Create checkout session
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout
      const stripe = await getStripePromise();
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId });
      } else {
        throw new Error(
          "Stripe is not configured. Please set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in your environment variables."
        );
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`relative p-6 rounded-2xl bg-card border transition-all duration-300 ${
        tier.highlighted
          ? "border-primary shadow-glow"
          : "border-border hover:border-primary/30 hover:shadow-soft"
      }`}
    >
      {/* Popular badge */}
      {tier.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 rounded-full bg-gradient-primary text-primary-foreground text-xs font-medium">
            {t("mostPopular")}
          </span>
        </div>
      )}

      {/* Plan header */}
      <div className="mb-6">
        <h3 className="font-display text-lg font-semibold text-foreground mb-1">
          {tier.name}
        </h3>
        <div className="flex items-baseline gap-1 mb-2">
          {tier.monthlyPrice ? (
            <>
              <span className="font-display text-4xl font-bold text-foreground">
                {displayPrice}
              </span>
              <span className="text-muted-foreground">{t("perMonth")}</span>
              {isYearly && (
                <span className="text-sm text-muted-foreground line-through ml-2">
                  {displayPrice}
                </span>
              )}
            </>
          ) : (
            <span className="font-display text-3xl font-bold text-foreground">
              {t("letsTalk")}
            </span>
          )}
        </div>
      </div>

      {/* CTA */}
      <Button
        variant={tier.highlighted ? "hero" : "outline"}
        className="w-full mb-6"
        size="lg"
        asChild
      >
        <Link href="/register">{tier.ctaText}</Link>
      </Button>

      {/* Features */}
      <div className="space-y-3">
        {tier.highlighted && (
          <p className="text-sm font-medium text-primary mb-2">
            {tier.highlighted}
          </p>
        )}
        {tier.features.map((feature, i) => (
          <div key={i} className="flex items-start gap-2">
            <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <span className="text-sm text-muted-foreground">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
