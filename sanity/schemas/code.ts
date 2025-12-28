import { defineType, defineField } from "sanity";

export const code = defineType({
  name: "code",
  title: "Code Block",
  type: "object",
  fields: [
    defineField({
      name: "code",
      title: "Code",
      type: "text",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "language",
      title: "Language",
      type: "string",
      options: {
        list: [
          { title: "JavaScript", value: "javascript" },
          { title: "TypeScript", value: "typescript" },
          { title: "HTML", value: "html" },
          { title: "CSS", value: "css" },
          { title: "Python", value: "python" },
          { title: "Bash", value: "bash" },
          { title: "JSON", value: "json" },
          { title: "Markdown", value: "markdown" },
          { title: "SQL", value: "sql" },
          { title: "Plain Text", value: "text" },
        ],
      },
      initialValue: "javascript",
    }),
    defineField({
      name: "filename",
      title: "Filename (optional)",
      type: "string",
      description: "Optional filename to display above the code block",
    }),
  ],
  preview: {
    select: {
      code: "code",
      language: "language",
      filename: "filename",
    },
    prepare({ code, language, filename }) {
      const preview = code ? code.split("\n")[0] : "No code";
      return {
        title: filename || `Code Block (${language || "text"})`,
        subtitle:
          preview.length > 50 ? `${preview.substring(0, 50)}...` : preview,
      };
    },
  },
});
