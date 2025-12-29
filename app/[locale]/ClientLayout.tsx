import {
  HomepageHeroSection,
  HowItWorksSection,
  CTASection,
  FeaturesSection,
  PricingSection,
  TestimonialsSection,
} from "@/components/site";
import type { HomepageHeroSection as HomepageHeroSectionType } from "@/sanity/lib/homepage";
import type { ChatWidget } from "@/sanity/lib/fetch";

interface ClientLayoutProps {
  heroData?: HomepageHeroSectionType | null;
  chatWidgetConfig?: ChatWidget | null;
  locale: string;
}

const Index = ({ heroData, chatWidgetConfig, locale }: ClientLayoutProps) => {
  return (
    <>
      <HomepageHeroSection heroData={heroData} chatWidgetConfig={chatWidgetConfig} />
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
