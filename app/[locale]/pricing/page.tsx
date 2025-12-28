"use client";

import React, { useState, useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { PricingCard } from "@/components/site/PricingCard";
import { PricingToggle } from "@/components/site/PricingToggle";
import { getPricingPage } from "@/lib/sanity.queries";
import { PricingPage as PricingPageType } from "@/types/types";
import { isValidLanguage, Language } from "@/i18n/config";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";

const Pricing = () => {
  const t = useTranslations("pricingPage");
  const params = useParams();
  const locale = params?.locale as string;
  const [isYearly, setIsYearly] = useState(false);
  const [pricingData, setPricingData] = useState<PricingPageType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPricingData() {
      if (!isValidLanguage(locale)) {
        notFound();
      }

      try {
        const data = await getPricingPage(locale as Language);
        setPricingData(data);
      } catch (error) {
        console.error("Error loading pricing data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadPricingData();
  }, [locale]);

  if (!isValidLanguage(locale)) {
    notFound();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-300">{t("loading")}</div>
      </div>
    );
  }

  if (!pricingData) {
    return notFound();
  }

  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      <TooltipProvider>
        {/* Header */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-4">
            {t("aiAgentPricing")}
          </span>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            {pricingData.heroTitle}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {pricingData.heroSubtitle}
          </p>
        </section>

        {/* Free Trial Banner */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <div className="max-w-4xl mx-auto p-6 rounded-2xl bg-card border border-border shadow-card">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-foreground text-lg mb-1">
                  Start your free trial
                </h3>
                <p className="text-muted-foreground">
                  No credit card required, free forever until your credits run
                  out
                </p>
                <p className="text-sm text-muted-foreground">
                  Start with 20 message credits monthly and store up to 50
                  webpages.
                </p>
              </div>
              <Button variant="hero" size="lg">
                Start for Free
              </Button>
            </div>
          </div>
        </section>

        {/* Billing Toggle */}
        <PricingToggle
          isYearly={isYearly}
          onToggle={setIsYearly}
          monthlyLabel={pricingData.monthlyLabel}
          yearlyLabel={pricingData.yearlyLabel}
        />

        {/* Pricing Cards */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {pricingData.pricingTiers.map((tier, index) => (
              <PricingCard key={index} tier={tier} isYearly={isYearly} />
            ))}
          </div>
        </section>

        {/* Add-ons */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="max-w-md mx-auto p-6 rounded-2xl bg-card border border-border shadow-card text-center">
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">
              Add-Ons
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Extra Message Credits
            </p>
            <p className="text-muted-foreground mb-4">
              Add an extra 1000 message credits for a one-time fee.
            </p>
            <div className="flex items-baseline justify-center gap-1 mb-4">
              <span className="font-display text-4xl font-bold text-foreground">
                $15.99
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Available for purchase in your dashboard.
            </p>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
              {pricingData.featuresComparisonTitle}
            </h2>
            {/* <p className="text-muted-foreground">
              {pricingData.featuresComparisonDescription}
            </p> */}
          </div>

          <div className="max-w-7xl mx-auto overflow-x-auto">
            <table className="w-full border-collapse">
              {/* Header */}
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-medium text-foreground min-w-[200px]">
                    Features
                  </th>
                  {pricingData.pricingTiers.map((tier, index) => (
                    <th
                      key={index}
                      className="text-center py-4 px-4 min-w-[140px]"
                    >
                      <div className="font-display font-semibold text-foreground">
                        {tier.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {tier.monthlyPrice
                          ? `$${isYearly ? tier.yearlyPrice : tier.monthlyPrice} ${t("perMonth")}`
                          : t("custom")}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Body */}
              <tbody>
                {pricingData.featuresComparison &&
                  pricingData.featuresComparison.length > 0 &&
                  pricingData.featuresComparison.map(
                    (section, sectionIndex) => (
                      <>
                        {/* Category header */}
                        <tr
                          key={`section-${sectionIndex}`}
                          className="bg-secondary/50"
                        >
                          <td
                            colSpan={5}
                            className="py-3 px-4 font-semibold text-foreground"
                          >
                            {section.category}
                          </td>
                        </tr>

                        {/* Features */}
                        {section.features.map((feature, featureIndex) => (
                          <tr
                            key={`feature-${sectionIndex}-${featureIndex}`}
                            className="border-b border-border/50"
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-foreground">
                                  {feature.name}
                                </span>
                                {/* {feature.tooltip && (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <HelpCircle className="w-4 h-4 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{feature.tooltip}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )} */}
                              </div>
                            </td>
                            {feature.availability.map((value, valueIndex) => (
                              <td
                                key={valueIndex}
                                className="text-center py-3 px-4"
                              >
                                {typeof value === "boolean" ? (
                                  value ? (
                                    <Check className="w-5 h-5 text-primary mx-auto" />
                                  ) : (
                                    <X className="w-5 h-5 text-muted-foreground/50 mx-auto" />
                                  )
                                ) : (
                                  <span className="text-sm text-foreground">
                                    {value.value}
                                  </span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </>
                    )
                  )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Features Comparison Table */}
        {pricingData.featuresComparison &&
          pricingData.featuresComparison.length > 0 && (
            <div className="mt-20">
              {pricingData.featuresComparisonTitle && (
                <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
                  {pricingData.featuresComparisonTitle}
                </h2>
              )}

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-4 px-6 text-gray-900 dark:text-white font-semibold">
                          Features
                        </th>
                        {pricingData.pricingTiers.map((tier, index) => (
                          <th
                            key={index}
                            className="text-center py-4 px-6 text-gray-900 dark:text-white font-semibold"
                          >
                            {tier.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pricingData.featuresComparison.map(
                        (category, catIndex) => (
                          <>
                            <tr key={`cat-${catIndex}`}>
                              <td
                                colSpan={pricingData.pricingTiers.length + 1}
                                className="py-4 px-6 bg-gray-50 dark:bg-gray-700 font-semibold text-gray-900 dark:text-white"
                              >
                                {category.category}
                              </td>
                            </tr>
                            {category.features.map((feature, featureIndex) => (
                              <tr
                                key={`feature-${catIndex}-${featureIndex}`}
                                className="border-b border-gray-100 dark:border-gray-700"
                              >
                                <td className="py-4 px-6 text-gray-700 dark:text-gray-300">
                                  {feature.name}
                                </td>
                                {feature.availability.map(
                                  (avail, availIndex) => (
                                    <td
                                      key={availIndex}
                                      className="text-center py-4 px-6"
                                    >
                                      {avail.value ? (
                                        <span className="text-gray-700 dark:text-gray-300">
                                          {avail.value}
                                        </span>
                                      ) : avail.included ? (
                                        <svg
                                          className="w-6 h-6 mx-auto text-green-500"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                          />
                                        </svg>
                                      ) : (
                                        <svg
                                          className="w-6 h-6 mx-auto text-gray-300 dark:text-gray-600"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                          />
                                        </svg>
                                      )}
                                    </td>
                                  )
                                )}
                              </tr>
                            ))}
                          </>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
      </TooltipProvider>
    </section>
  );
};

export default Pricing;
