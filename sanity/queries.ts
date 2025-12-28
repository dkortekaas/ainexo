import { groq } from "next-sanity";

// Features queries
export const featuresQuery = groq`*[_type == "feature" && language == $locale] | order(order asc) {
  _id,
  title,
  description,
  icon,
  benefits,
  order
}`;

// Chat widget query
export const chatWidgetQuery = groq`*[_type == "chatWidget"][0] {
  _id,
  agentName,
  agentRole,
  agentAvatar,
  messages[] {
    type,
    text
  },
  placeholderText,
  actionButtons {
    cancelText,
    upgradeText
  }
}`;

// Social media query
export const socialMediaQuery = groq`*[_type == "socialMedia"] | order(order asc) {
  _id,
  platform,
  url,
  order
}`;

// Menu items queries
export const mainMenuQuery = groq`*[_type == "mainMenu" && language == $locale] | order(order asc) {
  _id,
  name,
  href,
  openInNewTab
}`;

export const footerProductMenuQuery = groq`*[_type == "menuItem" && menuType == "footer-product" && language == $locale] | order(order asc) {
  _id,
  name,
  href,
  openInNewTab
}`;

export const footerCompanyMenuQuery = groq`*[_type == "menuItem" && menuType == "footer-company" && language == $locale] | order(order asc) {
  _id,
  name,
  href,
  openInNewTab
}`;

export const footerResourcesMenuQuery = groq`*[_type == "menuItem" && menuType == "footer-resources" && language == $locale] | order(order asc) {
  _id,
  name,
  href,
  openInNewTab
}`;

export const footerLegalMenuQuery = groq`*[_type == "menuItem" && menuType == "footer-legal" && language == $locale] | order(order asc) {
  _id,
  name,
  href,
  openInNewTab
}`;

// Site settings query
export const siteSettingsQuery = groq`*[_type == "siteSettings" && language == $locale][0] {
  _id,
  title,
  description,
  footerTagline,
  copyrightText
}`;

// Hero section query
export const heroSectionQuery = groq`*[_type == "heroSection" && language == $locale][0] {
  _id,
  badge,
  headline,
  highlightedText,
}`;

export const homepageHeroSectionQuery = groq`*[_type == "homepageHeroSection" && language == $locale][0] {
  _id,
  badge,
  headline,
  highlightedText,
  benefits,
  primaryCTA,
  secondaryCTA,
  trustIndicator
}`;

// How it works query
export const howItWorksQuery = groq`*[_type == "howItWorksStep" && language == $locale] | order(order asc) {
  _id,
  title,
  description,
  icon,
  step,
  order
}`;

// Testimonials query
export const testimonialsQuery = groq`*[_type == "testimonial" && language == $locale] | order(order asc) {
  _id,
  quote,
  author,
  role,
  company,
  rating,
  "avatarUrl": avatar.asset->url,
  order
}`;

// Pricing plans query
export const pricingPlansQuery = groq`*[_type == "pricingPlan" && language == $locale] | order(order asc) {
  _id,
  name,
  description,
  price,
  currency,
  period,
  features,
  popular,
  ctaText,
  ctaLink,
  order
}`;

// CTA section query
export const ctaSectionQuery = groq`*[_type == "ctaSection" && language == $locale][0] {
  _id,
  headline,
  description,
  primaryCTA,
  secondaryCTA
}`;

// Blog queries
export const blogPostsQuery = groq`*[_type == "blogPost" && language == $locale] | order(publishedAt desc) {
  _id,
  title,
  slug,
  excerpt,
  "mainImageUrl": mainImage.asset->url,
  "categories": categories[]->{ title, slug, color },
  "author": author->{ name, slug, "imageUrl": image.asset->url, role },
  publishedAt,
  featured,
  readTime
}`;

export const blogPostQuery = groq`*[_type == "blogPost" && slug.current == $slug && language == $locale][0] {
  _id,
  title,
  slug,
  excerpt,
  "mainImageUrl": mainImage.asset->url,
  "categories": categories[]->{ title, slug, color },
  "author": author->{ name, slug, "imageUrl": image.asset->url, bio, role, socialLinks },
  publishedAt,
  body,
  seo,
  featured,
  readTime
}`;

export const blogCategoriesQuery = groq`*[_type == "blogCategory" && language == $locale] {
  _id,
  title,
  slug,
  description,
  color
}`;

export const blogPostsByCategoryQuery = groq`*[_type == "blogPost" && language == $locale && references(*[_type=="blogCategory" && slug.current == $slug && language == $locale]._id)] | order(publishedAt desc) {
  _id,
  title,
  slug,
  excerpt,
  "mainImageUrl": mainImage.asset->url,
  "categories": categories[]->{ title, slug, color },
  "author": author->{ name, slug, "imageUrl": image.asset->url, role },
  publishedAt,
  featured,
  readTime
}`;

// Landing page queries
export const landingPagesQuery = groq`*[_type == "landingPage" && published == true && language == $locale] {
  _id,
  title,
  slug
}`;

export const landingPageQuery = groq`*[_type == "landingPage" && slug.current == $slug && published == true && language == $locale][0] {
  _id,
  title,
  slug,
  hero {
    headline,
    subheadline,
    ctaText,
    ctaLink,
    "imageUrl": image.asset->url,
    imageAlt
  },
  features[] {
    icon,
    title,
    description
  },
  socialProof {
    enabled,
    headline,
    "testimonials": testimonials[]->{
      quote,
      author,
      role,
      company,
      rating,
      "avatarUrl": avatar.asset->url
    },
    companyLogos[] {
      companyName,
      "logoUrl": logo.asset->url
    }
  },
  faq {
    enabled,
    headline,
    questions[] {
      question,
      answer
    }
  },
  leadForm {
    enabled,
    headline,
    description,
    submitButtonText,
    successMessage,
    fields[] {
      fieldName,
      fieldType,
      required,
      placeholder
    }
  },
  seo {
    metaTitle,
    metaDescription,
    keywords,
    "ogImageUrl": ogImage.asset->url
  }
}`;

// Page queries
export const pagesQuery = groq`*[_type == "page" && published == true && language == $locale] {
  _id,
  title,
  slug,
  pageType
}`;

export const pageQuery = groq`*[_type == "page" && slug.current == $slug && published == true && language == $locale][0] {
  _id,
  title,
  slug,
  pageType,
  hero {
    headline,
    subheadline,
    showBreadcrumbs
  },
  sections[] {
    _type,
    _key,
    heading,
    description,
    content,
    submitButtonText,
    successMessage,
    contactInfo,
    teamMembers[] {
      name,
      role,
      bio,
      "imageUrl": image.asset->url,
      socialLinks
    },
    stats[] {
      value,
      label,
      icon
    },
    primaryButtonText,
    primaryButtonLink,
    secondaryButtonText,
    secondaryButtonLink
  },
  seo {
    metaTitle,
    metaDescription,
    keywords
  }
}`;

// Privacy Policy query
export const privacyPolicyQuery = groq`*[_type == "privacyPolicy" && language == $locale][0] {
  _id,
  title,
  badge,
  lastUpdatedDate,
  sections[] {
    _key,
    title,
    content
  },
  contact {
    title,
    description,
    email
  },
  seo {
    metaTitle,
    metaDescription,
    keywords
  }
}`;

// Terms and Conditions query
export const termsOfServiceQuery = groq`*[_type == "termsOfService" && language == $locale][0] {
  _id,
  title,
  badge,
  lastUpdatedDate,
  sections[] {
    _key,
    title,
    content
  },
}`;
