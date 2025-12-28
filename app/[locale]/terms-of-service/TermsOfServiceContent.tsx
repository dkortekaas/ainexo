"use client";

import { useTranslations } from "next-intl";
import { HeroSection } from "@/components/site";
import { TermsOfService } from "@/sanity/lib/fetch";
import { formatDate } from "@/lib/utils";
import { PortableTextRenderer } from "@/components/blog/PortableTextRenderer";

interface TermsOfServiceContentProps {
  data: TermsOfService | null;
}

export default function TermsOfServiceContent({
  data,
}: TermsOfServiceContentProps) {
  const t = useTranslations("termsOfService");

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">
          Terms of service content not available.
        </p>
      </div>
    );
  }

  const lastUpdatedDate = formatDate(
    data.lastUpdatedDate || new Date().toISOString()
  );

  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      <HeroSection
        heroData={{
          badge: data.badge,
          headline: data.title,
          lastUpdatedDate: lastUpdatedDate,
        }}
      />

      {/* Main Content Sections */}
      {data.sections && data.sections.length > 0 && (
        <section className="py-12 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-12">
              {data.sections.map((section, index) => {
                return (
                  <div
                    key={section._key || index}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-start gap-4 mb-6">
                      <div className="flex-1">
                        <h2 className="text-3xl font-bold text-foreground mb-6">
                          {section.title}
                        </h2>
                        {section.content && section.content.length > 0 && (
                          <div className="text-muted-foreground">
                            <PortableTextRenderer value={section.content} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </section>
  );
}
