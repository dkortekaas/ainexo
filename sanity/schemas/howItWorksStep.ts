import { defineType, defineField } from "sanity";
import { languageField } from "../lib/i18n";

export const howItWorksStep = defineType({
  name: "howItWorksStep",
  title: "How It Works Step",
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
      name: "description",
      title: "Description",
      type: "text",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "icon",
      title: "Icon",
      type: "string",
      description: "Lucide icon name (e.g., Upload, Wand2, Globe)",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "step",
      title: "Step Number",
      type: "string",
      description: "e.g., 01, 02, 03",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      validation: (Rule) => Rule.required(),
    }),
  ],
  orderings: [
    {
      title: "Order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
});
