import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'pricingPage',
  title: 'Pricing Page',
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
      name: 'monthlyLabel',
      title: 'Monthly Label',
      type: 'string',
      initialValue: 'Monthly',
    }),
    defineField({
      name: 'yearlyLabel',
      title: 'Yearly Label',
      type: 'string',
      initialValue: 'Yearly',
    }),
    defineField({
      name: 'pricingTiers',
      title: 'Pricing Tiers',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'name',
              title: 'Plan Name',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'description',
              title: 'Description',
              type: 'text',
              rows: 2,
            },
            {
              name: 'monthlyPrice',
              title: 'Monthly Price',
              type: 'number',
              validation: (Rule) => Rule.required().min(0),
            },
            {
              name: 'yearlyPrice',
              title: 'Yearly Price',
              type: 'number',
              validation: (Rule) => Rule.required().min(0),
            },
            {
              name: 'currency',
              title: 'Currency',
              type: 'string',
              initialValue: '€',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'priceInterval',
              title: 'Price Interval Text',
              type: 'string',
              description: 'e.g., "per month", "per maand"',
              initialValue: 'per month',
            },
            {
              name: 'highlighted',
              title: 'Highlighted Plan',
              type: 'boolean',
              description: 'Mark as featured/recommended plan',
              initialValue: false,
            },
            {
              name: 'features',
              title: 'Features',
              type: 'array',
              of: [{ type: 'string' }],
              validation: (Rule) => Rule.required().min(1),
            },
            {
              name: 'ctaText',
              title: 'CTA Button Text',
              type: 'string',
              initialValue: 'Get Started',
            },
            {
              name: 'ctaLink',
              title: 'CTA Button Link',
              type: 'url',
            },
            {
              name: 'stripePriceIdMonthly',
              title: 'Stripe Price ID (Monthly)',
              type: 'string',
              description: 'Stripe price ID for monthly billing (e.g., price_xxxxx)',
            },
            {
              name: 'stripePriceIdYearly',
              title: 'Stripe Price ID (Yearly)',
              type: 'string',
              description: 'Stripe price ID for yearly billing (e.g., price_xxxxx)',
            },
          ],
          preview: {
            select: {
              title: 'name',
              subtitle: 'description',
              highlighted: 'highlighted',
            },
            prepare({ title, subtitle, highlighted }) {
              return {
                title: highlighted ? `⭐ ${title}` : title,
                subtitle,
              };
            },
          },
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'featuresComparisonTitle',
      title: 'Features Comparison Title',
      type: 'string',
    }),
    defineField({
      name: 'featuresComparison',
      title: 'Features Comparison',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'category',
              title: 'Category Name',
              type: 'string',
            },
            {
              name: 'features',
              title: 'Features',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    {
                      name: 'name',
                      title: 'Feature Name',
                      type: 'string',
                    },
                    {
                      name: 'availability',
                      title: 'Availability per Plan',
                      type: 'array',
                      description: 'One entry per pricing tier, in the same order',
                      of: [
                        {
                          type: 'object',
                          fields: [
                            {
                              name: 'included',
                              title: 'Included',
                              type: 'boolean',
                            },
                            {
                              name: 'value',
                              title: 'Value',
                              type: 'string',
                              description: 'Optional: specify a value like "10 GB" or "Unlimited"',
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
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
        subtitle: 'Pricing Page',
      };
    },
  },
});
