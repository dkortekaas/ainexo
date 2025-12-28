import { feature } from "./feature";
import { chatWidget } from "./chatWidget";
import { socialMedia } from "./socialMedia";
import { mainMenu } from "./mainMenu";
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
import { privacyPolicy } from "./privacyPolicy";
import { termsOfService } from "./termsOfService";
import { code } from "./code";

export const schemaTypes = [
  // Site content
  feature,
  chatWidget,
  socialMedia,
  mainMenu,
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
  privacyPolicy,
  termsOfService,
  // Custom types
  code,
];
