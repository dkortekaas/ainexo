import { defineConfig, type Config } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import {
  documentInternationalization,
  DeleteTranslationAction,
} from "@sanity/document-internationalization";
import { schemaTypes } from "./schemas";
import { supportedLanguages } from "./lib/i18n";

export function createSanityConfig(): Config {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

  // Validate required environment variables
  if (!projectId) {
    throw new Error(
      "Missing required environment variable: NEXT_PUBLIC_SANITY_PROJECT_ID. " +
        "Please set this in your .env.local file or Vercel environment variables."
    );
  }

  if (!dataset) {
    throw new Error(
      "Missing required environment variable: NEXT_PUBLIC_SANITY_DATASET. " +
        "Please set this in your .env.local file or Vercel environment variables."
    );
  }

  return defineConfig({
    name: "default",
    title: "Ainexo CMS",
    projectId,
    dataset,
    basePath: "/studio",
    plugins: [
      structureTool(),
      visionTool(),
      documentInternationalization({
        supportedLanguages,
        schemaTypes: [
          "siteSettings",
          "mainMenu",
          "feature",
          "heroSection",
          "howItWorksStep",
          "testimonial",
          "pricingPlan",
          "ctaSection",
          "landingPage",
          "page",
          "privacyPolicy",
          "termsOfService",
          "blogPost",
          "blogCategory",
          "blogAuthor",
        ],
      }),
    ],
    schema: {
      types: schemaTypes,
    },
    document: {
      actions: (prev, context) => {
        return [...prev, DeleteTranslationAction];
      },
    },
  });
}

// Export default config for backward compatibility
// Only create if env vars are available to prevent build errors
let _config: Config | null = null;

export default function getConfig(): Config {
  if (!_config) {
    _config = createSanityConfig();
  }
  return _config;
}
