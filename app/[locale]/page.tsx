// app/[locale]/page.tsx

import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import ClientLayout from "@/app/[locale]/ClientLayout";
import config from "@/config";
import { getHeroSection } from "@/sanity/lib/homepage";
import { getChatWidget } from "@/sanity/lib/fetch";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: t("title"),
    description: t("description"),
    keywords: t("keywords"),
    openGraph: {
      title: t("og.title"),
      description: t("og.description"),
      url: `https://ainexo.app/${locale}`,
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
    twitter: {
      card: "summary_large_image",
      title: t("twitter.title"),
      description: t("twitter.description"),
      images: ["/og-image.png"],
    },
  };
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Fetch data in Server Component
  let chatWidgetConfig = null;
  let heroData = null;

  try {
    chatWidgetConfig = await getChatWidget();
  } catch (error) {
    console.error("Error fetching chat widget config from Sanity:", error);
  }

  try {
    heroData = await getHeroSection(locale);
  } catch (error) {
    console.error("Error fetching hero section from Sanity:", error);
  }

  return (
    <ClientLayout
      heroData={heroData}
      chatWidgetConfig={chatWidgetConfig}
      locale={locale}
    />
  );
}
