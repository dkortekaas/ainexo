import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { getLocale, getTranslations } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { Toaster } from "@/components/ui/toaster";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import config from "@/config";

const inter = Inter({
  subsets: ["latin"],
  display: "swap", // Prevent invisible text during font load
  preload: true,
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
    title: t("metadata.title"),
    description: t("metadata.description"),
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      ],
      apple: [
        { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
    },
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: config.appTitle,
    },
  };
}

// Viewport configuration - accessible for users with low vision
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Allow zooming up to 5x for accessibility
  // userScalable removed to allow default (true) - enables pinch-to-zoom
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1f2937" },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = (await import(`../messages/${locale}.json`)).default;

  return (
    <html lang={locale} className="scroll-smooth">
      <head>
        {/* Preconnect to third-party domains for better performance */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://ainexo-pi-blond.vercel.app" />

        {/* Preload critical images for LCP optimization */}
        <link
          rel="preload"
          as="image"
          href="/ainexo-logo.png"
          type="image/png"
        />
      </head>
      <body
        className={`${inter.className} bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <NextIntlClientProvider messages={messages} locale={locale}>
            <AuthProvider>
              {children}
              <Toaster />
              <GoogleAnalytics
                GA_MEASUREMENT_ID={
                  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ""
                }
              />
              {/* Chatbot Widget - Deferred for better performance */}
              <Script
                src="https://ainexo.app/widget/loader.js"
                data-chatbot-id="cbk_live_5c072cd7ff1b7380976d045e63f1e97310d98aa4487e6b7315e8ddfccd8ee728"
                strategy="lazyOnload"
              />
            </AuthProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
