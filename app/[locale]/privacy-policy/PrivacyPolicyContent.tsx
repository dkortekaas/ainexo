"use client";

import { Mail } from "lucide-react";
import type { PrivacyPolicy } from "@/sanity/lib/fetch";
import { PortableTextRenderer } from "@/components/blog/PortableTextRenderer";
import { HeroSection } from "@/components/site";
import { formatDate } from "@/lib/utils";

interface PrivacyPolicyContentProps {
  data: PrivacyPolicy | null;
}

export default function PrivacyPolicyContent({
  data,
}: PrivacyPolicyContentProps) {
  // Fallback to default content if no data from Sanity
  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">
          Privacy policy content not available.
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

      {/* Contact Section */}
      {data.contact && (
        <section className="py-12 bg-primary/5">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="bg-card rounded-2xl p-8 shadow-card border border-border text-center">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                {data.contact.title && (
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    {data.contact.title}
                  </h2>
                )}
                {data.contact.description && (
                  <p className="text-muted-foreground mb-6">
                    {data.contact.description}
                  </p>
                )}
                {data.contact.email && (
                  <a
                    href={`mailto:${data.contact.email}`}
                    className="text-primary font-semibold hover:underline"
                  >
                    {data.contact.email}
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </section>
  );
}
