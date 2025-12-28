import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { getCTASection } from "@/sanity/lib/homepage";

// Default fallback data
const defaultCTAData = {
  headline: "Ready to transform your customer support?",
  description:
    "Join thousands of businesses using Ainexo to deliver exceptional customer experiences. Start your free trial today.",
  primaryCTA: {
    text: "Start for Free",
    link: "#",
  },
  secondaryCTA: {
    text: "Schedule a Demo",
    link: "#",
  },
};

export const CTASection = async ({ locale }: { locale: string }) => {
  let ctaData = defaultCTAData;

  try {
    const sanityCTA = await getCTASection(locale);
    if (sanityCTA) {
      ctaData = sanityCTA;
    }
  } catch (error) {
    console.error("Error fetching CTA section from Sanity:", error);
  }
  return (
    <section className="py-20 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-cta p-12 lg:p-20">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative text-center max-w-3xl mx-auto">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
              {ctaData.headline}
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              {ctaData.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="xl"
                className="bg-background text-foreground hover:bg-background/90 shadow-lg"
                asChild
              >
                <a href={ctaData.primaryCTA.link}>
                  {ctaData.primaryCTA.text}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </a>
              </Button>
              <Button
                size="xl"
                variant="outline"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 bg-transparent"
                asChild
              >
                <a href={ctaData.secondaryCTA.link}>
                  {ctaData.secondaryCTA.text}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
