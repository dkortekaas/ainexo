import { getPage } from "@/sanity/lib/page";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { TextSection } from "@/components/page/TextSection";
import { ContactFormSection } from "@/components/page/ContactFormSection";
import { TeamSection } from "@/components/page/TeamSection";
import { StatsSection } from "@/components/page/StatsSection";
import { PageCTASection } from "@/components/page/PageCTASection";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const page = await getPage(slug);

    if (!page) {
      return {
        title: "Page Not Found",
      };
    }

    return {
      title: page.seo?.metaTitle || page.title,
      description: page.seo?.metaDescription || page.hero?.subheadline,
      keywords: page.seo?.keywords,
    };
  } catch (error) {
    // If Sanity is not configured, return default metadata
    console.error("Error fetching page metadata:", error);
    return {
      title: "Page",
    };
  }
}

export const revalidate = 60; // Revalidate every 60 seconds

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  let page;
  try {
    page = await getPage(slug);
  } catch (error) {
    // If Sanity is not configured, show 404
    console.error("Error fetching page:", error);
    notFound();
  }

  if (!page) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      {page.hero && (
        <section className="pt-32 pb-16 bg-gradient-hero">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumbs */}
            {page.hero.showBreadcrumbs && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <Link href="/" className="hover:text-primary transition-colors">
                  Home
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-foreground">{page.title}</span>
              </div>
            )}

            <div className="max-w-3xl">
              {page.hero.headline && (
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                  {page.hero.headline}
                </h1>
              )}
              {page.hero.subheadline && (
                <p className="text-lg text-muted-foreground">
                  {page.hero.subheadline}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Page Sections */}
      {page.sections && page.sections.length > 0 && (
        <div className="py-20">
          {page.sections.map((section, index) => {
            const isLastSection = index === page.sections!.length - 1;
            const marginBottom = isLastSection ? "" : "mb-20 lg:mb-32";

            return (
              <section
                key={section._key}
                className={`container mx-auto px-4 sm:px-6 lg:px-8 ${marginBottom}`}
              >
                {section._type === "textSection" && (
                  <TextSection
                    heading={section.heading}
                    content={section.content}
                  />
                )}

                {section._type === "contactFormSection" && (
                  <ContactFormSection
                    heading={section.heading}
                    description={section.description}
                    submitButtonText={section.submitButtonText}
                    successMessage={section.successMessage}
                    contactInfo={section.contactInfo}
                  />
                )}

                {section._type === "teamSection" && (
                  <TeamSection
                    heading={section.heading}
                    description={section.description}
                    teamMembers={section.teamMembers}
                  />
                )}

                {section._type === "statsSection" && (
                  <StatsSection
                    heading={section.heading}
                    stats={section.stats}
                  />
                )}

                {section._type === "ctaSection" && (
                  <PageCTASection
                    heading={section.heading}
                    description={section.description}
                    primaryButtonText={section.primaryButtonText}
                    primaryButtonLink={section.primaryButtonLink}
                    secondaryButtonText={section.secondaryButtonText}
                    secondaryButtonLink={section.secondaryButtonLink}
                  />
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
