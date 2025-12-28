import { defineField, defineType } from 'sanity';

export const socialProof = defineType({
  name: 'socialProof',
  title: 'Social Proof Stats',
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
      name: 'title',
      title: 'Section Title',
      type: 'string',
      description: 'Optional title above the stats',
    }),
    defineField({
      name: 'stats',
      title: 'Statistics',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'icon',
              title: 'Icon',
              type: 'string',
              options: {
                list: [
                  { title: '👥 Users', value: 'users' },
                  { title: '⭐ Rating', value: 'star' },
                  { title: '🏆 Awards', value: 'award' },
                  { title: '💼 Projects', value: 'briefcase' },
                  { title: '🌍 Countries', value: 'globe' },
                  { title: '📈 Growth', value: 'trending' },
                  { title: '✓ Satisfaction', value: 'check' },
                  { title: '🎯 Success', value: 'target' },
                ],
              },
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'value',
              title: 'Value',
              type: 'string',
              description: 'e.g., "10,000+" or "4.9/5.0"',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'label',
              title: 'Label',
              type: 'string',
              description: 'e.g., "Happy Customers" or "Average Rating"',
              validation: (Rule) => Rule.required(),
            },
          ],
          preview: {
            select: {
              value: 'value',
              label: 'label',
            },
            prepare({ value, label }) {
              return {
                title: value,
                subtitle: label,
              };
            },
          },
        },
      ],
      validation: (Rule) => Rule.required().min(2).max(6),
    }),
    defineField({
      name: 'showOnHomepage',
      title: 'Show on Homepage',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      language: 'language',
      stats: 'stats',
    },
    prepare({ title, language, stats }) {
      return {
        title: title || 'Social Proof Stats',
        subtitle: `${stats?.length || 0} stats (${language})`,
      };
    },
  },
});
