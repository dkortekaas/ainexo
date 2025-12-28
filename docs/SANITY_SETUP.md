# Sanity CMS Setup Guide

Deze applicatie gebruikt Sanity CMS om content te beheren voor de website, inclusief features, menu's, social media links en chat widget configuratie.

## Snelle Start

### 1. Maak een Sanity Account

1. Ga naar [sanity.io](https://www.sanity.io)
2. Maak een gratis account aan
3. Maak een nieuw project aan via [sanity.io/manage](https://www.sanity.io/manage)

### 2. Configureer Environment Variables

Voeg de volgende variabelen toe aan je `.env.local` bestand:

```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2025-12-25
```

Je kunt je Project ID vinden in de Sanity dashboard onder project settings.

### 3. Start Sanity Studio

De Sanity Studio is al geïntegreerd in de applicatie op `/studio`. Na het starten van de development server:

```bash
npm run dev
```

Ga naar `http://localhost:3000/studio` om Sanity Studio te openen.

### 4. Eerste Login en Configuratie

1. Log in met je Sanity account
2. Autoriseer de studio om toegang te krijgen tot je project
3. Je kunt nu content beginnen toevoegen

## Content Types

De volgende content types zijn beschikbaar in de Studio:

### Homepage Content

#### Hero Section

Beheer de hero section bovenaan de homepage.

**Velden:**
- **Badge Text**: Tekst in badge boven de headline
- **Headline**: Hoofd headline
- **Highlighted Text**: Gemarkeerde tekst in gradient kleur
- **Benefits**: Lijst van voordelen/features
- **Primary CTA**: Primaire call-to-action button
- **Secondary CTA**: Secundaire call-to-action button
- **Trust Indicator**: Vertrouwenstext (bijv. "No credit card required")

**Voorbeeld:**
```
Headline: Build AI Agents that deliver the
Highlighted Text: most accurate answers
Benefits:
  - 5 minutes to set-up and deploy instantly
  - Tailor to your brand voice
  - Train on large knowledge bases
```

#### How It Works Steps

Beheer de "How It Works" sectie met stappen.

**Velden:**
- **Title**: Titel van de stap
- **Description**: Beschrijving
- **Icon**: Lucide icon naam (Upload, Wand2, Globe)
- **Step Number**: Stap nummer (01, 02, 03)
- **Order**: Volgorde

#### Testimonials

Beheer klantbeoordelingen en testimonials.

**Velden:**
- **Quote**: Testimonial tekst
- **Author Name**: Naam van de auteur
- **Role**: Functie
- **Company**: Bedrijfsnaam
- **Rating**: Aantal sterren (1-5)
- **Avatar Image**: Optionele profielfoto
- **Order**: Volgorde

#### Pricing Plans

Beheer prijsplannen.

**Velden:**
- **Plan Name**: Naam van het plan (Starter, Professional, Enterprise)
- **Description**: Beschrijving
- **Price**: Prijs (bijv. "29" of "Custom")
- **Currency Symbol**: Valuta symbool ($, €)
- **Billing Period**: Factureringsperiode (/month, /year)
- **Features**: Lijst van features
- **Most Popular**: Boolean voor "Most Popular" badge
- **CTA Button Text**: Tekst voor CTA button
- **Order**: Volgorde

#### CTA Section

Beheer de call-to-action sectie onderaan de homepage.

**Velden:**
- **Headline**: Hoofd headline
- **Description**: Beschrijvende tekst
- **Primary CTA**: Primaire call-to-action button
- **Secondary CTA**: Secundaire call-to-action button

### Features

Beheer de features die worden weergegeven op de homepage.

**Velden:**
- **Title**: De titel van de feature
- **Description**: Beschrijving van de feature
- **Icon**: Naam van het Lucide icon (bijv. `Database`, `Shield`, `Zap`, `BarChart3`, `Palette`, `Brain`)
- **Benefits**: Lijst van voordelen (array van strings)
- **Order**: Volgorde waarin de feature wordt weergegeven

**Voorbeeld:**
```
Title: Train AI Agents on your data
Description: Upload documentation and integrate with help desk systems...
Icon: Database
Benefits:
  - Train on all file formats
  - Index unlimited websites
  - Sync your data automatically
Order: 1
```

### Chat Widget

Configureer de chat widget demo op de homepage.

**Velden:**
- **Agent Name**: Naam van de AI agent (bijv. "Ainexo")
- **Agent Role**: Rol beschrijving (bijv. "AI Agent")
- **Agent Avatar**: Letter(s) voor de avatar (max 2 karakters)
- **Demo Messages**: Lijst van demo berichten
  - Type: agent of user
  - Text: Bericht tekst
- **Placeholder Text**: Placeholder voor input veld
- **Action Buttons**:
  - Cancel Text
  - Upgrade Text

### Social Media

Beheer social media links in de footer.

**Velden:**
- **Platform**: Kies uit Twitter, LinkedIn, GitHub, Facebook, Instagram, YouTube
- **URL**: Link naar je social media profiel
- **Order**: Volgorde waarin de link wordt weergegeven

### Menu Items

Beheer menu items voor hoofdnavigatie en footer menu's.

**Velden:**
- **Name**: Naam van het menu item
- **Link**: URL of anchor link (bijv. `/#features`, `/pricing`)
- **Menu Type**: Kies uit:
  - Main Navigation
  - Footer - Product
  - Footer - Company
  - Footer - Resources
  - Footer - Legal
- **Order**: Volgorde waarin het item wordt weergegeven
- **Open in New Tab**: Boolean voor externe links

### Site Settings

Algemene website instellingen.

**Velden:**
- **Site Title**: Titel van de website
- **Site Description**: Beschrijving voor footer en meta tags
- **Footer Tagline**: Tagline onderaan de footer
- **Copyright Text**: Optionele copyright tekst (laat leeg voor auto-generatie)

## Blog Content

De volgende content types zijn beschikbaar voor het blog:

### Blog Posts

Beheer blog artikelen met rich text content.

**Velden:**
- **Title**: Titel van het blog artikel
- **Slug**: URL-vriendelijke versie van de titel (wordt automatisch gegenereerd)
- **Excerpt**: Korte samenvatting voor blog overzicht en SEO (max 200 karakters)
- **Main Image**: Hoofdafbeelding met alt text
- **Categories**: Een of meerdere categorieën
- **Author**: Referentie naar blog auteur
- **Published At**: Publicatiedatum en tijd
- **Body**: Rich text content met ondersteuning voor:
  - Koppen (H2, H3, H4)
  - Lijsten (bullets en nummering)
  - Vetgedrukt, cursief en code formatting
  - Links
  - Afbeeldingen met alt text
  - Code blocks met syntax highlighting (JavaScript, TypeScript, HTML, CSS, Python, Bash)
  - Blockquotes
- **SEO**: Optionele SEO instellingen
  - Meta Title (override voor title)
  - Meta Description (override voor excerpt)
  - Keywords (array van strings)
- **Featured Post**: Markeer als uitgelicht artikel
- **Read Time**: Geschatte leestijd in minuten

**Voorbeeld:**
```
Title: Getting Started with AI Agents
Slug: getting-started-with-ai-agents
Excerpt: Learn how to build and deploy your first AI agent in just 5 minutes...
Categories: [Getting Started, Tutorials]
Author: John Doe
Published At: 2025-12-25T10:00:00
Featured: true
Read Time: 5
```

### Blog Categories

Beheer blog categorieën voor organisatie en filtering.

**Velden:**
- **Title**: Naam van de categorie
- **Slug**: URL-vriendelijke versie (wordt automatisch gegenereerd)
- **Description**: Optionele beschrijving van de categorie
- **Color**: Optionele kleurcode voor visuele identificatie (bijv. `#3B82F6`)

**Voorbeeld:**
```
Title: Getting Started
Slug: getting-started
Description: Beginner-friendly guides and tutorials
Color: #3B82F6
```

### Blog Authors

Beheer auteur profielen voor blog artikelen.

**Velden:**
- **Name**: Volledige naam van de auteur
- **Slug**: URL-vriendelijke versie (wordt automatisch gegenereerd)
- **Image**: Optionele profielfoto
- **Bio**: Korte biografie
- **Role**: Functie of titel (bijv. "Content Writer", "Tech Lead")
- **Social Links**: Optionele social media links
  - Twitter URL
  - LinkedIn URL
  - GitHub URL

**Voorbeeld:**
```
Name: John Doe
Slug: john-doe
Bio: AI enthusiast and technical writer with 5+ years of experience...
Role: Senior Content Writer
Social Links:
  Twitter: https://twitter.com/johndoe
  LinkedIn: https://linkedin.com/in/johndoe
```

## Tips voor Content Beheer

### Homepage Content
1. **Features**: Begin met 6 features voor een balanced grid layout
2. **Menu Order**: Gebruik getallen zoals 10, 20, 30 zodat je later items tussenin kunt plaatsen
3. **Icons**: Zie [Lucide Icons](https://lucide.dev/) voor beschikbare icon namen
4. **Chat Widget**: Minimaal 2-3 berichten voor een realistische demo
5. **Social Media**: Gebruik echte URLs of "#" voor placeholder links
6. **Hero Section**: Gebruik maximaal 3-4 benefits voor beste leesbaarheid
7. **Testimonials**: Minimaal 3 testimonials voor een overtuigende social proof

### Blog Content
1. **Blog Posts**: Gebruik de slug generator door de titel in te vullen en op "Generate" te klikken
2. **Categories**: Begin met 3-5 hoofdcategorieën en breid later uit indien nodig
3. **Rich Text**: Gebruik H2 voor hoofdsecties en H3 voor subsecties in blog posts
4. **Images**: Voeg alt text toe aan alle afbeeldingen voor SEO en toegankelijkheid
5. **Excerpts**: Houd excerpts tussen 120-160 karakters voor optimale SEO
6. **Featured Posts**: Markeer maximaal 3-4 posts als featured voor de homepage
7. **Read Time**: Bereken ongeveer 200 woorden per minuut leestijd
8. **Code Blocks**: Gebruik syntax highlighting voor betere leesbaarheid van code voorbeelden

## Fallback Content

De applicatie heeft fallback content voor alle content types. Als Sanity data niet beschikbaar is:
- Worden de hardcoded defaults gebruikt
- De website blijft functioneel
- Er worden geen errors getoond aan gebruikers

## Deployment

### Vercel

Als je deploy naar Vercel, voeg de environment variables toe in je project settings:
1. Ga naar je Vercel project
2. Settings → Environment Variables
3. Voeg alle `NEXT_PUBLIC_SANITY_*` variabelen toe

### CORS Configuratie

Voeg je production domain toe aan de Sanity CORS settings:
1. Ga naar [sanity.io/manage](https://www.sanity.io/manage)
2. Selecteer je project
3. API → CORS Origins
4. Voeg je domain toe (bijv. `https://yourdomain.com`)

## Veelgestelde Vragen

**Q: Kan ik meerdere datasets hebben?**
A: Ja, je kunt datasets maken voor development, staging en production in de Sanity dashboard.

**Q: Hoe verwijder ik content?**
A: In de Studio, open het document en klik op de drie puntjes → Delete.

**Q: Worden wijzigingen direct zichtbaar?**
A: Ja, de Next.js app heeft een 60-seconde revalidatie. Na max 1 minuut zie je de wijzigingen.

**Q: Kan ik preview van wijzigingen zien?**
A: Dit kan worden toegevoegd met [Sanity Preview](https://www.sanity.io/docs/preview-content).

## Hulp Nodig?

- [Sanity Documentation](https://www.sanity.io/docs)
- [Sanity Community](https://www.sanity.io/community)
- [Next-Sanity Package](https://github.com/sanity-io/next-sanity)
