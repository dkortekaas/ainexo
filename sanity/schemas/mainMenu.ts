import { defineType, defineField } from "sanity";
import { languageField } from "../lib/i18n";

export const mainMenu = defineType({
  name: "mainMenu",
  title: "Main Menu",
  type: "document",
  fields: [
    defineField(languageField),
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "href",
      title: "Link",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "openInNewTab",
      title: "Open in New Tab",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      description:
        "Order in which this menu item appears (lower numbers appear first)",
      initialValue: 0,
    }),
  ],
  preview: {
    select: {
      name: "name",
      language: "language",
      order: "order",
    },
    prepare({ name, language, order }) {
      return {
        title: name || "Menu Item",
        subtitle: `${language || "nl"} • Order: ${order ?? 0}`,
      };
    },
  },
});
