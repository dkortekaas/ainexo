# Ainexo AI Chat Assistent - Volledige Functionaliteiten Overzicht

Dit document beschrijft alle beschikbare functionaliteiten van het Ainexo AI Chat Assistent platform voor de Ainexo website.

## Inhoudsopgave

1. [Overzicht](#overzicht)
2. [Dashboard](#dashboard)
3. [AI Assistenten Beheer](#ai-assistenten-beheer)
4. [Kennisbank](#kennisbank)
5. [Conversaties & Analytics](#conversaties--analytics)
6. [Abonnementen & Billing](#abonnementen--billing)
7. [Notificatiesysteem](#notificatiesysteem)
8. [Gebruikersbeheer](#gebruikersbeheer)
9. [Authenticatie & Beveiliging](#authenticatie--beveiliging)
10. [Widget Integratie](#widget-integratie)
11. [Instellingen](#instellingen)
12. [Email Systeem](#email-systeem)
13. [Internationalisatie](#internationalisatie)
14. [RAG Systeem](#rag-systeem)

---

## Overzicht

Ainexo is een modern, self-hosted chatbot platform waarmee organisaties AI-gestuurde chatbots kunnen creëren die vragen beantwoorden op basis van hun eigen documenten en kennisbank. Het platform maakt gebruik van geavanceerde AI-technologie (OpenAI GPT-4) en RAG (Retrieval-Augmented Generation) om nauwkeurige en contextbewuste antwoorden te geven.

### Kernfunctionaliteiten

- 🤖 **Meerdere AI Assistenten** - Creëer verschillende chatbots voor verschillende doeleinden
- 📄 **Document Verwerking** - Upload PDF, DOCX, TXT, JPG en PNG bestanden
- 🌐 **Website Scraping** - Automatisch content extraheren van websites
- 💬 **Conversatiebeheer** - Volledige tracking van gesprekken met analytics
- 📊 **Analytics & Rapportage** - Inzicht in gebruik, prestaties en ratings
- 🔔 **Notificatiesysteem** - Real-time meldingen voor belangrijke updates
- 💳 **Abonnementsbeheer** - Flexibele abonnementsplannen met Stripe
- ⚙️ **Volledige Aanpassing** - Pas uiterlijk en gedrag aan naar wens

---

## Dashboard

### Overzicht Functionaliteiten

- **Centraal Dashboard**: Overzichtspagina met belangrijke statistieken
- **Quick Actions**: Directe toegang tot veelgebruikte functies
- **Real-time Updates**: Live data van conversaties en documenten
- **Assistant Switcher**: Eenvoudig wisselen tussen meerdere AI assistenten
- **Notification Bell**: Real-time notificaties met ongelezen teller

### Dashboard Statistieken

- Totaal aantal assistenten
- Actieve conversaties
- Totaal aantal berichten
- Gemiddeld aantal berichten per sessie
- Recente activiteit
- Status van kennisbronnen

---

## AI Assistenten Beheer

### Assistent Aanmaken

- **Basis Configuratie**
  - Naam en beschrijving
  - Welkomstbericht
  - Avatar selectie
  - Primaire en secundaire kleuren
  - Lettertype selectie

- **Gedragsinstellingen**
  - **Toon**: Professioneel, Vriendelijk, of Casual
  - **Temperatuur** (0.0 - 1.0): Bepaalt creativiteit van antwoorden
  - **Responslengte**: Kort, Gemiddeld, of Lang
  - **Fallback bericht**: Antwoord wanneer de bot niet weet wat te zeggen

### Assistent Configuratie

- **Look & Feel**
  - Primaire kleur aanpassing
  - Secundaire kleur aanpassing
  - Font family selectie
  - Avatar upload
  - Widget positie (links/rechts)

- **API & Beveiliging**
  - Automatisch gegenereerde API key
  - Domain whitelisting
  - Rate limiting configuratie
  - Embed code generatie

- **Live Preview**
  - Real-time preview van chatbot uiterlijk
  - Directe feedback bij wijzigingen
  - Responsive preview

### Action Buttons

- **Quick Buttons Beheer**
  - Pre-geconfigureerde knoppen voor veelvoorkomende interacties
  - Aangepaste vragen koppelen aan knoppen
  - Prioriteit beheer voor volgorde
  - Enable/Disable functionaliteit
  - Volledige CRUD operaties
  - Database opslag voor persistentie

- **Button Configuratie**
  - Label tekst
  - Geassocieerde vraag
  - Prioriteit (volgorde)
  - Actieve status

### Meerdere Assistenten

- Onbeperkt aantal assistenten (afhankelijk van abonnement)
- Per-assistant configuratie
- Onafhankelijke kennisbanken
- Aparte analytics per assistent

---

## Kennisbank

De kennisbank is het centrale systeem voor het beheren van alle kennisbronnen die de AI assistent gebruikt om vragen te beantwoorden.

### Bestanden (Files)

#### Upload Functionaliteiten

- **Bestand Upload**
  - Ondersteunde formaten: PDF, DOCX, TXT, JPG, PNG
  - Upload via modaal dialoogvenster
  - Drag & drop ondersteuning
  - Automatische validatie van bestandstype en grootte
  - Meerdere bestanden tegelijk uploaden

- **Bestandsverwerking**
  - Automatische verwerking na upload
  - Status tracking: PROCESSING, COMPLETED, ERROR
  - Foutmeldingen bij verwerkingsproblemen
  - Automatische chunking voor RAG integratie
  - Metadata extractie

#### Beheer Functionaliteiten

- **Bestandsoverzicht**
  - Tabelweergave met alle geüploade bestanden
  - Toon bestandsnaam, grootte, status, en wijzigingsdatum
  - Sorteer op verschillende kolommen
  - Filter op status of bestandstype

- **Bestandsbewerkingen**
  - **Bekijken**: Volledige weergave van bestandsinhoud
  - **Downloaden**: Download origineel bestand
  - **Bewerken**: Wijzig beschrijving en enabled status
  - **Verwijderen**: Verwijder bestand met bevestiging

- **Statusbeheer**
  - **Enable/Disable Toggle**: Schakel bestand in of uit voor gebruik door AI
  - Real-time status updates
  - Visuele indicatoren voor verwerkingsstatus

### Websites

#### Website Toevoegen

- **Website Configuratie**
  - URL invoer met validatie
  - Optionele naam en beschrijving
  - Sync interval instellingen (never, daily, weekly, monthly)
  - Max depth configuratie (standaard: 3 niveaus)
  - Max URLs configuratie (standaard: 50 pagina's)

#### Website Scraping

- **Automatisch Scrapen**
  - Multi-page crawling met configureerbare depth
  - Intelligente content extractie
  - Automatische link discovery
  - Respecteert same-domain policy
  - Limiteert concurrent requests
  - Tot 50 pagina's per website

- **Handmatig Scrapen**
  - "Scrape Nu" functionaliteit voor on-demand scraping
  - Real-time status updates tijdens scraping
  - Foutafhandeling en retry mechanisme

- **Scraping Status**
  - **PENDING**: Wachtend op eerste scrape
  - **SYNCING**: Scraping in uitvoering
  - **COMPLETED**: Succesvol gescraped
  - **ERROR**: Fout opgetreden tijdens scraping

#### Content Beheer

- **Content View**
  - Dedicated pagina voor bekijken van gescrapede content
  - Volledige tekstweergave van alle pagina's
  - Georganiseerd per website pagina
  - Link management met externe navigatie

- **Website Pagina's**
  - Individuele pagina details
  - Titel, URL, en content per pagina
  - Status per pagina (COMPLETED, ERROR)
  - Foutmeldingen per pagina

- **Sync Logs**
  - Overzicht van alle sync pogingen
  - Start- en eindtijd per sync
  - Status per sync (RUNNING, COMPLETED, FAILED)
  - Gedetailleerde log entries per pagina
  - Per pagina status (SUCCESS, FAILED, SKIPPED, ALREADY_VISITED)
  - Content grootte per pagina

### FAQ's

#### FAQ Beheer

- **FAQ Aanmaken**
  - Vraag invoer (max 500 karakters)
  - Antwoord invoer (max 5000 karakters)
  - Order instelling (voor sortering)
  - Enable/disable status
  - Validatie van verplichte velden

- **FAQ Bewerken**
  - Wijzig vraag en/of antwoord
  - Pas order aan
  - Toggle enable/disable status
  - Real-time validatie

- **FAQ Verwijderen**
  - Verwijder met bevestigingsdialoog
  - Toon vraag in bevestigingsbericht
  - Veilige verwijdering met error handling

- **FAQ Dupliceren**
  - Kopieer bestaande FAQ
  - Automatisch "(Copy)" toevoeging aan vraag
  - Order automatisch verhoogd

#### FAQ Overzicht

- **Weergave Opties**
  - **Tabelweergave**: Gestructureerde lijst met kolommen
  - **Card Weergave**: Visuele kaarten met preview
  - Switch tussen weergaven met één klik

- **Zoeken en Filteren**
  - Real-time zoeken in vragen en antwoorden
  - Case-insensitive zoeken
  - Directe resultaten bij typen

- **Sorteren**
  - Sorteer op vraag (alfabetisch)
  - Sorteer op aanmaakdatum
  - Sorteer op wijzigingsdatum
  - Ascending/descending toggle

- **Paginatie**
  - 20 FAQ's per pagina
  - Pagina navigatie met nummers
  - Vorige/volgende knoppen
  - Resultaten teller

#### Bulk Import

- **CSV Import**
  - Upload CSV bestand met FAQ's
  - Kolommen: question, answer, enabled (optioneel), order (optioneel)
  - Ondersteuning voor quoted fields
  - Automatische header detectie

- **Validatie**
  - Real-time validatie tijdens import
  - Foutrapportage per rij
  - Karakterlimiet validatie (500 voor vraag, 5000 voor antwoord)
  - Verplichte velden check

- **Import Resultaten**
  - Totaal aantal geïmporteerde FAQ's
  - Aantal mislukte imports
  - Gedetailleerde foutmeldingen per rij
  - Success/error feedback

#### FAQ Preview

- **Preview Modal**
  - Volledige weergave van vraag en antwoord
  - Formatted content display
  - Sluit met ESC of close button

---

## Conversaties & Analytics

### Conversatie Beheer

- **Complete Session Tracking**
  - Volledige conversatie sessies met alle berichten
  - Individuele gebruiker en assistent berichten met timestamps
  - Sessie duur en bericht telling
  - Token gebruik per sessie

- **Message History**
  - Volledige bericht geschiedenis
  - Chronologische weergave
  - Expandable views voor volledige conversatie flow
  - Real-time updates

- **Source Attribution**
  - Welke documenten werden gebruikt voor elk antwoord
  - Bronvermelding in antwoorden
  - Link naar originele bronnen

### Analytics & Rapportage

- **Session Statistieken**
  - Totaal aantal conversatie sessies
  - Actieve sessies (laatste 24 uur)
  - Totaal aantal berichten
  - Gemiddeld aantal berichten per sessie

- **Performance Metrics**
  - Response time analytics
  - Token usage tracking
  - Confidence score monitoring
  - Model performance insights

- **Rating Systeem**
  - 1-5 sterren ratings met comments
  - Per sessie rating
  - Rating distributie visualisatie
  - Rating trends

- **Advanced Filtering**
  - Filter op type, tijd, duur, en rating
  - Tijdsperiode selectie
  - Sessie status filtering
  - Export functionaliteit

- **Conversation Charts**
  - Timeline van chat activiteit
  - Sessie patronen visualisatie
  - Top vragen identificatie
  - Source analytics (welke kennisbronnen zijn meest effectief)

- **User Behavior Analytics**
  - Sessie duur patronen
  - Engagement metrics
  - Conversatie flow analyse

---

## Abonnementen & Billing

### Abonnement Plannen

- **Trial Plan** (Gratis)
  - 1 chatbot (gratis)
  - 10 gesprekken per maand
  - Basis functionaliteit
  - 7 dagen trial periode

- **Starter Plan** (€19/maand)
  - 1 chatbot
  - 100 gesprekken per maand
  - Basis support
  - Standaard templates
  - 10 documenten per assistent
  - 3 websites per assistent

- **Professional Plan** (€49/maand)
  - 3 chatbots
  - 500 gesprekken per maand
  - Prioriteit support
  - Aangepaste templates
  - Analytics dashboard
  - 50 documenten per assistent
  - 10 websites per assistent

- **Business Plan** (€149/maand)
  - 10 chatbots
  - 2000 gesprekken per maand
  - Premium support
  - API toegang
  - Geavanceerde analytics
  - White-label opties
  - 200 documenten per assistent
  - 50 websites per assistent

- **Enterprise Plan** (€499/maand)
  - Onbeperkte chatbots
  - Onbeperkte gesprekken
  - Dedicated support
  - Volledige API toegang
  - Custom integraties
  - SLA garantie
  - On-premise opties
  - Onbeperkte documenten en websites

### Billing Functionaliteiten

- **Dedicated Billing Page**
  - **Current Plan Card**: Actief abonnement met plan details en status
  - **Available Plans Card**: Upgrade opties met feature vergelijking
  - **Invoices Card**: Bekijk en download facturen met status tracking
  - **Payment Method Card**: Beheer credit cards via Stripe Customer Portal
  - **Billing Details Card**: Bedrijfsinformatie voor accurate facturering
    - Bedrijfsnaam en facturatie email
    - BTW nummer voor Europese bedrijven
    - Volledig facturatie adres
    - Auto-populate van bedrijf en gebruiker data
    - Bewerkbaar met save functionaliteit

- **Stripe Integratie**
  - Secure payment processing
  - Checkout Sessions voor naadloze upgrade flow
  - Webhook integratie voor automatische subscription status updates
  - Customer Portal voor self-service billing management
  - Automatische terugkerende maandelijkse betalingen

- **Subscription Beheer**
  - Real-time trial status en dagen resterend
  - Subscription sync knop om status te verversen van Stripe
  - Payment status tracking (ACTIVE, PAST_DUE, CANCELED, etc.)
  - Grace period handling voor mislukte betalingen
  - Automatische reactivatie na succesvolle payment retry

- **Usage Limits & Enforcement**
  - Automatische enforcement van plan limieten
  - Assistant creation limits (voorkomt aanmaken meer dan plan toestaat)
  - Conversation limits (tracks en enforce maandelijkse limieten per assistent)
  - Auto-disable: Assistenten automatisch uitgeschakeld wanneer limiet bereikt
  - Document limits per assistent
  - Website limits per assistent
  - Upgrade prompts wanneer limieten bereikt
  - Gedetailleerde error messages met huidig gebruik en limiet informatie

---

## Notificatiesysteem

### Gebruikers Notificaties

- **Real-time Notificaties**
  - Bell icon in header met ongelezen teller
  - Notification dropdown voor snelle toegang
  - Full notification page voor complete notificatie beheer
  - Real-time updates

- **Notificatie Types**
  - INFO: Informatieve meldingen
  - WARNING: Waarschuwingen
  - ERROR: Foutmeldingen
  - SUCCESS: Succes meldingen
  - MAINTENANCE: Onderhoudsnotificaties

- **Notificatie Beheer**
  - Mark as read (individueel en bulk)
  - Prioriteit niveaus (LOW, MEDIUM, HIGH, URGENT)
  - Expiration dates voor automatische vervaldatum
  - Filter en sorteer opties

### Admin Notificaties (Superuser)

- **Notificatie Creatie**
  - Admin panel voor het aanmaken van notificaties
  - Target users: specifieke gebruikers of alle gebruikers
  - Prioriteit instelling
  - Expiration date instelling
  - Table view voor admin beheer

- **Notificatie Statistieken**
  - Overzicht van alle notificaties
  - Read/unread status tracking
  - Gebruiker engagement metrics

---

## Gebruikersbeheer

### Gebruikers Overzicht (Superuser Only)

- **User Management Interface**
  - Complete lijst van alle gebruikers in het systeem
  - Table interface met gebruikersdetails
  - User statistics (assistant count, activiteit)
  - Sorteer en filter opties

### Gebruikers Operaties

- **User Creation**
  - Maak nieuwe gebruikers met custom roles
  - Email, naam, wachtwoord instelling
  - Rol toewijzing (SUPERUSER, ADMIN, USER)
  - Company koppeling

- **User Editing**
  - Update gebruikersinformatie
  - Rol wijzigingen
  - Wachtwoord reset
  - Company wijziging

- **User Deletion**
  - Verwijder gebruikers uit het systeem
  - Safety checks (kan eigen account niet verwijderen)
  - Email uniqueness validatie

### Gebruikersrollen

- **SUPERUSER**
  - Volledige toegang inclusief gebruikersbeheer
  - Abonnementenbeheer
  - Systeemnotificaties
  - Alle admin functies

- **ADMIN**
  - Standaard admin toegang tot alle features
  - Team beheer
  - Assistenten beheer
  - Analytics toegang

- **USER**
  - Basis gebruiker toegang
  - Eigen assistenten aanmaken en beheren
  - Eigen kennisbank beheer
  - Eigen analytics

---

## Authenticatie & Beveiliging

### Authenticatie Systeem

- **NextAuth.js Integratie**
  - Secure user authentication
  - Session management met rol informatie
  - Role-based access control
  - API security met authentication

- **Password Security**
  - bcryptjs password hashing
  - Secure password reset via email
  - Token expiration (24 uur)
  - Password strength requirements

### Two-Factor Authentication (2FA)

- **TOTP Authenticatie**
  - Time-based One-Time Password via authenticator apps
  - Ondersteuning voor Google Authenticator, Authy, Microsoft Authenticator, 1Password
  - QR code setup voor eenvoudige configuratie
  - Backup codes: 10 one-time recovery codes voor account toegang

- **2FA Recovery**
  - Email recovery: Tijdelijke recovery code via email (last resort, resets 2FA)
  - Admin reset: Admins kunnen 2FA resetten voor gebruikers in hun organisatie
  - Security logging: Alle 2FA events gelogd voor audit doeleinden

### Account Beveiliging

- **Brute Force Protection**
  - Account lockout na 10 mislukte login pogingen
  - reCAPTCHA integratie vereist na 3 mislukte pogingen
  - 30-minuten lockout duur
  - Admin unlock: Admins kunnen locked accounts unlocken
  - Failed login tracking: Comprehensive security audit trail

- **Email Verification**
  - Email verificatie vereist bij registratie
  - Verification tokens met 24-uur expiration
  - Resend verification email functionaliteit
  - Security audit logging

### API Beveiliging

- **API Key Management**
  - Automatisch gegenereerde API keys
  - Secure key storage
  - Key rotation functionaliteit

- **Domain Whitelisting**
  - Beperk widget gebruik tot specifieke domeinen
  - Multi-domain ondersteuning
  - Real-time validatie

- **Rate Limiting**
  - Configureerbare user limits
  - Distributed rate limiting met Upstash Redis
  - Automatic fallback naar in-memory wanneer Redis unavailable
  - Rate limit headers (X-RateLimit-Limit, Remaining, Reset)
  - Per-chatbot configurable limits

---

## Widget Integratie

### Widget Features

- **Lightweight & Performant**
  - Minimale bundle size
  - Snelle laadtijden
  - Geoptimaliseerd voor performance

- **Customizable**
  - Kleuren aanpasbaar (primary, secondary)
  - Positie configuratie (links/rechts)
  - Teksten aanpasbaar (welkomstbericht, placeholder)
  - Avatar ondersteuning
  - Font aanpassing

- **Responsive Design**
  - Werkt op desktop en mobile
  - Adaptive layout
  - Touch-friendly interface

- **Secure & Isolated**
  - Shadow DOM isolatie
  - Geen style conflicts met host website
  - Secure API communicatie

- **Persistent Sessions**
  - Session en messages worden opgeslagen
  - Blijft actief bij page refresh
  - Cross-tab synchronisatie

### Widget Integratie

- **Embed Code**
  - Eenvoudige script tag integratie
  - Data attributes voor configuratie
  - Automatische initialisatie

- **Platform Ondersteuning**
  - HTML websites
  - WordPress
  - Shopify
  - Wix
  - Squarespace
  - React/Next.js
  - Alle andere platforms

- **Configuratie Opties**
  - `data-chatbot-id`: API key (vereist)
  - `data-api-url`: Backend API URL
  - `data-name`: Bot naam
  - `data-welcome`: Welkomstbericht
  - `data-placeholder`: Input placeholder
  - `data-primary-color`: Hoofdkleur
  - `data-secondary-color`: Accent kleur
  - `data-position`: Positie (left/right)
  - `data-show-branding`: Toon/verberg branding
  - `data-language`: Taal (nl, en, de, es, fr)

### Widget Functionaliteiten

- **Chat Interface**
  - Minimizeerbaar chatvenster
  - Typing indicators
  - Message history
  - Source attribution
  - Error handling
  - Action buttons ondersteuning

- **Session Management**
  - Automatische sessie creatie
  - Message persistentie
  - Cross-page continuïteit

---

## Instellingen

### Account Instellingen

- **User Profile**
  - Naam en email beheer
  - Wachtwoord wijziging
  - Avatar upload
  - Taal voorkeur

- **2FA Instellingen**
  - 2FA activeren/deactiveren
  - QR code setup
  - Backup codes beheer
  - Recovery opties

### Assistent Instellingen

- **Look & Feel**
  - Kleuren configuratie
  - Font selectie
  - Avatar upload
  - Widget positie

- **Gedrag Instellingen**
  - Toon selectie
  - Temperatuur instelling
  - Responslengte
  - Fallback berichten

- **Integraties**
  - API key beheer
  - Domain whitelisting
  - Rate limiting configuratie
  - Embed code generatie

### Team Instellingen (Admin)

- **Team Beheer**
  - Gebruikers toevoegen/verwijderen
  - Rol toewijzing
  - Permissies beheer

---

## Email Systeem

### Email Functionaliteiten

- **Resend Integratie**
  - Production-ready email delivery
  - Professional HTML email templates
  - Responsive design
  - Multi-language support

### Email Types

- **Welcome Emails**
  - Welkomstbericht voor nieuwe gebruikers
  - Account setup instructies

- **Email Verification**
  - Verificatie emails met 24-uur token expiration
  - Resend functionaliteit

- **Password Reset**
  - Secure password reset emails
  - Token-based reset links
  - Expiration handling

- **Contact Form Submissions**
  - Automatische email notificaties
  - Form submission details

- **2FA Recovery Codes**
  - Recovery code emails
  - Security notifications

- **Subscription Notifications**
  - Abonnement expiration notificaties
  - Payment reminders
  - Upgrade prompts

- **Invitation Emails**
  - Team member uitnodigingen
  - Account setup links

### Email Features

- **Attachment Support**
  - Email attachments via raw MIME messages
  - File support

- **Error Handling**
  - Graceful degradation als email service unavailable
  - Comprehensive logging voor debugging en monitoring

---

## Internationalisatie

### Multi-language Support

- **Ondersteunde Talen**
  - **Nederlands (nl)**: Standaard taal met volledige vertaling
  - **Engels (en)**: Complete Engelse interface
  - **Duits (de)**: Volledige Duitse vertaling
  - **Frans (fr)**: Complete Franse vertaling
  - **Spaans (es)**: Volledige Spaanse interface

- **next-intl Integratie**
  - Powered by next-intl voor naadloze internationalisatie
  - Locale-based routing (URL-based locale switching)
  - Translation files in `messages/` directory

### i18n Functionaliteiten

- **User Language Preference**
  - Gebruikers kunnen voorkeurstaal selecteren
  - Language persistence (voorkeur opgeslagen)
  - Language selector in settings en header

- **Comprehensive Translations**
  - Alle UI elementen vertaald
  - Error messages vertaald
  - Notifications vertaald
  - 1250+ vertaalde strings per taal

- **Locale Routing**
  - URL-based locale switching (bijv. `/nl/`, `/en/`, `/de/`)
  - Automatische locale detectie
  - Fallback naar standaard taal

---

## RAG Systeem

### RAG Functionaliteiten

- **Vector Embeddings**
  - OpenAI text-embedding-3-small voor semantic search
  - Automatische embedding generatie
  - Vector storage in database met pgvector

- **Document Chunking**
  - Intelligente text splitting met context preservation
  - 1000 karakters per chunk met 200 overlap
  - Optimalisatie voor embedding generatie

- **Semantic Search**
  - Meaning-based search, niet alleen keyword matching
  - Hybrid search: combineert semantic en keyword search
  - Context-aware resultaten
  - Relevante content retrieval

- **Website Integratie**
  - Automatische verwerking van gescrapede website content
  - Per pagina chunking
  - Link discovery en tracking

- **Real-time Indexing**
  - Nieuwe content automatisch searchable
  - Background processing
  - Status tracking

- **Source Attribution**
  - AI responses inclusief source references
  - Link naar originele bronnen
  - Document tracking

- **Multi-language Support**
  - Werkt met Nederlands en Engels content
  - Taal-agnostische embeddings

- **Scalable Architecture**
  - Handelt duizenden documenten efficiënt af
  - Performance optimalisatie
  - Database indexing

---

## Technische Details

### API Endpoints

#### Assistenten

- `GET /api/assistants` - Lijst assistenten
- `POST /api/assistants` - Maak assistent
- `GET /api/assistants/[id]` - Assistent details
- `PUT /api/assistants/[id]` - Update assistent
- `DELETE /api/assistants/[id]` - Verwijder assistent

#### Kennisbank

- `GET /api/files?assistantId={id}` - Lijst bestanden
- `POST /api/files` - Upload bestand
- `PUT /api/files/{id}` - Update bestand
- `DELETE /api/files/{id}` - Verwijder bestand
- `GET /api/files/{id}/download` - Download bestand

- `GET /api/websites?assistantId={id}` - Lijst websites
- `POST /api/websites` - Maak website
- `PUT /api/websites/{id}` - Update website
- `DELETE /api/websites/{id}` - Verwijder website
- `POST /api/websites/{id}/scrape` - Start scraping

- `GET /api/faqs?assistantId={id}` - Lijst FAQ's
- `POST /api/faqs` - Maak FAQ
- `PUT /api/faqs/{id}` - Update FAQ
- `DELETE /api/faqs/{id}` - Verwijder FAQ
- `POST /api/faqs/bulk` - Bulk import FAQ's

#### Conversaties

- `GET /api/conversations/sessions` - Lijst sessies
- `GET /api/conversations/sessions/stats` - Sessie statistieken
- `POST /api/conversations/sessions/[id]/rate` - Rate sessie
- `POST /api/chat/message` - Verstuur bericht en ontvang response

#### Analytics

- `GET /api/analytics/stats` - Overzicht statistieken
- `GET /api/analytics/conversations` - Conversatie data
- `GET /api/analytics/ratings` - Rating data

#### Abonnementen

- `GET /api/subscriptions` - Abonnement details
- `POST /api/subscriptions/upgrade` - Upgrade abonnement
- `GET /api/subscriptions/invoices` - Facturen lijst
- `POST /api/subscriptions/sync` - Sync subscription status

### Database Modellen

- **User**: Gebruikers met role-based access en subscription data
- **ChatbotSettings**: AI assistenten met volledige configuratie
- **ActionButton**: Quick interaction buttons voor assistenten
- **KnowledgeFile**: Kennisbank bestanden en metadata
- **Website**: Website integratie met scraping data
- **WebsitePage**: Individuele gescrapede pagina's
- **FAQ**: Veelgestelde vragen met volledige CRUD operaties
- **KnowledgeBase**: Koppeling tussen kennisbronnen en assistenten
- **ConversationSession**: Complete conversatie sessies met metadata
- **ConversationMessage**: Individuele berichten binnen sessies
- **DocumentChunk**: Verwerkte text chunks met vector embeddings
- **Notification**: Systeem notificaties
- **Subscription**: Abonnement data en status

### Limieten

- FAQ vraag: Max 500 karakters
- FAQ antwoord: Max 5000 karakters
- Website maxDepth: Standaard 3, configureerbaar
- Website maxUrls: Standaard 50, configureerbaar
- Bestandsgrootte: Afhankelijk van server configuratie
- Paginatie: 20 items per pagina (FAQ's)
- Rate limiting: Configureerbaar per chatbot

---

## Gebruikstips

### Best Practices

1. **Organiseer je Content**
   - Gebruik beschrijvingen voor bestanden
   - Geef websites duidelijke namen
   - Categoriseer FAQ's met consistente vraagformulering

2. **Optimaliseer Scraping**
   - Stel maxDepth in op basis van website structuur
   - Limiteer maxUrls voor grote websites
   - Gebruik sync intervals voor automatische updates

3. **FAQ Management**
   - Gebruik bulk import voor grote hoeveelheden FAQ's
   - Houd vragen kort en specifiek
   - Gebruik order voor belangrijke FAQ's

4. **Status Monitoring**
   - Controleer regelmatig verwerkingsstatus
   - Los errors snel op
   - Monitor sync logs voor problemen

5. **Widget Integratie**
   - Test widget op verschillende browsers
   - Configureer domain whitelisting voor beveiliging
   - Monitor rate limits

### Veelvoorkomende Taken

1. **Nieuwe Assistent Aanmaken**
   - Ga naar Assistenten > Nieuw
   - Vul basis informatie in
   - Configureer look & feel
   - Voeg kennisbronnen toe
   - Kopieer embed code

2. **Website Toevoegen aan Kennisbank**
   - Ga naar Kennisbank > Websites
   - Klik "Toevoegen"
   - Voer URL in en configureer settings
   - Klik "Scrape Nu" voor directe scraping

3. **Bulk FAQ Import**
   - Ga naar Kennisbank > FAQ's
   - Klik "Bulk Importeren"
   - Upload CSV bestand
   - Controleer import resultaten

4. **Abonnement Upgraden**
   - Ga naar Billing
   - Bekijk beschikbare plannen
   - Klik "Upgrade" op gewenst plan
   - Voltooi Stripe checkout

5. **Widget Integreren**
   - Ga naar Assistenten > Instellingen > Widget
   - Kopieer embed code
   - Plak code in website HTML
   - Test widget functionaliteit

---

## Conclusie

Het Ainexo AI Chat Assistent platform biedt een uitgebreide set functionaliteiten voor het creëren, beheren en optimaliseren van AI-gestuurde chatbots. Met ondersteuning voor meerdere assistenten, uitgebreide kennisbank beheer, real-time analytics, flexibele abonnementen, en enterprise-grade beveiliging, is het platform volledig uitgerust voor professioneel gebruik.

Voor vragen of ondersteuning, raadpleeg de gebruikershandleiding of neem contact op met de beheerder.

---

_Laatste update: 2024_
_Versie: 1.0_
_Platform: Ainexo AI Chat Assistent_
