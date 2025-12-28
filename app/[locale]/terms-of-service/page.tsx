// app/[locale]/terms-of-service/page.tsx

import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import config from "@/config";
import TermsOfServiceContent from "./TermsOfServiceContent";
import { getTermsOfService } from "@/sanity/lib/fetch";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  // Try to get metadata from Sanity, fallback to translations
  let termsOfService = null;
  try {
    termsOfService = await getTermsOfService(locale);
  } catch (error) {
    console.error("Error fetching terms of service for metadata:", error);
  }

  const t = await getTranslations({ locale, namespace: "termsOfService" });

  const title =
    termsOfService?.seo?.metaTitle || termsOfService?.title || t("title");
  const description = termsOfService?.seo?.metaDescription || t("description");

  return {
    title: `${title} | ${config.appTitle}`,
    description: description,
    openGraph: {
      title: `${title} | ${config.appTitle}`,
      description: description,
      url: `https://ainexo.app/${locale}/terms-of-service`,
      siteName: config.appTitle,
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
        },
      ],
      locale: locale === "nl" ? "nl_NL" : "en_US",
      type: "website",
    },
  };
}

export default async function TermsOfServicePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  let termsOfService = null;
  try {
    termsOfService = await getTermsOfService(locale);
  } catch (error) {
    console.error("Error fetching terms of service:", error);
  }
  return <TermsOfServiceContent data={termsOfService} />;
}
