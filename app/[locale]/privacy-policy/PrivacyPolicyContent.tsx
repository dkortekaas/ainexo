"use client";

import { useTranslations } from "next-intl";
import { Shield, Lock, Eye, FileText, Mail, Calendar } from "lucide-react";

export default function PrivacyPolicyContent() {
  const t = useTranslations("privacyPolicy");
  const currentDate = new Date().toLocaleDateString("nl-NL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const sections = [
    {
      icon: FileText,
      title: t("sections.dataCollection.title"),
      content: [
        t("sections.dataCollection.intro"),
        t("sections.dataCollection.personalData"),
        t("sections.dataCollection.usageData"),
        t("sections.dataCollection.technicalData"),
      ],
    },
    {
      icon: Eye,
      title: t("sections.howWeUse.title"),
      content: [
        t("sections.howWeUse.intro"),
        t("sections.howWeUse.purpose1"),
        t("sections.howWeUse.purpose2"),
        t("sections.howWeUse.purpose3"),
        t("sections.howWeUse.purpose4"),
        t("sections.howWeUse.purpose5"),
      ],
    },
    {
      icon: Shield,
      title: t("sections.dataSecurity.title"),
      content: [
        t("sections.dataSecurity.intro"),
        t("sections.dataSecurity.measure1"),
        t("sections.dataSecurity.measure2"),
        t("sections.dataSecurity.measure3"),
        t("sections.dataSecurity.measure4"),
      ],
    },
    {
      icon: Lock,
      title: t("sections.yourRights.title"),
      content: [
        t("sections.yourRights.intro"),
        t("sections.yourRights.right1"),
        t("sections.yourRights.right2"),
        t("sections.yourRights.right3"),
        t("sections.yourRights.right4"),
        t("sections.yourRights.right5"),
        t("sections.yourRights.right6"),
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
              <Shield className="w-5 h-5 text-primary" />
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

            {/* Cookies Section */}
            <div className="animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-foreground mb-6">
                    {t("sections.cookies.title")}
                  </h2>
                  <div className="space-y-4">
                    <p className="text-muted-foreground leading-relaxed">
                      {t("sections.cookies.intro")}
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      {t("sections.cookies.types")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Third Parties Section */}
            <div className="animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-foreground mb-6">
                    {t("sections.thirdParties.title")}
                  </h2>
                  <div className="space-y-4">
                    <p className="text-muted-foreground leading-relaxed">
                      {t("sections.thirdParties.intro")}
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      {t("sections.thirdParties.services")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Changes Section */}
            <div className="animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
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
                href="mailto:privacy@ainexo.app"
                className="text-primary font-semibold hover:underline"
              >
                privacy@ainexo.app
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
