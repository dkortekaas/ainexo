import { getLandingPage } from "@/sanity/lib/landingPage";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LeadForm } from "@/components/landing/LeadForm";
import { FAQSection } from "@/components/landing/FAQSection";
import { Star, CheckCircle, Zap, Shield, TrendingUp, Users, LucideIcon } from "lucide-react";
import { Metadata } from "next";

interface LandingPageProps {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
}

// Icon mapping for features
const iconMap: Record<string, LucideIcon> = {
  CheckCircle,
  Star,
  Zap,
  Shield,
  TrendingUp,
  Users,
};

export async function generateMetadata({
  params,
}: LandingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getLandingPage(slug);

  if (!page) {
    return {
      title: "Page Not Found",
    };
  }

  return {
    title: page.seo?.metaTitle || page.title,
    description: page.seo?.metaDescription || page.hero.subheadline,
    keywords: page.seo?.keywords,
    openGraph: page.seo?.ogImageUrl
      ? {
          images: [page.seo.ogImageUrl],
        }
      : undefined,
  };
}

export const revalidate = 60; // Revalidate every 60 seconds

export default async function LandingPage({ params }: LandingPageProps) {
  const { slug } = await params;
  const page = await getLandingPage(slug);

  if (!page) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 bg-gradient-hero overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="max-w-xl">
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
                {page.hero.headline}
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                {page.hero.subheadline}
              </p>
              <Button size="xl" asChild>
                <a href={page.hero.ctaLink || "#lead-form"}>
                  {page.hero.ctaText}
                </a>
              </Button>
            </div>

            {/* Hero Image */}
            {page.hero.imageUrl && (
              <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src={page.hero.imageUrl}
                  alt={page.hero.imageAlt || page.hero.headline}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      {page.features && page.features.length > 0 && (
        <section className="py-20 lg:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {page.features.map((feature, index) => {
                const IconComponent = iconMap[feature.icon] || CheckCircle;
                return (
                  <div
                    key={index}
                    className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-soft transition-all duration-300"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                      {feature.title}
                    </h3>
                    {feature.description && (
                      <p className="text-muted-foreground">{feature.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Social Proof Section */}
      {page.socialProof?.enabled && (
        <section className="py-20 lg:py-32 bg-secondary/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {page.socialProof.headline && (
              <h2 className="font-display text-3xl font-bold text-foreground text-center mb-12">
                {page.socialProof.headline}
              </h2>
            )}

            {/* Company Logos */}
            {page.socialProof.companyLogos &&
              page.socialProof.companyLogos.length > 0 && (
                <div className="flex flex-wrap justify-center items-center gap-8 mb-16">
                  {page.socialProof.companyLogos.map((logo, index) => (
                    <div
                      key={index}
                      className="relative h-12 w-32 grayscale hover:grayscale-0 transition-all"
                    >
                      <Image
                        src={logo.logoUrl}
                        alt={logo.companyName}
                        fill
                        className="object-contain"
                      />
                    </div>
                  ))}
                </div>
              )}

            {/* Testimonials */}
            {page.socialProof.testimonials &&
              page.socialProof.testimonials.length > 0 && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {page.socialProof.testimonials.map((testimonial, index) => (
                    <div
                      key={index}
                      className="p-8 rounded-2xl bg-card border border-border"
                    >
                      <div className="flex gap-1 mb-4">
                        {Array.from({ length: testimonial.rating }).map((_, i) => (
                          <Star
                            key={i}
                            className="w-5 h-5 fill-primary text-primary"
                          />
                        ))}
                      </div>
                      <p className="text-foreground mb-6 leading-relaxed">
                        &ldquo;{testimonial.quote}&rdquo;
                      </p>
                      <div className="flex items-center gap-3">
                        {testimonial.avatarUrl ? (
                          <div className="relative w-10 h-10 rounded-full overflow-hidden">
                            <Image
                              src={testimonial.avatarUrl}
                              alt={testimonial.author}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                            {testimonial.author
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-foreground">
                            {testimonial.author}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {testimonial.role}, {testimonial.company}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {page.faq?.enabled && page.faq.questions && page.faq.questions.length > 0 && (
        <section className="py-20 lg:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <FAQSection
              headline={page.faq.headline}
              questions={page.faq.questions}
            />
          </div>
        </section>
      )}

      {/* Lead Form Section */}
      {page.leadForm?.enabled && (
        <section id="lead-form" className="py-20 lg:py-32 bg-secondary/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <LeadForm
              headline={page.leadForm.headline}
              description={page.leadForm.description}
              fields={page.leadForm.fields}
              submitButtonText={page.leadForm.submitButtonText}
              successMessage={page.leadForm.successMessage}
            />
          </div>
        </section>
      )}
    </div>
  );
}
