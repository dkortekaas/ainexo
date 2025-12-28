import { defineType, defineField } from "sanity";

export const chatWidget = defineType({
  name: "chatWidget",
  title: "Chat Widget",
  type: "document",
  fields: [
    defineField({
      name: "agentName",
      title: "Agent Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "agentRole",
      title: "Agent Role",
      type: "string",
      description: "e.g., AI Agent",
    }),
    defineField({
      name: "agentAvatar",
      title: "Agent Avatar",
      type: "string",
      description: "Letter(s) to display in avatar circle",
      validation: (Rule) => Rule.required().max(2),
    }),
    defineField({
      name: "messages",
      title: "Demo Messages",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "type",
              title: "Type",
              type: "string",
              options: {
                list: [
                  { title: "Agent", value: "agent" },
                  { title: "User", value: "user" },
                ],
              },
              validation: (Rule) => Rule.required(),
            },
            {
              name: "text",
              title: "Message Text",
              type: "text",
              validation: (Rule) => Rule.required(),
            },
          ],
        },
      ],
    }),
    defineField({
      name: "placeholderText",
      title: "Input Placeholder",
      type: "string",
      initialValue: "Message...",
    }),
    defineField({
      name: "actionButtons",
      title: "Action Buttons",
      type: "object",
      fields: [
        {
          name: "cancelText",
          title: "Cancel Button Text",
          type: "string",
        },
        {
          name: "upgradeText",
          title: "Upgrade Button Text",
          type: "string",
        },
      ],
    }),
  ],
});
