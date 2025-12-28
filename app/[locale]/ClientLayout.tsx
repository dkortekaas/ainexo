import {
  HeroSection,
  HowItWorksSection,
  CTASection,
  FeaturesSection,
  PricingSection,
  TestimonialsSection,
} from "@/components/site";
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
