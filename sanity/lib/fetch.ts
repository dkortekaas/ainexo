import { client } from "../client";
import {
  featuresQuery,
  chatWidgetQuery,
  socialMediaQuery,
  mainMenuQuery,
  footerProductMenuQuery,
  footerCompanyMenuQuery,
  footerResourcesMenuQuery,
  footerLegalMenuQuery,
  siteSettingsQuery,
  privacyPolicyQuery,
  termsOfServiceQuery,
} from "../queries";
import type { BlogPost } from "./types";
import { PortableTextBlock } from "@portabletext/types";

// Feature types
export interface Feature {
  _id: string;
  title: string;
  description: string;
  icon: string;
  benefits: string[];
  order: number;
}

// Chat widget types
export interface ChatMessage {
  type: "agent" | "user";
  text: string;
}

export interface ChatWidget {
  _id: string;
  agentName: string;
  agentRole: string;
  agentAvatar: string;
  messages: ChatMessage[];
  placeholderText: string;
  actionButtons: {
    cancelText: string;
    upgradeText: string;
  };
}

// Social media types
export interface SocialMedia {
  _id: string;
  platform: string;
  url: string;
  order: number;
}

// Menu item types
export interface MainMenu {
  language: string;
  name: string;
  href: string;
  openInNewTab: boolean;
}

// Alias for better semantic clarity
export type MenuItem = MainMenu;

// Site settings types
export interface SiteSettings {
  _id: string;
  title: string;
  description: string;
  footerTagline: string;
  copyrightText: string;
}

// Privacy Policy types
export interface PrivacyPolicySection {
  _key: string;
  title: string;
  content: PortableTextBlock[];
}

export interface PrivacyPolicyContact {
  title?: string;
  description?: string;
  email?: string;
}

export interface PrivacyPolicySEO {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
}

export interface PrivacyPolicy {
  _id: string;
  title: string;
  badge?: string;
  lastUpdatedDate?: string;
  sections?: PrivacyPolicySection[];
  contact?: PrivacyPolicyContact;
  seo?: PrivacyPolicySEO;
}

// Terms and Conditions types
export interface TermsOfServiceSection {
  _key: string;
  title: string;
  content: PortableTextBlock[];
}

export interface TermsOfServiceSEO {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
}

export interface TermsOfService {
  _id: string;
  title: string;
  badge?: string;
  lastUpdatedDate?: string;
  sections?: TermsOfServiceSection[];
  seo?: TermsOfServiceSEO;
}

// Fetch functions
export async function getFeatures(locale: string = "nl"): Promise<Feature[]> {
  return client.fetch(featuresQuery, { locale }, { next: { revalidate: 60 } });
}

export async function getChatWidget(): Promise<ChatWidget | null> {
  return client.fetch(chatWidgetQuery, {}, { next: { revalidate: 60 } });
}

// Social media is global - no locale parameter
export async function getSocialMedia(): Promise<SocialMedia[]> {
  return client.fetch(socialMediaQuery, {}, { next: { revalidate: 60 } });
}

export async function getMainMenu(locale: string = "nl"): Promise<MainMenu[]> {
  return client.fetch(mainMenuQuery, { locale }, { next: { revalidate: 60 } });
}

export async function getFooterProductMenu(
  locale: string = "nl"
): Promise<MainMenu[]> {
  return client.fetch(
    footerProductMenuQuery,
    { locale },
    { next: { revalidate: 60 } }
  );
}

export async function getFooterCompanyMenu(
  locale: string = "nl"
): Promise<MainMenu[]> {
  return client.fetch(
    footerCompanyMenuQuery,
    { locale },
    { next: { revalidate: 60 } }
  );
}

export async function getFooterResourcesMenu(
  locale: string = "nl"
): Promise<MainMenu[]> {
  return client.fetch(
    footerResourcesMenuQuery,
    { locale },
    { next: { revalidate: 60 } }
  );
}

export async function getFooterLegalMenu(
  locale: string = "nl"
): Promise<MainMenu[]> {
  return client.fetch(
    footerLegalMenuQuery,
    { locale },
    { next: { revalidate: 60 } }
  );
}

export async function getSiteSettings(
  locale: string = "nl"
): Promise<SiteSettings | null> {
  return client.fetch(
    siteSettingsQuery,
    { locale },
    { next: { revalidate: 60 } }
  );
}

/**
 * Calculate reading time in minutes from PortableText content
 */
