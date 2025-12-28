"use client";

import { useTranslations } from "next-intl";
import {
  FileText,
  Scale,
  ShieldCheck,
  CreditCard,
  AlertTriangle,
  XCircle,
  Calendar,
  Mail,
} from "lucide-react";

export default function TermsOfServiceContent() {
  const t = useTranslations("termsOfService");
  const currentDate = new Date().toLocaleDateString("nl-NL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const sections = [
    {
      icon: FileText,
      title: t("sections.acceptance.title"),
      content: [
        t("sections.acceptance.paragraph1"),
        t("sections.acceptance.paragraph2"),
      ],
    },
    {
      icon: ShieldCheck,
      title: t("sections.accountRegistration.title"),
      content: [
        t("sections.accountRegistration.paragraph1"),
        t("sections.accountRegistration.paragraph2"),
        t("sections.accountRegistration.paragraph3"),
      ],
    },
    {
      icon: CreditCard,
      title: t("sections.subscriptionBilling.title"),
      content: [
        t("sections.subscriptionBilling.paragraph1"),
        t("sections.subscriptionBilling.paragraph2"),
        t("sections.subscriptionBilling.paragraph3"),
        t("sections.subscriptionBilling.paragraph4"),
      ],
    },
    {
      icon: Scale,
      title: t("sections.useOfService.title"),
      content: [
        t("sections.useOfService.intro"),
        t("sections.useOfService.prohibited1"),
        t("sections.useOfService.prohibited2"),
        t("sections.useOfService.prohibited3"),
        t("sections.useOfService.prohibited4"),
        t("sections.useOfService.prohibited5"),
      ],
    },
    {
      icon: FileText,
      title: t("sections.intellectualProperty.title"),
      content: [
        t("sections.intellectualProperty.paragraph1"),
        t("sections.intellectualProperty.paragraph2"),
        t("sections.intellectualProperty.paragraph3"),
      ],
    },
    {
      icon: AlertTriangle,
      title: t("sections.limitationLiability.title"),
      content: [
        t("sections.limitationLiability.paragraph1"),
        t("sections.limitationLiability.paragraph2"),
      ],
    },
    {
      icon: XCircle,
      title: t("sections.termination.title"),
      content: [
        t("sections.termination.paragraph1"),
        t("sections.termination.paragraph2"),
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-b from-primary/10 to-background border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-6">
              <Scale className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-primary">
                {t("badge")}
              </span>
            </div>
            <h1 className="text-5xl font-bold text-foreground mb-4">
              {t("title")}
            </h1>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <p className="text-sm">
                {t("lastUpdated")}: {currentDate}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card rounded-2xl p-8 shadow-card border border-border">
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                {t("intro.paragraph1")}
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t("intro.paragraph2")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-12">
            {sections.map((section, index) => (
              <div
                key={section.title}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                    <section.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-foreground mb-6">
                      {section.title}
                    </h2>
                    <div className="space-y-4">
                      {section.content.map((paragraph, idx) => (
                        <p
                          key={idx}
                          className="text-muted-foreground leading-relaxed"
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Data Privacy Section */}
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "0.7s" }}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-foreground mb-6">
                    {t("sections.dataPrivacy.title")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("sections.dataPrivacy.content")}
                  </p>
                </div>
              </div>
            </div>

            {/* Changes Section */}
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "0.8s" }}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-foreground mb-6">
                    {t("sections.changes.title")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("sections.changes.content")}
                  </p>
                </div>
              </div>
            </div>

            {/* Governing Law Section */}
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "0.9s" }}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                  <Scale className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-foreground mb-6">
                    {t("sections.governingLaw.title")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("sections.governingLaw.content")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 bg-primary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card rounded-2xl p-8 shadow-card border border-border text-center">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                {t("contact.title")}
              </h2>
              <p className="text-muted-foreground mb-6">
                {t("contact.description")}
              </p>
              <a
                href="mailto:support@ainexo.app"
                className="text-primary font-semibold hover:underline"
              >
                support@ainexo.app
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
