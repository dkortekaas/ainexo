import React from "react";
import { useTranslations } from "next-intl";
import type { PageHero as PageHeroType } from "@/sanity/lib/page";
import { Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface HeroSectionProps {
  heroData?: PageHeroType | null;
}

export function HeroSection({ heroData }: HeroSectionProps) {
  const t = useTranslations("hero");

  if (!heroData) {
    return null;
  }

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
      {heroData.badge && (
        <span className="inline-block px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-4">
          {heroData.badge}
        </span>
      )}
      <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
        {heroData.headline}
      </h1>
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
        {heroData.subheadline}
      </p>
      {heroData.lastUpdatedDate && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <p className="text-sm">
            {t("lastUpdated")}:{" "}
            {formatDate(heroData.lastUpdatedDate || new Date().toISOString())}
          </p>
        </div>
      )}
    </section>
  );
}
