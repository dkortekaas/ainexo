// app/[locale]/layout.tsx
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import "@/app/globals.css";
import type { Viewport } from "next";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/HeaderWrapper";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Viewport configuration to prevent zooming on mobile
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1f2937" },
  ],
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const currentLocale = await getLocale();

  // Ensure we have a valid locale
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  // Ensure that the locale being rendered and the current locale are aligned
  if (locale !== currentLocale) {
    // Optionally handle mismatch
    console.warn(
      `Locale mismatch: rendering ${locale} but current is ${currentLocale}`
    );
  }

  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider
      messages={messages}
      locale={locale}
      timeZone="Europe/Amsterdam"
    >
      <div className="min-h-screen bg-background">
        <Header locale={locale} />
        <main>{children}</main>
        <Footer locale={locale} />
      </div>
    </NextIntlClientProvider>
  );
}
