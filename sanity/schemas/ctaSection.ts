import { defineType, defineField } from "sanity";
import { languageField } from "../lib/i18n";

export const ctaSection = defineType({
  name: "ctaSection",
  title: "CTA Section",
  type: "document",
  fields: [
    defineField(languageField),
    defineField({
      name: "headline",
      title: "Headline",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "primaryCTA",
      title: "Primary CTA",
      type: "object",
      fields: [
        { name: "text", title: "Button Text", type: "string" },
        { name: "link", title: "Link", type: "string" },
      ],
    }),
    defineField({
      name: "secondaryCTA",
      title: "Secondary CTA",
      type: "object",
      fields: [
        { name: "text", title: "Button Text", type: "string" },
        { name: "link", title: "Link", type: "string" },
      ],
    }),
  ],
});
