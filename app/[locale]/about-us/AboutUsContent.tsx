"use client";

import { useTranslations } from "next-intl";
import { Target, Users, Lightbulb, Heart, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function AboutUsContent() {
  const t = useTranslations("aboutUs");
  const params = useParams();
  const locale = params?.locale as string;

  const values = [
    {
      icon: Zap,
      title: t("values.innovation.title"),
      description: t("values.innovation.description"),
    },
    {
      icon: Users,
      title: t("values.customerFirst.title"),
      description: t("values.customerFirst.description"),
    },
    {
      icon: Shield,
      title: t("values.trust.title"),
      description: t("values.trust.description"),
    },
    {
      icon: Heart,
      title: t("values.simplicity.title"),
      description: t("values.simplicity.description"),
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary/10 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
            <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-6">
              {t("hero.title")}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              {t("hero.subtitle")}
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-6">
                <Target className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-primary">
                  {t("mission.label")}
                </span>
              </div>
              <h2 className="text-4xl font-bold text-foreground mb-6">
                {t("mission.title")}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                {t("mission.description1")}
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t("mission.description2")}
              </p>
            </div>

            <div
              className="bg-card rounded-2xl p-8 shadow-card border border-border animate-scale-in"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-card-foreground mb-2">
                      {t("vision.title")}
                    </h3>
                    <p className="text-muted-foreground">
                      {t("vision.description")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-foreground mb-8 text-center">
              {t("story.title")}
            </h2>
            <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
              <p>{t("story.paragraph1")}</p>
              <p>{t("story.paragraph2")}</p>
              <p>{t("story.paragraph3")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-foreground mb-4">
                {t("values.title")}
              </h2>
              <p className="text-xl text-muted-foreground">
                {t("values.subtitle")}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {values.map((value, index) => (
                <div
                  key={value.title}
                  className="bg-card rounded-2xl p-8 shadow-card border border-border hover:shadow-glow transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mb-6">
                    <value.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold text-card-foreground mb-3">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-t from-primary/10 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-foreground mb-6">
              {t("cta.title")}
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              {t("cta.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/${locale}/pricing`}>
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary-dark text-primary-foreground font-semibold shadow-glow"
                >
                  {t("cta.startFree")}
                </Button>
              </Link>
              <Link href={`/${locale}/contact`}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 font-semibold"
                >
                  {t("cta.contact")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
