import { defineType, defineField } from "sanity";
import { languageField } from "../lib/i18n";

export const page = defineType({
  name: "page",
  title: "Page",
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
      name: "pageType",
      title: "Page Type",
      type: "string",
      options: {
        list: [
          { title: "Contact", value: "contact" },
          { title: "About", value: "about" },
          { title: "Terms & Conditions", value: "terms" },
          { title: "Privacy Policy", value: "privacy" },
          { title: "General", value: "general" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "published",
      title: "Published",
      type: "boolean",
      initialValue: false,
      description: "Set to true to make this page live",
    }),
    // Hero Section
    defineField({
      name: "hero",
      title: "Hero Section",
      type: "object",
      fields: [
        { name: "headline", title: "Headline", type: "string" },
        { name: "subheadline", title: "Subheadline", type: "text" },
        { name: "showBreadcrumbs", title: "Show Breadcrumbs", type: "boolean", initialValue: true },
      ],
    }),
    // Page Sections
    defineField({
      name: "sections",
      title: "Page Sections",
      type: "array",
      of: [
        // Text Section
        {
          type: "object",
          name: "textSection",
          title: "Text Section",
          fields: [
            { name: "heading", title: "Heading", type: "string" },
            {
              name: "content",
              title: "Content",
              type: "array",
              of: [
                { type: "block" },
                {
                  type: "image",
                  options: { hotspot: true },
                  fields: [{ name: "alt", title: "Alt Text", type: "string" }],
                },
              ],
            },
          ],
          preview: {
            select: {
              title: "heading",
            },
            prepare({ title }) {
              return {
                title: title || "Text Section",
                subtitle: "Text Section",
              };
            },
          },
        },
        // Contact Form Section
        {
          type: "object",
          name: "contactFormSection",
          title: "Contact Form",
          fields: [
            { name: "heading", title: "Heading", type: "string" },
            { name: "description", title: "Description", type: "text" },
            { name: "submitButtonText", title: "Submit Button Text", type: "string", initialValue: "Send Message" },
            { name: "successMessage", title: "Success Message", type: "text" },
            {
              name: "contactInfo",
              title: "Contact Information",
              type: "object",
              fields: [
                { name: "email", title: "Email", type: "string" },
                { name: "phone", title: "Phone", type: "string" },
                { name: "address", title: "Address", type: "text" },
              ],
            },
          ],
          preview: {
            prepare() {
              return {
                title: "Contact Form",
                subtitle: "Contact Form Section",
              };
            },
          },
        },
        // Team Section
        {
          type: "object",
          name: "teamSection",
          title: "Team Section",
          fields: [
            { name: "heading", title: "Heading", type: "string" },
            { name: "description", title: "Description", type: "text" },
            {
              name: "teamMembers",
              title: "Team Members",
              type: "array",
              of: [
                {
                  type: "object",
                  fields: [
                    { name: "name", title: "Name", type: "string", validation: (Rule) => Rule.required() },
                    { name: "role", title: "Role", type: "string" },
                    { name: "bio", title: "Bio", type: "text" },
                    { name: "image", title: "Image", type: "image", options: { hotspot: true } },
                    {
                      name: "socialLinks",
                      title: "Social Links",
                      type: "object",
                      fields: [
                        { name: "linkedin", title: "LinkedIn", type: "url" },
                        { name: "twitter", title: "Twitter", type: "url" },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
          preview: {
            select: {
              heading: "heading",
            },
            prepare({ heading }) {
              return {
                title: heading || "Team Section",
                subtitle: "Team Section",
              };
            },
          },
        },
        // Stats Section
        {
          type: "object",
          name: "statsSection",
          title: "Stats Section",
          fields: [
            { name: "heading", title: "Heading", type: "string" },
            {
              name: "stats",
              title: "Statistics",
              type: "array",
              of: [
                {
                  type: "object",
                  fields: [
                    { name: "value", title: "Value", type: "string", validation: (Rule) => Rule.required() },
                    { name: "label", title: "Label", type: "string", validation: (Rule) => Rule.required() },
                    { name: "icon", title: "Icon", type: "string", description: "Lucide icon name" },
                  ],
                },
              ],
            },
          ],
          preview: {
            select: {
              heading: "heading",
            },
            prepare({ heading }) {
              return {
                title: heading || "Stats Section",
                subtitle: "Stats Section",
              };
            },
          },
        },
        // CTA Section
        {
          type: "object",
          name: "ctaSection",
          title: "CTA Section",
          fields: [
            { name: "heading", title: "Heading", type: "string" },
            { name: "description", title: "Description", type: "text" },
            { name: "primaryButtonText", title: "Primary Button Text", type: "string" },
            { name: "primaryButtonLink", title: "Primary Button Link", type: "string" },
            { name: "secondaryButtonText", title: "Secondary Button Text", type: "string" },
            { name: "secondaryButtonLink", title: "Secondary Button Link", type: "string" },
          ],
          preview: {
            select: {
              heading: "heading",
            },
            prepare({ heading }) {
              return {
                title: heading || "CTA Section",
                subtitle: "Call to Action",
              };
            },
          },
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
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
      slug: "slug.current",
      pageType: "pageType",
      published: "published",
    },
    prepare({ title, slug, pageType, published }) {
      return {
        title: title,
        subtitle: `/${slug} - ${pageType} ${published ? "✓ Published" : "⊗ Draft"}`,
      };
    },
  },
});
