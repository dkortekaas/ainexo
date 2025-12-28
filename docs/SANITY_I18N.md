# Sanity CMS Meertalige Configuratie

Dit document beschrijft hoe de meertalige functionaliteit in Sanity CMS is geïmplementeerd voor dit project.

## Overzicht

Dit project gebruikt de `@sanity/document-internationalization` plugin om content per taal te beheren. Alle content types zijn meertalig, **behalve social media** die globaal blijft.

## Ondersteunde Talen

- Nederlands (nl) - standaard
- Engels (en)
- Duits (de)
- Frans (fr)
- Spaans (es)

## Meertalige Content Types

De volgende content types zijn meertalig en moeten per taal worden aangemaakt:

### Menu's en Navigatie
- `menuItem` - Menu items voor hoofdnavigatie en footer secties

### Site Instellingen
- `siteSettings` - Site beschrijving, footer tagline, etc.

### Homepage Content
- `feature` - Features sectie
- `heroSection` - Hero sectie
- `howItWorksStep` - "Hoe het werkt" stappen
- `testimonial` - Testimonials
- `pricingPlan` - Prijsplannen
- `ctaSection` - Call-to-action secties

### Pagina's
- `page` - Statische pagina's (contact, about, privacy, etc.)
- `landingPage` - Landing pages

### Blog
- `blogPost` - Blog posts
- `blogCategory` - Blog categorieën
- `blogAuthor` - Blog auteurs

## Globale Content (Niet Meertalig)

De volgende content types zijn **globaal** en gelden voor alle talen:

- `socialMedia` - Social media links (Twitter, LinkedIn, GitHub, etc.)
- `chatWidget` - Chat widget configuratie

## Hoe het Werkt

### 1. Document Internationalization Plugin

De plugin voegt automatisch een taal selector toe aan alle geconfigureerde document types. Wanneer je een nieuw document aanmaakt, kun je:

1. Een document in de standaardtaal (Nederlands) aanmaken
2. Vertalingen toevoegen via de "Create translation" knop in Sanity Studio
3. Schakelen tussen talen via de taal selector

### 2. Language Field

Elk meertalig document heeft een verborgen `language` veld dat automatisch wordt ingevuld:

```typescript
{
  name: "language",
  type: "string",
  readOnly: true,
  hidden: true,
}
```

### 3. Queries

Alle GROQ queries voor meertalige content filteren op de huidige taal:

```typescript
// Voorbeeld: Menu items ophalen voor een specifieke taal
*[_type == "menuItem" && menuType == "main" && language == $locale] | order(order asc)
```

Social media queries hebben **geen** taal filter:

```typescript
// Social media is globaal
*[_type == "socialMedia"] | order(order asc)
```

### 4. Fetch Functies

Alle fetch functies accepteren een `locale` parameter (standaard "nl"):

```typescript
// Meertalig - met locale parameter
export async function getMainMenu(locale: string = "nl"): Promise<MenuItem[]>
export async function getSiteSettings(locale: string = "nl"): Promise<SiteSettings | null>

// Globaal - zonder locale parameter
export async function getSocialMedia(): Promise<SocialMedia[]>
```

## Content Aanmaken in Sanity Studio

### Voor Meertalige Content

1. Ga naar Sanity Studio (`/studio`)
2. Selecteer een content type (bijv. Menu Item)
3. Klik op "Create" en maak het document aan in de standaardtaal (Nederlands)
4. Sla het document op
5. Klik op de "Create translation" knop bovenaan
6. Selecteer de doeltaal (en, de, fr, of es)
7. Vul de vertaalde content in
8. Herhaal voor alle benodigde talen

### Voor Globale Content (Social Media)

1. Ga naar Sanity Studio (`/studio`)
2. Selecteer "Social Media"
3. Klik op "Create"
4. Vul de details in (deze gelden voor alle talen)
5. Sla op

## Beste Praktijken

1. **Start altijd met Nederlands**: Maak eerst content in Nederlands (nl) aan voordat je vertalingen toevoegt
2. **Consistente URL's**: Zorg dat href values in menu items consistent zijn tussen talen
3. **Order nummers**: Houd dezelfde order nummers aan tussen talen voor consistente weergave
4. **Social Media**: Wijzig social media links slechts op één plek - ze gelden voor alle talen

## Componenten Updaten

Bij het gebruik van Sanity data in componenten, zorg ervoor dat je de locale doorgeeft:

```typescript
// In een Server Component
import { getLocale } from 'next-intl/server';

export default async function MyComponent() {
  const locale = await getLocale();
  const menuItems = await getMainMenu(locale);

  return (
    // ... render menu items
  );
}
```

## Troubleshooting

### Content verschijnt niet in een specifieke taal

- Controleer of de vertaling is aangemaakt in Sanity Studio
- Verificeer dat het `language` veld de juiste waarde heeft
- Check of de fetch functie de juiste locale parameter ontvangt

### Social media links werken niet

- Social media heeft geen language filter
- Controleer of de links zijn aangemaakt in Sanity Studio (zonder taal selectie)

## Meer Informatie

- [Sanity Document Internationalization Plugin](https://www.sanity.io/plugins/document-internationalization)
- [GROQ Query Language](https://www.sanity.io/docs/groq)
