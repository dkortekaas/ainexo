// app/[locale]/about-us/page.tsx

import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import config from "@/config";
import AboutUsContent from "./AboutUsContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "aboutUs" });

  return {
    title: `${t("title")} | ${config.appTitle}`,
    description: t("description"),
    openGraph: {
      title: `${t("title")} | ${config.appTitle}`,
      description: t("description"),
      url: `https://ainexo.app/${locale}/about-us`,
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

export default function AboutUsPage() {
  return <AboutUsContent />;
}
