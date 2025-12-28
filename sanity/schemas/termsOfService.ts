import { defineType, defineField } from "sanity";
import { languageField } from "../lib/i18n";

export const termsOfService = defineType({
  name: "termsOfService",
  title: "Terms of Service",
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
      name: "lastUpdatedDate",
      title: "Last Updated Date",
      type: "date",
      description: "Date when the terms of service were last updated",
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
        title: title || "Terms of Service",
        subtitle: `Language: ${language || "nl"}`,
      };
    },
  },
});
