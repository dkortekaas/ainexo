import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'featuresPage',
  title: 'Features Page',
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
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
      initialValue: 'en',
    }),
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'heroTitle',
      title: 'Hero Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'heroSubtitle',
      title: 'Hero Subtitle',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'features',
      title: 'Features',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'icon',
              title: 'Icon',
              type: 'string',
              description: 'Choose an icon type',
              options: {
                list: [
                  { title: '⚡ Lightning', value: 'lightning' },
                  { title: '🚀 Rocket', value: 'rocket' },
                  { title: '🎯 Target', value: 'target' },
                  { title: '💡 Lightbulb', value: 'lightbulb' },
                  { title: '🔒 Lock/Security', value: 'lock' },
                  { title: '📊 Chart/Analytics', value: 'chart' },
                  { title: '🔧 Tools/Settings', value: 'tools' },
                  { title: '👥 Users/Team', value: 'users' },
                  { title: '🌐 Globe/Global', value: 'globe' },
                  { title: '💾 Database/Storage', value: 'database' },
                  { title: '🔄 Refresh/Sync', value: 'refresh' },
                  { title: '✓ Check/Success', value: 'check' },
                  { title: '⭐ Star/Featured', value: 'star' },
                  { title: '📱 Mobile/Device', value: 'mobile' },
                  { title: '🎨 Design/Paint', value: 'design' },
                  { title: '🔔 Bell/Notification', value: 'bell' },
                ],
                layout: 'dropdown',
              },
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'subtitle',
              title: 'Subtitle',
              type: 'string',
            },
            {
              name: 'content',
              title: 'Content',
              type: 'array',
              of: [
                {
                  type: 'block',
                  styles: [
                    { title: 'Normal', value: 'normal' },
                    { title: 'H3', value: 'h3' },
                    { title: 'H4', value: 'h4' },
                  ],
                  lists: [
                    { title: 'Bullet', value: 'bullet' },
                    { title: 'Numbered', value: 'number' },
                  ],
                  marks: {
                    decorators: [
                      { title: 'Strong', value: 'strong' },
                      { title: 'Emphasis', value: 'em' },
                      { title: 'Code', value: 'code' },
                    ],
                    annotations: [
                      {
                        title: 'URL',
                        name: 'link',
                        type: 'object',
                        fields: [
                          {
                            title: 'URL',
                            name: 'href',
                            type: 'url',
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
              validation: (Rule) => Rule.required(),
            },
          ],
          preview: {
            select: {
              title: 'title',
              subtitle: 'subtitle',
              icon: 'icon',
            },
            prepare({ title, subtitle, icon }) {
              const iconEmoji = {
                lightning: '⚡',
                rocket: '🚀',
                target: '🎯',
                lightbulb: '💡',
                lock: '🔒',
                chart: '📊',
                tools: '🔧',
                users: '👥',
                globe: '🌐',
                database: '💾',
                refresh: '🔄',
                check: '✓',
                star: '⭐',
                mobile: '📱',
                design: '🎨',
                bell: '🔔',
              };
              return {
                title: `${iconEmoji[icon as keyof typeof iconEmoji] || ''} ${title}`,
                subtitle,
              };
            },
          },
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      language: 'language',
    },
    prepare({ title, language }) {
      return {
        title: `${title} (${language.toUpperCase()})`,
        subtitle: 'Features Page',
      };
    },
  },
});
