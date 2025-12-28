import { defineType, defineField } from "sanity";
import { languageField } from "../lib/i18n";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  fields: [
    defineField(languageField),
    defineField({
      name: "title",
      title: "Site Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Site Description",
      type: "text",
      description: "Used in footer and meta tags",
    }),
    defineField({
      name: "footerTagline",
      title: "Footer Tagline",
      type: "string",
      description: "Shown at the bottom of the footer",
    }),
    defineField({
      name: "copyrightText",
      title: "Copyright Text",
      type: "string",
      description: "Leave empty to auto-generate (e.g., © 2025 Ainexo)",
    }),
  ],
});
