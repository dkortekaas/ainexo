import { Button } from "@/components/ui/button";

interface PageCTASectionProps {
  heading?: string;
  description?: string;
  primaryButtonText?: string;
  primaryButtonLink?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
}

export const PageCTASection = ({
  heading = "Ready to Get Started?",
  description,
  primaryButtonText,
  primaryButtonLink,
  secondaryButtonText,
  secondaryButtonLink,
}: PageCTASectionProps) => {
  return (
    <div className="text-center max-w-3xl mx-auto p-12 rounded-3xl bg-gradient-cta relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />

      <div className="relative">
        <h2 className="font-display text-3xl font-bold text-primary-foreground mb-4">
          {heading}
        </h2>
        {description && (
          <p className="text-lg text-primary-foreground/80 mb-8">{description}</p>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {primaryButtonText && (
            <Button size="lg" variant="secondary" asChild>
              <a href={primaryButtonLink || "#"}>{primaryButtonText}</a>
            </Button>
          )}
          {secondaryButtonText && (
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 bg-transparent"
              asChild
            >
              <a href={secondaryButtonLink || "#"}>{secondaryButtonText}</a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
