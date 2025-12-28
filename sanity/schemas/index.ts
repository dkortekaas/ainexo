import { feature } from "./feature";
import { chatWidget } from "./chatWidget";
import { socialMedia } from "./socialMedia";
import { menuItem } from "./menuItem";
import { siteSettings } from "./siteSettings";
import { heroSection } from "./heroSection";
import { howItWorksStep } from "./howItWorksStep";
import { testimonial } from "./testimonial";
import { pricingPlan } from "./pricingPlan";
import { ctaSection } from "./ctaSection";
import { blogPost } from "./blogPost";
import { blogCategory } from "./blogCategory";
import { blogAuthor } from "./blogAuthor";
import { landingPage } from "./landingPage";
import { page } from "./page";
import { code } from "./code";

export const schemaTypes = [
  // Site content
  feature,
  chatWidget,
  socialMedia,
  menuItem,
  siteSettings,
  heroSection,
  howItWorksStep,
  testimonial,
  pricingPlan,
  ctaSection,
  // Blog
  blogPost,
  blogCategory,
  blogAuthor,
  // Landing Pages
  landingPage,
  // Static Pages
  page,
  // Custom types
  code,
];
