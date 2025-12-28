import { defineType, defineField } from "sanity";
import { languageField } from "../lib/i18n";

export const landingPage = defineType({
  name: "landingPage",
  title: "Landing Page",
  type: "document",
  fields: [
    defineField(languageField),
    defineField({
      name: "title",
      title: "Page Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "published",
      title: "Published",
      type: "boolean",
      initialValue: false,
      description: "Set to true to make this landing page live",
    }),
    // Hero Section
    defineField({
      name: "hero",
      title: "Hero Section",
      type: "object",
      fields: [
        { name: "headline", title: "Headline", type: "string", validation: (Rule) => Rule.required() },
        { name: "subheadline", title: "Subheadline", type: "text", validation: (Rule) => Rule.required() },
        { name: "ctaText", title: "CTA Button Text", type: "string", validation: (Rule) => Rule.required() },
        { name: "ctaLink", title: "CTA Button Link", type: "string" },
        { name: "image", title: "Hero Image", type: "image", options: { hotspot: true } },
        { name: "imageAlt", title: "Image Alt Text", type: "string" },
      ],
    }),
    // Features Section
    defineField({
      name: "features",
      title: "Features/Benefits",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "icon", title: "Icon", type: "string", description: "Lucide icon name (e.g., CheckCircle, Star, Zap)" },
            { name: "title", title: "Title", type: "string", validation: (Rule) => Rule.required() },
            { name: "description", title: "Description", type: "text" },
          ],
        },
      ],
    }),
    // Social Proof
    defineField({
      name: "socialProof",
      title: "Social Proof Section",
      type: "object",
      fields: [
        { name: "enabled", title: "Enable Social Proof", type: "boolean", initialValue: true },
        { name: "headline", title: "Headline", type: "string" },
        {
          name: "testimonials",
          title: "Testimonials",
          type: "array",
          of: [{ type: "reference", to: [{ type: "testimonial" }] }],
        },
        {
          name: "companyLogos",
          title: "Company Logos",
          type: "array",
          of: [
            {
              type: "object",
              fields: [
                { name: "companyName", title: "Company Name", type: "string" },
                { name: "logo", title: "Logo", type: "image", options: { hotspot: true } },
              ],
            },
          ],
        },
      ],
    }),
    // FAQ Section
    defineField({
      name: "faq",
      title: "FAQ Section",
      type: "object",
      fields: [
        { name: "enabled", title: "Enable FAQ", type: "boolean", initialValue: true },
        { name: "headline", title: "Headline", type: "string" },
        {
          name: "questions",
          title: "Questions",
          type: "array",
          of: [
            {
              type: "object",
              fields: [
                { name: "question", title: "Question", type: "string", validation: (Rule) => Rule.required() },
                { name: "answer", title: "Answer", type: "text", validation: (Rule) => Rule.required() },
              ],
            },
          ],
        },
      ],
    }),
    // Lead Form Section
    defineField({
      name: "leadForm",
      title: "Lead Form Section",
      type: "object",
      fields: [
        { name: "enabled", title: "Enable Lead Form", type: "boolean", initialValue: true },
        { name: "headline", title: "Headline", type: "string" },
        { name: "description", title: "Description", type: "text" },
        { name: "submitButtonText", title: "Submit Button Text", type: "string", initialValue: "Get Started" },
        { name: "successMessage", title: "Success Message", type: "text" },
        {
          name: "fields",
          title: "Form Fields",
          type: "array",
          of: [
            {
              type: "object",
              fields: [
                { name: "fieldName", title: "Field Name", type: "string", validation: (Rule) => Rule.required() },
                { name: "fieldType", title: "Field Type", type: "string", options: { list: ["text", "email", "tel", "textarea"] } },
                { name: "required", title: "Required", type: "boolean", initialValue: true },
                { name: "placeholder", title: "Placeholder", type: "string" },
              ],
            },
          ],
        },
      ],
    }),
    // SEO
    defineField({
      name: "seo",
      title: "SEO Settings",
      type: "object",
      fields: [
        { name: "metaTitle", title: "Meta Title", type: "string", validation: (Rule) => Rule.max(60) },
        { name: "metaDescription", title: "Meta Description", type: "text", validation: (Rule) => Rule.max(160) },
        { name: "keywords", title: "Keywords", type: "array", of: [{ type: "string" }] },
        { name: "ogImage", title: "Social Share Image", type: "image", options: { hotspot: true } },
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
      slug: "slug.current",
      published: "published",
    },
    prepare({ title, slug, published }) {
      return {
        title: title,
        subtitle: `/${slug} ${published ? "✓ Published" : "⊗ Draft"}`,
      };
    },
  },
});
