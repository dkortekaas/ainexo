import { defineField, defineType } from 'sanity';

export const emailTemplate = defineType({
  name: 'emailTemplate',
  title: 'Email Template',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Template Name',
      type: 'string',
      description: 'Internal name for this template',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'Used to identify this template in code (e.g., "welcome-email", "password-reset")',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
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
      name: 'subject',
      title: 'Email Subject',
      type: 'string',
      description: 'Use {{variableName}} for dynamic content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'preheader',
      title: 'Preheader Text',
      type: 'string',
      description: 'Short preview text that appears after the subject line',
    }),
    defineField({
      name: 'heading',
      title: 'Email Heading',
      type: 'string',
      description: 'Main heading in the email',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Email Body',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H2', value: 'h2' },
            { title: 'H3', value: 'h3' },
          ],
          marks: {
            decorators: [
              { title: 'Strong', value: 'strong' },
              { title: 'Emphasis', value: 'em' },
              { title: 'Code', value: 'code' },
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  {
                    name: 'href',
                    type: 'string',
                    title: 'URL',
                  },
                ],
              },
            ],
          },
        },
      ],
      description: 'Use {{variableName}} for dynamic content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'buttonText',
      title: 'Button Text',
      type: 'string',
      description: 'Optional call-to-action button text',
    }),
    defineField({
      name: 'buttonUrl',
      title: 'Button URL',
      type: 'string',
      description: 'Use {{variableName}} for dynamic URLs',
    }),
    defineField({
      name: 'footerText',
      title: 'Footer Text',
      type: 'text',
      description: 'Small print at the bottom of the email',
    }),
    defineField({
      name: 'variables',
      title: 'Available Variables',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'name',
              type: 'string',
              title: 'Variable Name',
              description: 'e.g., "userName", "resetLink"',
            },
            {
              name: 'description',
              type: 'string',
              title: 'Description',
              description: 'What this variable represents',
            },
          ],
        },
      ],
      description: 'Document the variables available for this template',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'subject',
      language: 'language',
    },
    prepare({ title, subtitle, language }) {
      return {
        title: `${title} (${language})`,
        subtitle: subtitle,
      };
    },
  },
});
