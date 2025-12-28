import { PortableTextBlock } from "@portabletext/types";
import { Language } from "@/i18n/config";

export interface BlogPost {
  _id: string;
  language: Language;
  title: string;
  slug: {
    current: string;
  };
  excerpt?: string;
  mainImage?: {
    asset: {
      _ref: string;
    };
    alt?: string;
  };
  body?: PortableTextBlock[];
  author?: string;
  publishedAt: string;
  categories?: string[];
}

export interface Page {
  _id: string;
  language: Language;
  title: string;
  slug: {
    current: string;
  };
  description?: string;
  body?: PortableTextBlock[];
  publishedAt: string;
}

export interface PricingTier {
  name: string;
  description?: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  priceInterval: string;
  highlighted: boolean;
  features: string[];
  ctaText: string;
  ctaLink?: string;
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
}

export interface FeatureAvailability {
  included: boolean;
  value?: string;
}

export interface Feature {
  name: string;
  availability: FeatureAvailability[];
}

export interface FeatureCategory {
  category: string;
  features: Feature[];
}

export interface PricingPage {
  _id: string;
  language: Language;
  title: string;
  slug: {
    current: string;
  };
  heroTitle: string;
  heroSubtitle?: string;
  monthlyLabel: string;
  yearlyLabel: string;
  pricingTiers: PricingTier[];
  featuresComparisonTitle?: string;
  featuresComparison?: FeatureCategory[];
}

export interface ContactInfo {
  icon: "email" | "phone" | "location" | "website";
  label: string;
  value: string;
  link?: string;
}

export interface SocialLink {
  platform: "linkedin" | "twitter" | "facebook" | "instagram" | "github";
  url: string;
}

export interface ContactPage {
  _id: string;
  language: Language;
  title: string;
  slug: {
    current: string;
  };
  heroTitle: string;
  heroSubtitle?: string;
  formTitle: string;
  formDescription?: string;
  namePlaceholder: string;
  emailPlaceholder: string;
  subjectPlaceholder: string;
  messagePlaceholder: string;
  submitButtonText: string;
  successMessage: string;
  errorMessage: string;
  contactInfo?: ContactInfo[];
  showSocialLinks: boolean;
  socialLinks?: SocialLink[];
}

export type FeatureIcon =
  | "lightning"
  | "rocket"
  | "target"
  | "lightbulb"
  | "lock"
  | "chart"
  | "tools"
  | "users"
  | "globe"
  | "database"
  | "refresh"
  | "check"
  | "star"
  | "mobile"
  | "design"
  | "bell";

export interface FeatureBlock {
  icon: FeatureIcon;
  title: string;
  subtitle?: string;
  content: PortableTextBlock[];
}

export interface FeaturesPage {
  _id: string;
  language: Language;
  title: string;
  slug: {
    current: string;
  };
  heroTitle: string;
  heroSubtitle?: string;
  features: FeatureBlock[];
}
