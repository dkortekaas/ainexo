import { client } from "@/sanity/client";
import { Language } from "@/i18n/config";

export async function getAllBlogPosts(language: Language) {
  return client.fetch(
    `*[_type == "blogPost" && language == $language] | order(publishedAt desc) {
      _id,
      language,
      title,
      slug,
      excerpt,
      mainImage,
      author,
      publishedAt,
      categories
    }`,
    { language }
  );
}

export async function getBlogPostBySlug(slug: string, language: Language) {
  return client.fetch(
    `*[_type == "blogPost" && slug.current == $slug && language == $language][0] {
      _id,
      language,
      title,
      slug,
      excerpt,
      mainImage,
      body,
      author,
      publishedAt,
      categories
    }`,
    { slug, language }
  );
}

export async function getAllPages(language: Language) {
  return client.fetch(
    `*[_type == "page" && language == $language] | order(publishedAt desc) {
      _id,
      language,
      title,
      slug,
      description,
      publishedAt
    }`,
    { language }
  );
}

export async function getPageBySlug(slug: string, language: Language) {
  return client.fetch(
    `*[_type == "page" && slug.current == $slug && language == $language][0] {
      _id,
      language,
      title,
      slug,
      description,
      body,
      publishedAt
    }`,
    { slug, language }
  );
}

export async function getPricingPage(language: Language) {
  return client.fetch(
    `*[_type == "pricingPage" && language == $language][0] {
      _id,
      language,
      title,
      slug,
      heroTitle,
      heroSubtitle,
      monthlyLabel,
      yearlyLabel,
      pricingTiers,
      featuresComparisonTitle,
      featuresComparison
    }`,
    { language }
  );
}

export async function getContactPage(language: Language) {
  return client.fetch(
    `*[_type == "contactPage" && language == $language][0] {
      _id,
      language,
      title,
      slug,
      heroTitle,
      heroSubtitle,
      formTitle,
      formDescription,
      namePlaceholder,
      emailPlaceholder,
      subjectPlaceholder,
      messagePlaceholder,
      submitButtonText,
      successMessage,
      errorMessage,
      contactInfo,
      showSocialLinks,
      socialLinks
    }`,
    { language }
  );
}

export async function getFeaturesPage(language: Language) {
  return client.fetch(
    `*[_type == "featuresPage" && language == $language][0] {
      _id,
      language,
      title,
      slug,
      heroTitle,
      heroSubtitle,
      features
    }`,
    { language }
  );
}
