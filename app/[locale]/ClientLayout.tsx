import { HeroSection } from "@/components/site/Hero";
import { HowItWorksSection } from "@/components/site/HowItWorks";
import { CTASection } from "@/components/site/CTA";
// import { TrustedBySection } from "@/components/site/TrustedBy";
import { FeaturesSection } from "@/components/site/Features";
import { PricingSection } from "@/components/site/Pricing";
import { TestimonialsSection } from "@/components/site/Testimonials";
import type { HeroSection as HeroSectionType } from "@/sanity/lib/homepage";
import type { ChatWidget } from "@/sanity/lib/fetch";

interface ClientLayoutProps {
  heroData?: HeroSectionType | null;
  chatWidgetConfig?: ChatWidget | null;
  locale: string;
}

const Index = ({ heroData, chatWidgetConfig, locale }: ClientLayoutProps) => {
  return (
    <>
      <HeroSection heroData={heroData} chatWidgetConfig={chatWidgetConfig} />
      {/* <TrustedBySection /> */}
      <FeaturesSection />
      <HowItWorksSection locale={locale} />
      <PricingSection locale={locale} />
      <TestimonialsSection locale={locale} />
      <CTASection locale={locale} />
    </>
  );
};

export default Index;
