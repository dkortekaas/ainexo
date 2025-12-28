import { defineType, defineField } from "sanity";
import { languageField } from "@/sanity/lib/i18n";

export const heroSection = defineType({
  name: "heroSection",
  title: "Hero Section",
  type: "document",
  fields: [
    defineField(languageField),
    defineField({
      name: "badge",
      title: "Badge Text",
      type: "string",
      description: "Badge text shown above the headline",
    }),
    defineField({
      name: "headline",
      title: "Headline",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "highlightedText",
      title: "Highlighted Text",
      type: "string",
      description: "Text to highlight in gradient color",
    }),
    defineField({
      name: "benefits",
      title: "Benefits",
      type: "array",
      of: [{ type: "string" }],
      validation: (Rule) => Rule.required().min(1),
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
    defineField({
      name: "trustIndicator",
      title: "Trust Indicator Text",
      type: "string",
      initialValue: "No credit card required",
    }),
  ],
});
