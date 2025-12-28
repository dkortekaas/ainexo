// lib/seo.ts

import { Metadata } from "next";
import config from "@/config";

export function generateMetadata(
  title: string,
  description: string,
  path: string = "/"
): Metadata {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/${path}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: config.appTitle,
      locale: "nl_NL",
      type: "website",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
  };
}
