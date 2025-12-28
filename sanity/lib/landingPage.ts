import { client } from "../client";
import { landingPagesQuery, landingPageQuery } from "../queries";

// Types
export interface LandingPageHero {
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaLink?: string;
  imageUrl?: string;
  imageAlt?: string;
}

export interface LandingPageFeature {
  icon: string;
  title: string;
  description?: string;
}

export interface LandingPageTestimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  rating: number;
  avatarUrl?: string;
}

export interface LandingPageLogo {
  companyName: string;
  logoUrl: string;
}

export interface LandingPageSocialProof {
  enabled: boolean;
  headline?: string;
  testimonials?: LandingPageTestimonial[];
  companyLogos?: LandingPageLogo[];
}

export interface LandingPageFAQ {
  enabled: boolean;
  headline?: string;
  questions?: {
    question: string;
    answer: string;
  }[];
}

export interface LandingPageFormField {
  fieldName: string;
  fieldType: "text" | "email" | "tel" | "textarea";
  required: boolean;
  placeholder?: string;
}

export interface LandingPageLeadForm {
  enabled: boolean;
  headline?: string;
  description?: string;
  submitButtonText?: string;
  successMessage?: string;
  fields?: LandingPageFormField[];
}

export interface LandingPageSEO {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  ogImageUrl?: string;
}

export interface LandingPage {
  _id: string;
  title: string;
  slug: { current: string };
  hero: LandingPageHero;
  features?: LandingPageFeature[];
  socialProof?: LandingPageSocialProof;
  faq?: LandingPageFAQ;
  leadForm?: LandingPageLeadForm;
  seo?: LandingPageSEO;
}

export interface LandingPageListItem {
  _id: string;
  title: string;
  slug: { current: string };
}

// Fetch functions
export async function getLandingPages(): Promise<LandingPageListItem[]> {
  return client.fetch(landingPagesQuery, {}, { next: { revalidate: 60 } });
}

export async function getLandingPage(
  slug: string
): Promise<LandingPage | null> {
  return client.fetch(landingPageQuery, { slug }, { next: { revalidate: 60 } });
}
