// app/[locale]/privacy-policy/page.tsx

import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import config from "@/config";
import PrivacyPolicyContent from "./PrivacyPolicyContent";
import { getPrivacyPolicy } from "@/sanity/lib/fetch";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  // Try to get metadata from Sanity, fallback to translations
  let privacyPolicy = null;
  try {
    privacyPolicy = await getPrivacyPolicy(locale);
  } catch (error) {
    console.error("Error fetching privacy policy for metadata:", error);
  }

  const t = await getTranslations({ locale, namespace: "privacyPolicy" });

  const title =
    privacyPolicy?.seo?.metaTitle || privacyPolicy?.title || t("title");
  const description = privacyPolicy?.seo?.metaDescription || t("description");

  return {
    title: `${title} | ${config.appTitle}`,
    description,
    keywords: privacyPolicy?.seo?.keywords,
    openGraph: {
      title: `${title} | ${config.appTitle}`,
      description,
      url: `https://ainexo.app/${locale}/privacy-policy`,
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

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  let privacyPolicy = null;
  try {
    privacyPolicy = await getPrivacyPolicy(locale);
  } catch (error) {
    console.error("Error fetching privacy policy:", error);
  }

  return <PrivacyPolicyContent data={privacyPolicy} />;
}
