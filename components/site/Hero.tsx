import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatWidgetWrapper } from "@/components/site/ChatWidgetWrapper";
import type { HeroSection as HeroSectionType } from "@/sanity/lib/homepage";
import type { ChatWidget } from "@/sanity/lib/fetch";

// Default fallback data
const defaultHeroData = {
  badge: "✦ Modernizing AI Chatbots for websites",
  headline: "Build AI Agents that deliver the",
  highlightedText: "most accurate answers",
  benefits: [
    "5 minutes to set-up and deploy instantly",
    "Tailor to your brand voice",
    "Train on large knowledge bases, files and webpages",
    "Provide 24/7 instant sales and customer service",
    "Add AI chatbot to your website, no coding needed",
  ],
  primaryCTA: {
    text: "Build your Agent",
    link: "#",
  },
  secondaryCTA: {
    text: "View Demo",
    link: "#demo",
  },
  trustIndicator: "No credit card required",
};

interface HeroSectionProps {
  heroData?: HeroSectionType | null;
  chatWidgetConfig?: ChatWidget | null;
}

export const HeroSection = ({
  heroData,
  chatWidgetConfig,
}: HeroSectionProps) => {
  const finalHeroData = heroData || defaultHeroData;
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left column - Content */}
          <div className="max-w-xl animate-slide-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent border border-primary/20 mb-6">
              <span className="text-primary text-sm font-medium">
                {finalHeroData.badge}
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              {finalHeroData.headline}{" "}
              <span className="text-gradient">
                {finalHeroData.highlightedText}
              </span>
            </h1>

            {/* Benefits list */}
            <ul className="space-y-3 mb-8">
              {finalHeroData.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-muted-foreground">{benefit}</span>
                </li>
              ))}
            </ul>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="xl" asChild>
                <a href={finalHeroData.primaryCTA.link}>
                  {finalHeroData.primaryCTA.text}
                </a>
              </Button>
              <Button variant="hero-outline" size="xl" asChild>
                <a href={finalHeroData.secondaryCTA.link}>
                  {finalHeroData.secondaryCTA.text}
                </a>
              </Button>
            </div>

            {/* Trust indicator */}
            <p className="mt-4 text-sm text-muted-foreground flex items-center gap-2">
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              {finalHeroData.trustIndicator}
            </p>
          </div>

          {/* Right column - Chat Widget */}
          <div
            className="relative animate-slide-in-right"
            style={{ animationDelay: "0.2s" }}
          >
            <ChatWidgetWrapper config={chatWidgetConfig ?? null} />
          </div>
        </div>
      </div>
    </section>
  );
};
