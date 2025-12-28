import { PortableTextBlock } from "@portabletext/types";
import { Language } from "@/i18n/config";

export interface SanityImage {
  asset: {
    _ref: string;
    _type: string;
  };
  alt?: string;
  caption?: string;
}

export interface BlogPost {
  _id: string;
  _createdAt: string;
  _updatedAt?: string;
  language: Language;
  title: string;
  slug: string;
  excerpt?: string;
  // Map mainImage to featuredImage for compatibility
  featuredImage?: {
    asset: {
      _ref: string;
      _type: string;
    };
    alt?: string;
  };
  // Map body to content for compatibility
  content?: PortableTextBlock[];
  author?: string;
  publishedAt?: string;
  categories?: Array<{
    _id: string;
    name: string;
  }>;
  // Tags (may not exist in schema, but code expects it)
  tags?: Array<{
    _id: string;
    name: string;
  }>;
  // SEO fields (may not exist in schema, but code expects it)
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
}
