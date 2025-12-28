import { client } from "../client";
import {
  homepageHeroSectionQuery,
  howItWorksQuery,
  testimonialsQuery,
  pricingPlansQuery,
  ctaSectionQuery,
} from "../queries";

// Types
export interface HomepageHeroSection {
  _id: string;
  badge: string;
  headline: string;
  highlightedText: string;
  benefits: string[];
  primaryCTA: {
    text: string;
    link: string;
  };
  secondaryCTA: {
    text: string;
    link: string;
  };
  trustIndicator: string;
}

export interface HowItWorksStep {
  _id: string;
  title: string;
  description: string;
  icon: string;
  step: string;
  order: number;
}

export interface Testimonial {
  _id: string;
  quote: string;
  author: string;
  role: string;
  company: string;
  rating: number;
  avatarUrl?: string;
  order: number;
}

export interface PricingPlan {
  _id: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  period: string;
  features: string[];
  popular: boolean;
  ctaText: string;
  ctaLink: string;
  order: number;
}

export interface CTASection {
  _id: string;
  headline: string;
  description: string;
  primaryCTA: {
    text: string;
    link: string;
  };
  secondaryCTA: {
    text: string;
    link: string;
  };
}

// Fetch functions
export async function getHomepageHeroSection(
  locale: string
): Promise<HomepageHeroSection | null> {
  return client.fetch(
    homepageHeroSectionQuery,
    { locale },
    { next: { revalidate: 60 } }
  );
}

export async function getHowItWorksSteps(
  locale: string
): Promise<HowItWorksStep[]> {
  return client.fetch(
    howItWorksQuery,
    { locale },
    { next: { revalidate: 60 } }
  );
}

export async function getTestimonials(locale: string): Promise<Testimonial[]> {
  return client.fetch(
    testimonialsQuery,
    { locale },
    { next: { revalidate: 60 } }
  );
}

export async function getPricingPlans(locale: string): Promise<PricingPlan[]> {
  return client.fetch(
    pricingPlansQuery,
    { locale },
    { next: { revalidate: 60 } }
  );
}

export async function getCTASection(
  locale: string
): Promise<CTASection | null> {
  return client.fetch(
    ctaSectionQuery,
    { locale },
    { next: { revalidate: 60 } }
  );
}