export function calculateReadingTime(content?: PortableTextBlock[]): number {
  if (!content) return 0;

  // Extract text from PortableText blocks
  const extractText = (blocks: PortableTextBlock[]): string => {
    let text = "";
    for (const block of blocks) {
      if (block._type === "block" && block.children) {
        for (const child of block.children) {
          if (typeof child.text === "string") {
            text += child.text + " ";
          }
        }
      }
    }
    return text;
  };

  const text = extractText(content);
  // Average reading speed: 200-250 words per minute
  // Using 200 for a conservative estimate
  const wordsPerMinute = 200;
  const wordCount = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return Math.max(1, minutes); // At least 1 minute
}

/**
 * Get all blog posts for a locale
 */
export async function getBlogPosts(
  locale: string,
  preview: boolean = false
): Promise<BlogPost[]> {
  try {
    const query = `*[_type == "blogPost" && language == $locale] | order(publishedAt desc) {
      _id,
      _createdAt,
      _updatedAt,
      language,
      title,
      "slug": slug.current,
      excerpt,
      mainImage,
      body,
      author,
      publishedAt,
      categories
    }`;

    const posts = await client.fetch(query, { locale });

    // Transform to match expected BlogPost type
    return posts.map((post: any) => ({
      _id: post._id,
      _createdAt: post._createdAt,
      _updatedAt: post._updatedAt,
      language: post.language,
      title: post.title,
      slug:
        typeof post.slug === "string" ? post.slug : post.slug?.current || "",
      excerpt: post.excerpt,
      // Map mainImage to featuredImage
      featuredImage: post.mainImage
        ? {
            asset: post.mainImage.asset,
            alt: post.mainImage.alt,
          }
        : undefined,
      // Map body to content
      content: post.body,
      author: post.author,
      publishedAt: post.publishedAt,
      categories: post.categories
        ? post.categories.map((cat: string, index: number) => ({
            _id: `cat-${index}`,
            name: cat,
          }))
        : undefined,
      tags: undefined, // Not in schema, but code expects it
      seoTitle: undefined,
      seoDescription: undefined,
      seoKeywords: undefined,
    }));
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return [];
  }
}

/**
 * Get a single blog post by slug
 */
export async function getBlogPostBySlug(
  slug: string,
  locale: string,
  preview: boolean = false
): Promise<BlogPost | null> {
  try {
    const query = `*[_type == "blogPost" && slug.current == $slug && language == $locale][0] {
      _id,
      _createdAt,
      _updatedAt,
      language,
      title,
      "slug": slug.current,
      excerpt,
      mainImage,
      body,
      author,
      publishedAt,
      categories
    }`;

    const post = await client.fetch(query, { slug, locale });

    if (!post) return null;

    // Transform to match expected BlogPost type
    return {
      _id: post._id,
      _createdAt: post._createdAt,
      _updatedAt: post._updatedAt,
      language: post.language,
      title: post.title,
      slug: post.slug || "",
      excerpt: post.excerpt,
      // Map mainImage to featuredImage
      featuredImage: post.mainImage
        ? {
            asset: post.mainImage.asset,
            alt: post.mainImage.alt,
          }
        : undefined,
      // Map body to content
      content: post.body,
      author: post.author,
      publishedAt: post.publishedAt,
      categories: post.categories
        ? post.categories.map((cat: string, index: number) => ({
            _id: `cat-${index}`,
            name: cat,
          }))
        : undefined,
      tags: undefined, // Not in schema, but code expects it
      seoTitle: undefined,
      seoDescription: undefined,
      seoKeywords: undefined,
    };
  } catch (error) {
    console.error("Error fetching blog post by slug:", error);
    return null;
  }
}

/**
 * Get all blog post slugs for static generation
 */
export async function getBlogSlugs(): Promise<
  Array<{ slug: string; locale: string }>
> {
  try {
    const query = `*[_type == "blogPost"] {
      "slug": slug.current,
      "locale": language
    }`;

    const results = await client.fetch(query);

    return results.map((post: any) => ({
      slug: post.slug,
      locale: post.locale || post.language,
    }));
  } catch (error) {
    console.error("Error fetching blog slugs:", error);
    return [];
  }
}

/**
 * Get privacy policy for a locale
 */
export async function getPrivacyPolicy(
  locale: string = "nl"
): Promise<PrivacyPolicy | null> {
  try {
    return client.fetch(
      privacyPolicyQuery,
      { locale },
      { next: { revalidate: 60 } }
    );
  } catch (error) {
    console.error("Error fetching privacy policy:", error);
    return null;
  }
}

/**
 * Get terms of service for a locale
 */
export async function getTermsOfService(
  locale: string = "nl"
): Promise<TermsOfService | null> {
  return client.fetch(
    termsOfServiceQuery,
    { locale },
    { next: { revalidate: 60 } }
  );
}
