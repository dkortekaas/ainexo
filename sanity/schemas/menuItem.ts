import { defineType, defineField } from "sanity";
import { languageField } from "../lib/i18n";

export const menuItem = defineType({
  name: "menuItem",
  title: "Menu Item",
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
      description: "URL or anchor link (e.g., /#features, /pricing)",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "menuType",
      title: "Menu Type",
      type: "string",
      options: {
        list: [
          { title: "Main Navigation", value: "main" },
          { title: "Footer - Product", value: "footer-product" },
          { title: "Footer - Company", value: "footer-company" },
          { title: "Footer - Resources", value: "footer-resources" },
          { title: "Footer - Legal", value: "footer-legal" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      description: "Display order (lower numbers appear first)",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "openInNewTab",
      title: "Open in New Tab",
      type: "boolean",
      initialValue: false,
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
