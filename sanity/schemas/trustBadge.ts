import { defineField, defineType } from 'sanity';

export const trustBadge = defineType({
  name: 'trustBadge',
  title: 'Trust Badges',
  type: 'document',
  fields: [
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      options: {
        list: [
          { title: 'English', value: 'en' },
          { title: 'Nederlands', value: 'nl' },
          { title: 'Deutsch', value: 'de' },
          { title: 'Français', value: 'fr' },
          { title: 'Español', value: 'es' },
        ],
      },
      validation: (Rule) => Rule.required(),
      initialValue: 'en',
    }),
    defineField({
      name: 'badges',
      title: 'Badges',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'icon',
              title: 'Icon Emoji',
              type: 'string',
              description: 'Single emoji character',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'text',
              title: 'Badge Text',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
          ],
          preview: {
            select: {
              icon: 'icon',
              text: 'text',
            },
            prepare({ icon, text }) {
              return {
                title: `${icon} ${text}`,
              };
            },
          },
        },
      ],
      validation: (Rule) => Rule.required().min(1).max(8),
    }),
    defineField({
      name: 'showOnPages',
      title: 'Show on Pages',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Homepage', value: 'home' },
          { title: 'Pricing', value: 'pricing' },
          { title: 'Contact', value: 'contact' },
          { title: 'Features', value: 'features' },
        ],
      },
      description: 'Select pages where these badges should appear',
    }),
  ],
  preview: {
    select: {
      language: 'language',
      badges: 'badges',
    },
    prepare({ language, badges }) {
      return {
        title: `Trust Badges (${language})`,
        subtitle: `${badges?.length || 0} badges`,
      };
    },
  },
});
