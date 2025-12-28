import { client } from "../client";
import { pagesQuery, pageQuery } from "../queries";

// Types
export interface PageHero {
  badge?: string;
  headline?: string;
  subheadline?: string;
  lastUpdatedDate?: string;
  showBreadcrumbs?: boolean;
}

export interface TextSection {
  _type: "textSection";
  _key: string;
  heading?: string;
  content?: any[];
}

export interface ContactFormSection {
  _type: "contactFormSection";
  _key: string;
  heading?: string;
  description?: string;
  submitButtonText?: string;
  successMessage?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
}

export interface TeamMember {
  name: string;
  role?: string;
  bio?: string;
  imageUrl?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
  };
}

export interface TeamSection {
  _type: "teamSection";
  _key: string;
  heading?: string;
  description?: string;
  teamMembers?: TeamMember[];
}

export interface Stat {
  value: string;
  label: string;
  icon?: string;
}

export interface StatsSection {
  _type: "statsSection";
  _key: string;
  heading?: string;
  stats?: Stat[];
}

export interface CTASection {
  _type: "ctaSection";
  _key: string;
  heading?: string;
  description?: string;
  primaryButtonText?: string;
  primaryButtonLink?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
}

export type PageSection =
  | TextSection
  | ContactFormSection
  | TeamSection
  | StatsSection
  | CTASection;

export interface PageSEO {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
}

export interface Page {
  _id: string;
  title: string;
  slug: { current: string };
  pageType: "contact" | "about" | "terms" | "privacy" | "general";
  hero?: PageHero;
  sections?: PageSection[];
  seo?: PageSEO;
}

export interface PageListItem {
  _id: string;
  title: string;
  slug: { current: string };
  pageType: string;
}

// Fetch functions
export async function getPages(): Promise<PageListItem[]> {
  return client.fetch(pagesQuery, {}, { next: { revalidate: 60 } });
}

export async function getPage(slug: string): Promise<Page | null> {
  return client.fetch(pageQuery, { slug }, { next: { revalidate: 60 } });
}
