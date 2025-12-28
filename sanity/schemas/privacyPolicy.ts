import { defineType, defineField } from "sanity";
import { languageField } from "../lib/i18n";

export const privacyPolicy = defineType({
  name: "privacyPolicy",
  title: "Privacy Policy",
  type: "document",
  fields: [
    defineField(languageField),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "badge",
      title: "Badge Text",
      type: "string",
      description: "Text shown in the badge above the title",
    }),
    defineField({
      name: "lastUpdated",
      title: "Last Updated Label",
      type: "string",
      description: "Label for last updated date (e.g., 'Last updated')",
    }),
    defineField({
      name: "lastUpdatedDate",
      title: "Last Updated Date",
      type: "date",
      description: "Date when the privacy policy was last updated",
    }),
    // Sections
    defineField({
      name: "sections",
      title: "Content Sections",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "title",
              title: "Section Title",
              type: "string",
              validation: (Rule) => Rule.required(),
            },
            {
              name: "content",
              title: "Content",
              type: "array",
              of: [{ type: "block" }],
              description: "Rich text content for this section",
              validation: (Rule) => Rule.required(),
            },
          ],
          preview: {
            select: {
              title: "title",
            },
            prepare({ title }) {
              return {
                title: title || "Policy Section",
              };
            },
          },
        },
      ],
    }),
    // Contact Section
    defineField({
      name: "contact",
      title: "Contact Section",
      type: "object",
      fields: [
        {
          name: "title",
          title: "Title",
          type: "string",
        },
        {
          name: "description",
          title: "Description",
          type: "text",
        },
        {
          name: "email",
          title: "Email Address",
          type: "string",
          validation: (Rule) => Rule.email(),
        },
      ],
    }),
    // SEO
    defineField({
      name: "seo",
      title: "SEO Settings",
      type: "object",
      fields: [
        {
          name: "metaTitle",
          title: "Meta Title",
          type: "string",
          validation: (Rule) => Rule.max(60),
        },
        {
          name: "metaDescription",
          title: "Meta Description",
          type: "text",
          validation: (Rule) => Rule.max(160),
        },
        {
          name: "keywords",
          title: "Keywords",
          type: "array",
          of: [{ type: "string" }],
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
      language: "language",
    },
    prepare({ title, language }) {
      return {
        title: title || "Privacy Policy",
        subtitle: `Language: ${language || "nl"}`,
      };
    },
  },
});
