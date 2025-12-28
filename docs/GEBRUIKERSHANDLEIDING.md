# Ainexo - Gebruikershandleiding

## 📖 Inhoudsopgave

1. [Introductie](#introductie)
2. [Wat is Ainexo?](#wat-is-Ainexo)
3. [Voor wie is dit platform?](#voor-wie-is-dit-platform)
4. [Aan de slag](#aan-de-slag)
5. [Gebruikersrollen](#gebruikersrollen)
6. [Dashboard](#dashboard)
7. [Assistenten beheren](#assistenten-beheren)
8. [Kennisbank](#kennisbank)
9. [Conversaties en Analytics](#conversaties-en-analytics)
10. [Instellingen](#instellingen)
11. [Abonnementen](#abonnementen)
12. [Notificaties](#notificaties)
13. [Admin functies](#admin-functies)
14. [Widget integratie](#widget-integratie)
15. [Veelgestelde vragen](#veelgestelde-vragen)
16. [Troubleshooting](#troubleshooting)

---

## Introductie

Welkom bij de Ainexo gebruikershandleiding! Deze handleiding helpt je om het maximale uit het platform te halen, of je nu een eindgebruiker, beheerder of developer bent.

## Wat is Ainexo?

Ainexo is een modern, self-hosted chatbot platform waarmee organisaties een AI-gestuurde chatbot kunnen creëren die vragen beantwoordt op basis van hun eigen documenten en kennisbank. Het platform maakt gebruik van geavanceerde AI-technologie (OpenAI GPT-4) en RAG (Retrieval-Augmented Generation) om nauwkeurige en contextbewuste antwoorden te geven.

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

## Voor wie is dit platform?

### Eindgebruikers (USER)

Creëer en beheer je eigen AI chatbots, upload documenten, en monitor prestaties.

### Beheerders (ADMIN)

Toegang tot alle functionaliteiten voor het beheren van meerdere assistenten en teams.

### Superbeheerders (SUPERUSER)

Volledige toegang inclusief gebruikersbeheer, abonnementenbeheer en systeemnotificaties.

---

## Aan de slag

### Eerste keer inloggen

1. **Navigeer naar het platform**: Open je browser en ga naar de URL van je Ainexo installatie
2. **Log in**: Gebruik je toegewezen inloggegevens
3. **Verken het dashboard**: Je wordt begroet met een overzichtelijk dashboard

### Test accounts (alleen ontwikkeling)

Voor ontwikkeling zijn er drie test accounts beschikbaar:

| Rol       | Email                 | Wachtwoord   | Abonnement     |
| --------- | --------------------- | ------------ | -------------- |
| Superuser | superuser@example.com | superuser123 | Enterprise     |
| Admin     | admin@example.com     | admin123     | Business       |
| User      | user@example.com      | user123      | 30-dagen trial |

> ⚠️ **Let op**: Deze accounts zijn alleen voor test-/ontwikkeldoeleinden!

---

## Gebruikersrollen

Ainexo heeft drie gebruikersrollen met verschillende toegangsniveaus:

### 👤 USER (Gebruiker)

**Wat kun je doen:**

- Eigen AI assistenten aanmaken en beheren
- Documenten uploaden en websites toevoegen
- Kennisbank beheren (FAQs, bestanden, websites)
- Conversaties bekijken en analyseren
- Instellingen aanpassen
- Eigen abonnement beheren

**Wat kun je NIET doen:**

- Andere gebruikers beheren
- Systeembrede notificaties aanmaken
- Abonnementen van anderen bekijken

### 👨‍💼 ADMIN (Beheerder)

**Wat kun je doen:**

- Alles wat een USER kan
- Toegang tot geavanceerde analytics
- Team management
- Meerdere assistenten voor organisatie

**Wat kun je NIET doen:**

- Gebruikers aanmaken/verwijderen
- Systeemnotificaties beheren
- Alle abonnementen bekijken

### 👑 SUPERUSER (Superbeheerder)

**Wat kun je doen:**

- **VOLLEDIGE toegang** tot alle functies
- Gebruikers aanmaken, bewerken en verwijderen
- Alle abonnementen bekijken en beheren
- Systeembrede notificaties aanmaken
- Toegang tot admin dashboard
- Revenue en subscription tracking
- Complete controle over het platform

---

## Dashboard

Het dashboard is je centrale werkplek in Ainexo. Hier vind je:

### Overzicht

- **Statistieken**: Totaal aantal conversaties, actieve sessies, berichten
- **Assistant Switcher**: Schakel snel tussen je verschillende assistenten
- **Recent Activity**: Laatste conversaties en activiteiten
- **Quick Actions**: Snelle toegang tot veelgebruikte functies

### Notificatiebel

Rechtsboven in de header vind je een bel-icoon 🔔 met:

- Badge met aantal ongelezen notificaties
- Dropdown met recente meldingen
- Link naar volledige notificatiepagina

### Navigatie

Het linker menu bevat alle hoofdfuncties:

- **Dashboard** - Overzichtspagina
- **Assistenten** - AI chatbot beheer
- **Kennisbank** - Content en documentbeheer
- **Conversaties** - Gespreksgeschiedenis
- **Instellingen** - Configuratie
- **Account** - Persoonlijke instellingen en abonnement
- **Admin** (alleen SUPERUSER) - Gebruikers- en systeembeheer

---

## Assistenten beheren

Assistenten zijn je AI-chatbots. Je kunt meerdere assistenten aanmaken voor verschillende doeleinden.

### Een nieuwe assistent aanmaken

1. Ga naar **Assistenten** in het menu
2. Klik op **"Nieuwe Assistent"** of **"+ Assistent toevoegen"**
3. Vul de basisinformatie in:
   - **Naam**: Geef je assistent een herkenbare naam (bijv. "Klantenservice Bot")
   - **Beschrijving**: Korte omschrijving van het doel
   - **Welkomstbericht**: Eerste bericht dat gebruikers zien

4. Klik op **"Aanmaken"**

### Assistent configureren

Na het aanmaken kun je je assistent verder configureren:

#### 🎨 Uiterlijk en gedrag (Look & Feel)

**Visuele instellingen:**

- **Primaire kleur**: Hoofdkleur van je chatbot
- **Secundaire kleur**: Accentkleur
- **Lettertype**: Kies uit verschillende fonts
- **Avatar**: Upload een profielafbeelding
- **Positie**: Links of rechts op de pagina

**Gedragsinstellingen:**

- **Toon**: Professioneel, Vriendelijk, of Casual
- **Temperatuur** (0.0 - 1.0):
  - Laag (0.0-0.3): Consistente, voorspelbare antwoorden
  - Midden (0.4-0.7): Gebalanceerd
  - Hoog (0.8-1.0): Creatieve, gevarieerde antwoorden
- **Responslengte**: Kort, Gemiddeld, of Lang
- **Fallback bericht**: Antwoord wanneer de bot niet weet wat te zeggen

#### 🎯 Actieknoppen (Action Buttons)

Maak snelkeuze knoppen voor veelgestelde vragen:

1. Ga naar de **Action Buttons** tab
2. Klik op **"Knop toevoegen"**
3. Vul in:
   - **Label**: Tekst op de knop (bijv. "Openingstijden")
   - **Vraag**: De vraag die automatisch gesteld wordt
   - **Prioriteit**: Volgorde van weergave (hoger = eerder getoond)
4. **Activeren/Deactiveren**: Schakel knoppen aan of uit zonder te verwijderen

**Voorbeeld actieknoppen:**

- "Wat zijn jullie openingstijden?" → Label: "Openingstijden"
- "Hoe kan ik contact opnemen?" → Label: "Contact"
- "Wat zijn de prijzen?" → Label: "Prijzen"

#### 🔗 Widget Embedden

1. Ga naar de **Widget** tab
2. Kopieer de embed code
3. Plak de code voor de sluitende `</body>` tag van je website

**Embed code voorbeeld:**

```html
<script
  src="https://jouw-domein.com/widget/chatbot.js"
  data-assistant-id="abc123xyz"
></script>
```

#### 🔐 Beveiligingsinstellingen

- **API Key**: Automatisch gegenereerd, gebruik voor API-calls
- **Domain Whitelisting**: Beperk gebruik tot specifieke domeinen
- **Rate Limiting**: Maximaal aantal berichten per gebruiker per dag

---

## Kennisbank

De kennisbank is het hart van je AI assistent. Hier voeg je alle informatie toe waarop je chatbot kan trainen.

### Tabbladen overzicht

De kennisbank heeft vier hoofdsecties:

#### 📁 Bestanden (Files)

**Upload documenten:**

Ondersteunde formaten:

- PDF documenten
- Word bestanden (.docx)
- Tekstbestanden (.txt)
- Afbeeldingen (.jpg, .png)

**Hoe te uploaden:**

1. Ga naar **Kennisbank** → **Bestanden** tab
2. Sleep bestanden naar het upload gebied, of
3. Klik op **"Bestanden selecteren"**
4. Wacht op verwerking (status: PROCESSING → COMPLETED)

**Automatische verwerking:**

- Tekst wordt geëxtraheerd
- Content wordt opgedeeld in chunks (1000 karakters met 200 overlap)
- Er worden embeddings gegenereerd voor semantisch zoeken
- Documenten worden doorzoekbaar in de RAG-pipeline

**Bestandsbeheer:**

- **Bekijken**: Klik op het oog-icoon
- **Downloaden**: Haal het originele bestand op
- **Verwijderen**: Verwijder document inclusief embeddings

#### 🌐 Websites

**Website content automatisch verwerken:**

1. Ga naar **Kennisbank** → **Websites** tab
2. Klik op **"Website toevoegen"**
3. Voer de URL in (bijv. https://jouwbedrijf.nl)
4. Klik op **"Toevoegen"**

**Wat gebeurt er:**

- De website wordt automatisch gescraped
- Hoofdcontent wordt geëxtraheerd
- Alle links worden ontdekt en opgeslagen
- Sub-pagina's worden recursief verwerkt (configureerbare diepte)
- Content wordt opgedeeld en embeddings worden gegenereerd
- Alles wordt doorzoekbaar via RAG

**Website content bekijken:**

1. Klik op een website in de lijst
2. Je ziet:
   - Status (PROCESSING, COMPLETED, FAILED)
   - Aantal gevonden pagina's
   - Laatste synchronisatie
   - Gevonden links
   - Volledige gescrapete content

**Handmatig opnieuw scrapen:**

- Klik op **"Opnieuw scrapen"** om een website te updaten
- Dit is handig wanneer de website-content is gewijzigd

**Scraping features:**

- **Multi-page crawling**: Verwerkt automatisch gelinkte pagina's
- **Smart content extraction**: Richt zich op main content, negeert navigatie/footer
- **Link discovery**: Ontdekt en behoudt alle interne en externe links
- **Status tracking**: Real-time updates van verwerkingsstatus
- **Error handling**: Duidelijke foutmeldingen bij problemen

#### ❓ FAQs (Veelgestelde Vragen)

**Maak voorgedefinieerde vraag-antwoord paren:**

1. Ga naar **Kennisbank** → **FAQs** tab
2. Klik op **"FAQ toevoegen"**
3. Vul in:
   - **Vraag**: De precieze vraag
   - **Antwoord**: Het correcte antwoord
   - **Categorie** (optioneel): Voor organisatie
4. Klik op **"Opslaan"**

**Waarom FAQs gebruiken:**

- Garandeert consistente antwoorden op belangrijke vragen
- Sneller dan document-zoeken
- Volledige controle over specifieke antwoorden
- Ideaal voor policy-gerelateerde informatie

**Voorbeelden:**

- **Q**: "Wat zijn jullie openingstijden?"  
  **A**: "Wij zijn geopend van maandag t/m vrijdag van 09:00 tot 17:00 uur."
- **Q**: "Hoe kan ik mijn bestelling annuleren?"  
  **A**: "Je kunt je bestelling binnen 24 uur annuleren via je account of door contact op te nemen met onze klantenservice."

#### 📊 Snippets (Herbruikbare fragmenten)

**Creëer herbruikbare tekstfragmenten:**

Snippets zijn nuttig voor:

- Contactinformatie
- Bedrijfsbeleid
- Standaard antwoorden
- Veelgebruikte uitleg

1. Ga naar **Kennisbank** → **Snippets** tab
2. Maak nieuwe snippets aan met labels
3. Verwijs ernaar in andere content met `{{snippet-naam}}`

---

## Conversaties en Analytics

Krijg volledig inzicht in hoe je chatbot presteert en hoe gebruikers ermee interacteren.

### Conversaties overzicht

#### Sessieweergave

**Wat zie je:**

- **Sessie-overzicht**: Lijst van alle conversatie-sessies
- **Sessie-ID**: Unieke identifier per gesprek
- **Tijdstempel**: Wanneer het gesprek plaatsvond
- **Duur**: Hoe lang het gesprek duurde
- **Aantal berichten**: Totaal aantal uitgewisselde berichten
- **Rating**: Gebruikersbeoordeling (1-5 sterren)
- **Status**: Actief of Afgerond

**Sessie uitklappen:**

1. Klik op een sessie in de lijst
2. Zie het complete gespreksverloop:
   - Alle gebruikersvragen
   - Alle chatbot-antwoorden
   - Tijdstempel per bericht
   - Gebruikte bronnen per antwoord
   - Prestatiemetrics per bericht

#### Berichtdetails

Voor elk bericht zie je:

- **Type**: USER, ASSISTANT, of SYSTEM
- **Content**: De daadwerkelijke tekst
- **Timestamp**: Exacte tijd
- **Response tijd**: Hoe snel het antwoord kwam (alleen assistant)
- **Tokens gebruikt**: Aantal tokens verbruikt
- **Confidence score**: Zekerheid van het antwoord (0-1)
- **Model**: Welk AI-model gebruikt is
- **Bronnen**: Welke documenten/chunks gebruikt zijn

#### Bronvermelding (Source Attribution)

Zie precies welke documenten gebruikt zijn per antwoord:

- **Document naam**: Welk bestand
- **Chunk content**: Het relevante tekstfragment
- **Relevance score**: Hoe relevant de bron was (0-1)

Dit geeft transparantie en traceerbaarheid van AI-antwoorden.

### Geavanceerde filtering

Filter conversaties op:

- **Type**: Alle, USER, ASSISTANT, SYSTEM
- **Tijdsperiode**: Vandaag, Afgelopen week, Afgelopen maand, Custom
- **Duur**: Kort (<5 min), Gemiddeld (5-15 min), Lang (>15 min)
- **Rating**: 1-5 sterren

### Sessie analytics

**Statistieken dashboard:**

- **Total Sessions**: Totaal aantal gesprekken
- **Active Sessions**: Actieve gesprekken (laatste 24 uur)
- **Total Messages**: Alle berichten over alle sessies
- **Average Messages/Session**: Gemiddeld aantal berichten per gesprek
- **Average Session Duration**: Gemiddelde gesprekslengte
- **Rating Distribution**: Verdeling van beoordelingen

### Performance Metrics

**Per sessie:**

- Totale duur
- Aantal berichten
- Token verbruik
- Gemiddelde response tijd
- Confidence scores

**Per bericht:**

- Response tijd in milliseconden
- Aantal gebruikte tokens
- Confidence score
- Welk model gebruikt is

### Rating systeem

**Gebruikers kunnen sessies beoordelen:**

1. Einde van gesprek
2. Rating prompt verschijnt (1-5 sterren)
3. Optioneel: Opmerking toevoegen
4. Opslaan

**Ratings bekijken:**

- Ga naar Conversaties → Sessies
- Filter op rating
- Bekijk comments bij lage ratings voor verbeterpunten

### Export functionaliteit

Export conversatiedata voor:

- Externe analyse
- Compliance/audit
- Training data
- Rapportage

Formats: CSV, JSON

---

## Instellingen

Pas je chatbot en account volledig aan naar je wensen.

### Instellingen menu

De instellingen zijn opgedeeld in meerdere secties:

#### 🎨 Look & Feel

- Kleuren en styling
- Font selectie
- Avatar en afbeeldingen
- Welkomst- en afscheidsberichten
- Toon en temperatuur

#### 🎯 Action Buttons

- Beheer snelkeuze knoppen
- Prioriteit instellen
- Activeren/deactiveren

#### 📝 Forms (Formulieren)

- Contact formulieren configureren
- Email-integraties
- Custom fields

#### 🔗 Integraties

- API configuratie
- Webhooks
- Third-party services
- Domain whitelisting
- Rate limits

#### 🔐 Beveiliging

- API keys beheren
- Domain restrictions
- Access logs
- Security settings

---

## Abonnementen

Ainexo werkt met een flexibel abonnementssysteem via Stripe.

### Abonnementsplannen

Er zijn vier plannen beschikbaar:

#### 🌱 Starter Plan - €19/maand

**Ideaal voor kleine bedrijven en starters**

- 1 chatbot
- 100 conversaties per maand
- Basis analytics
- Email support

#### 💼 Professional Plan - €49/maand

**Voor groeiende bedrijven**

- 3 chatbots
- 500 conversaties per maand
- Geavanceerde analytics
- Priority support
- Custom branding

#### 🏢 Business Plan - €149/maand

**Voor professionele organisaties**

- 10 chatbots
- 2.000 conversaties per maand
- Alle analytics features
- Team management
- API toegang
- Priority support

#### 🚀 Enterprise Plan - €499/maand

**Voor grote organisaties**

- Unlimited chatbots
- Unlimited conversaties
- Dedicated support
- Custom integraties
- SLA garantie
- Training & onboarding

### Trial periode

**Alle nieuwe gebruikers krijgen:**

- 30 dagen gratis trial
- Toegang tot alle Professional features
- Geen creditcard vereist
- Automatische reminder na 25 dagen

**Trial status bekijken:**

1. Ga naar **Account** → **Subscription** tab
2. Zie dagen resterend
3. Gebruik bekijken
4. Upgrade optie

### Abonnement beheren

**Een plan kiezen:**

1. Ga naar **Account** → **Subscription** tab
2. Bekijk alle plannen en features
3. Klik op **"Kies dit plan"** bij gewenst plan
4. Wordt doorgestuurd naar Stripe Checkout
5. Vul betaalgegevens in
6. Bevestig

**Abonnement wijzigen:**

1. Ga naar **Account** → **Subscription**
2. Klik op **"Beheer abonnement"**
3. Wordt doorgestuurd naar Stripe Customer Portal
4. Kan hier:
   - Plan upgraden/downgraden
   - Betaalmethode wijzigen
   - Facturen bekijken
   - Abonnement opzeggen

### Gebruik tracking

**Realtime inzicht in je gebruik:**

- **Chatbots**: Aantal actieve chatbots vs limiet
- **Conversaties**: Aantal conversaties deze maand vs limiet
- **Progress bars**: Visuele weergave van verbruik

**Limiet bereikt:**

- Melding verschijnt in dashboard
- Upgrade prompt met call-to-action
- Geen onderbreking van service bij trial
- Automatische blokkering na trial zonder upgrade

### Facturen

**Facturen beheren:**

1. Klik op **"Beheer abonnement"**
2. Stripe portal opent
3. Ga naar **"Invoice history"**
4. Download PDF facturen

**Alle facturen bevatten:**

- Factuurnummer
- Bedrijfsgegevens
- BTW informatie
- Betaalmethode
- Volgende factuurdatum

---

## Notificaties

Blijf op de hoogte van belangrijke updates en gebeurtenissen.

### Notificatiebel

**In de header (rechtsboven):**

- 🔔 Bell-icoon met badge
- Badge toont aantal ongelezen notificaties
- Klik voor dropdown met recente meldingen
- "Alles bekijken" → naar volledige notificatiepagina

### Notificatie types

Vijf verschillende types notificaties:

#### 🔵 INFO

Algemene informatieve meldingen

- Nieuwe features
- Updates
- Tips & tricks

#### ⚠️ WARNING

Waarschuwingen die aandacht vereisen

- Naderende limiet
- Configuratie-issues
- Expirerende items

#### 🔴 ERROR

Foutmeldingen en problemen

- Processing errors
- API failures
- Systeemstoringen

#### ✅ SUCCESS

Bevestigingen van succesvolle acties

- Document succesvol verwerkt
- Upgrade voltooid
- Synchronisatie geslaagd

#### 🔧 MAINTENANCE

Onderhoudsmeldingen

- Geplande downtime
- Systeemupgrades
- Servicemededelingen

### Prioriteitsniveaus

Notificaties hebben verschillende prioriteiten:

- **🔴 URGENT**: Directe actie vereist
- **🟠 HIGH**: Belangrijk, binnenkort actie nodig
- **🟡 MEDIUM**: Relevant, geen haast
- **🟢 LOW**: Optioneel, informatief

### Notificaties beheren

**Markeren als gelezen:**

1. Klik op notificatie om te openen
2. Automatisch gemarkeerd als gelezen
3. Badge nummer daalt

**Bulk acties:**

- Selecteer meerdere notificaties
- "Markeer alle als gelezen"
- Filter op type of prioriteit

**Notificatie pagina:**

1. Ga naar **Notificaties** in menu
2. Zie alle notificaties in tabelweergave
3. Sorteer op datum, type, prioriteit
4. Filter en zoek functionaliteit

---

## Admin functies

Deze functies zijn alleen beschikbaar voor SUPERUSER accounts.

### Admin Dashboard

Het admin dashboard geeft je complete controle over het platform.

**Toegang:**

1. Log in als SUPERUSER
2. Navigeer naar **Admin** in het hoofdmenu
3. Kies uit:
   - Gebruikersbeheer
   - Abonnementenbeheer
   - Notificatiebeheer
   - Statistieken

### Gebruikersbeheer

**Volledige gebruikerscontrole:**

#### Gebruikers overzicht

- Tabelweergave van alle gebruikers
- Sorteer op: Naam, Email, Rol, Aanmaakdatum
- Zoekfunctionaliteit
- Filter op rol

**Zichtbare informatie:**

- Naam en email
- Gebruikersrol (USER, ADMIN, SUPERUSER)
- Aantal assistenten
- Account aanmaakdatum
- Laatste activiteit

#### Nieuwe gebruiker aanmaken

1. Ga naar **Admin** → **Gebruikers**
2. Klik op **"Gebruiker toevoegen"**
3. Vul in:
   - **Naam**: Voor- en achternaam
   - **Email**: Uniek emailadres
   - **Wachtwoord**: Sterk wachtwoord (min. 8 tekens)
   - **Rol**: USER, ADMIN, of SUPERUSER
4. Klik op **"Aanmaken"**

**Tips:**

- Email moet uniek zijn in het systeem
- Wachtwoord wordt automatisch ge-hashed
- Gebruiker ontvangt geen automatische email (kan je zelf regelen)

#### Gebruiker bewerken

1. Vind gebruiker in lijst
2. Klik op **"Bewerken"** (potlood-icoon)
3. Wijzig:
   - Naam
   - Email (moet uniek blijven)
   - Rol
   - Wachtwoord (laat leeg om te behouden)
4. Klik op **"Opslaan"**

#### Gebruiker verwijderen

1. Vind gebruiker in lijst
2. Klik op **"Verwijderen"** (prullenbak-icoon)
3. Bevestig de actie

**Veiligheidsmaatregelen:**

- Je kunt je eigen account niet verwijderen
- Confirmation dialog voorkomt ongelukken
- Alle geassocieerde data wordt ook verwijderd:
  - Assistenten
  - Documenten
  - Conversaties
  - Kennisbank items

### Abonnementenbeheer

**Overzicht van alle subscriptions:**

1. Ga naar **Admin** → **Abonnementen**
2. Zie tabelweergave met:
   - Gebruiker naam en email
   - Huidig plan (Starter/Professional/Business/Enterprise)
   - Status (Active/Canceled/Past Due)
   - Begindatum
   - Volgende betaling
   - Bedrag per maand

**Statistieken:**

- Totaal aantal actieve abonnementen
- Revenue per maand
- Verdeling per plan type
- Growth metrics

**Acties:**

- Bekijk details per abonnement
- Open Stripe dashboard voor meer info
- Exporteer data voor rapportage

### Admin notificaties aanmaken

**Systeembrede notificaties versturen:**

1. Ga naar **Admin** → **Notificaties**
2. Klik op **"Notificatie aanmaken"**
3. Vul in:
   - **Titel**: Korte, duidelijke titel
   - **Bericht**: Volledige notificatie tekst
   - **Type**: INFO, WARNING, ERROR, SUCCESS, MAINTENANCE
   - **Prioriteit**: LOW, MEDIUM, HIGH, URGENT
   - **Target**:
     - Alle gebruikers
     - Specifieke gebruiker (selecteer uit lijst)
   - **Expiration Date** (optioneel): Wanneer notificatie automatisch verwijderd wordt

4. Klik op **"Versturen"**

**Use cases:**

- **Maintenance**: "Geplande onderhoudsmelding: zondag 2:00-4:00 uur"
- **New Feature**: "Nieuwe functie beschikbaar: Bulk document upload"
- **Warning**: "Je bereikt binnenkort je maandelijkse limiet"
- **Error**: "Momenteel problemen met document verwerking, we werken aan een oplossing"

**Best practices:**

- Gebruik duidelijke, actie-gerichte taal
- Kies het juiste type en prioriteit
- Gebruik URGENT spaarzaam
- Zet expiration date voor tijdelijke meldingen
- Test eerst met één gebruiker bij kritieke meldingen

### Systeem statistieken

**Platform-wijde metrics:**

- Totaal aantal gebruikers
- Totaal aantal assistenten
- Totaal aantal conversaties
- Document statistieken
- Performance metrics
- Growth trends

---

## Widget integratie

Integreer je Ainexo chatbot op elke website.

### Embed code verkrijgen

1. Ga naar je **Assistent**
2. Open **Instellingen** → **Widget** tab
3. Kopieer de embed code

**Embed code ziet er zo uit:**

```html
<script
  src="https://jouw-domein.com/widget/chatbot.js"
  data-assistant-id="clx1234567890abcdefg"
  data-primary-color="#3B82F6"
  data-position="right"
></script>
```

### Widget installeren

#### Op elke HTML website:

1. Open je website's HTML bestanden
2. Voeg de embed code toe voor de sluitende `</body>` tag
3. Upload de wijziging
4. Ververs je website - chatbot verschijnt!

#### WordPress:

1. Ga naar **Appearance** → **Theme Editor**
2. Open `footer.php`
3. Plak code voor `<?php wp_footer(); ?>`
4. Sla op

**Of gebruik een plugin:**

- Install "Insert Headers and Footers" plugin
- Plak code in Footer sectie

#### Shopify:

1. **Online Store** → **Themes** → **Actions** → **Edit code**
2. Open `theme.liquid`
3. Plak code voor `</body>`
4. Save

#### Wix:

1. **Settings** → **Custom Code**
2. **+ Add Custom Code**
3. Plak code
4. Select "Body - end"
5. Apply to: All pages

#### Squarespace:

1. **Settings** → **Advanced** → **Code Injection**
2. Plak in **Footer** sectie
3. Save

### Widget configuratie

**Aanpasbare parameters in embed code:**

```html
data-assistant-id="..."
<!-- Vereist: Je assistent ID -->
data-primary-color="#3B82F6"
<!-- Hoofdkleur -->
data-secondary-color="#10B981"
<!-- Accent kleur -->
data-position="right"
<!-- Links of rechts: "left" of "right" -->
data-welcome-message="Hi!"
<!-- Custom welkomstbericht -->
data-language="nl"
<!-- Taal: nl, en, de, es, fr -->
```

### Widget gedrag

**Wat gebruikers zien:**

1. **Minimized state**: Kleine chatbubbel in hoek
2. **Klik**: Chatvenster opent
3. **Welkomstbericht**: Automatisch getoond
4. **Action buttons**: Als je die hebt ingesteld
5. **Chat interface**: Gebruiker kan vragen typen
6. **Responses**: Chatbot antwoordt met bronvermelding

**Features:**

- ✅ Sessie persistentie (blijft actief bij page refresh)
- ✅ Responsive design (werkt op mobiel)
- ✅ Minimaliseerbaar
- ✅ Bronvermelding bij antwoorden
- ✅ Typing indicators
- ✅ Error handling

### Domain whitelisting

**Beveilig je widget:**

1. Ga naar **Instellingen** → **Integraties**
2. Vind **Domain Whitelisting**
3. Voeg toegestane domeinen toe:
   ```
   https://jouwbedrijf.nl
   https://www.jouwbedrijf.nl
   https://shop.jouwbedrijf.nl
   ```
4. Save

**Nu werkt je widget alleen op deze domeinen!**

### Rate limiting

**Voorkom misbruik:**

1. **Instellingen** → **Integraties** → **Rate Limiting**
2. Stel in:
   - Max berichten per gebruiker per dag
   - Max berichten per IP per uur
   - Cooldown tussen berichten
3. Save

---

## Veelgestelde vragen

### Algemeen

**Q: Hoeveel assistenten kan ik maken?**
A: Afhankelijk van je abonnement:

- Starter: 1 chatbot
- Professional: 3 chatbots
- Business: 10 chatbots
- Enterprise: Unlimited

**Q: Wat gebeurt er als ik mijn limiet bereik?**
A: Je krijgt een melding en wordt gevraagd te upgraden. Trial users kunnen blijven gebruiken, betaalde accounts worden geblokkeerd tot upgrade.

**Q: Ondersteunt Ainexo meerdere talen?**
A: Ja! Het platform heeft interface ondersteuning voor Nederlands, Engels, Duits, Spaans en Frans. De chatbot kan in elke taal antwoorden waarin je content is.

**Q: Hoe veilig is mijn data?**
A: Zeer veilig:

- SSL/TLS encryptie
- Database encryptie at rest
- Secure password hashing (bcrypt)
- API key authenticatie
- Domain whitelisting

### Documenten

**Q: Welke bestandsformaten worden ondersteund?**
A: PDF, DOCX, TXT, JPG, PNG

**Q: Wat is de maximale bestandsgrootte?**
A: 10MB per bestand

**Q: Hoe lang duurt document verwerking?**
A: Meestal 30 seconden tot 2 minuten, afhankelijk van grootte en complexiteit.

**Q: Kan ik documenten later updaten?**
A: Ja, verwijder het oude document en upload een nieuwe versie.

### Website scraping

**Q: Hoeveel pagina's worden gescraped?**
A: Standaard tot 100 pagina's per website. Configureerbaar in instellingen.

**Q: Hoe vaak wordt content ge-update?**
A: Op aanvraag via "Opnieuw scrapen". Automatische sync kan geconfigureerd worden.

**Q: Wat als scraping faalt?**
A: Status toont "FAILED" met foutmelding. Meestal door:

- Website blokkeert scraping
- Timeout
- Ongeldige URL
- Geen toegang tot content

**Q: Worden images ook gescraped?**
A: Alleen tekst content wordt verwerkt. Afbeeldingen worden genegeerd.

### Conversaties

**Q: Hoelang worden conversaties bewaard?**
A: Permanent, tenzij handmatig verwijderd.

**Q: Kan ik conversaties verwijderen?**
A: Ja, individueel of in bulk via de conversaties pagina.

**Q: Waar komen de bronvermeldingen vandaan?**
A: De RAG-pipeline zoekt relevante chunks in je documenten/websites en linkt deze aan het antwoord.

### Abonnementen

**Q: Kan ik upgraden tijdens mijn trial?**
A: Ja, je kunt op elk moment upgraden.

**Q: Wat gebeurt er na trial expiratie?**
A: Je account wordt beperkt tot read-only. Je kunt nog wel inloggen maar geen nieuwe conversaties starten.

**Q: Kan ik downgraden?**
A: Ja, via Stripe Customer Portal. Wijziging gaat in bij volgende factuurperiode.

**Q: Krijg ik refund bij annulering?**
A: Volgens Stripe-beleid, meestal geen refund maar toegang tot einde van betaalde periode.

### Technical

**Q: Kan ik een custom domain gebruiken?**
A: Ja, configureerbaar bij Enterprise plan.

**Q: Is er een API beschikbaar?**
A: Ja, volledige REST API beschikbaar. Documentatie in docs/API.md

**Q: Kan ik self-hosted draaien?**
A: Ja! Complete installatie instructies in README.md

**Q: Welk AI-model wordt gebruikt?**
A: OpenAI GPT-4o-mini voor cost-effectiviteit. GPT-4o beschikbaar als optie.

---

## Troubleshooting

### Inlogproblemen

**Probleem: Kan niet inloggen**

- ✅ Check of email en wachtwoord correct zijn
- ✅ Wachtwoord vergeten? Gebruik "Wachtwoord vergeten" link
- ✅ Clear browser cookies en cache
- ✅ Probeer incognito mode

**Probleem: Session verlopen**

- ✅ Log opnieuw in
- ✅ Sessions verlopen na 30 dagen inactiviteit

### Document problemen

**Probleem: Document blijft op PROCESSING staan**

- ✅ Wacht 5 minuten
- ✅ Refresh de pagina
- ✅ Als nog steeds stuck: verwijder en upload opnieuw
- ✅ Check bestandsformaat en grootte

**Probleem: Document upload faalt**

- ✅ Check of bestand kleiner is dan 10MB
- ✅ Check of format ondersteund is (PDF, DOCX, TXT, JPG, PNG)
- ✅ Probeer ander bestand
- ✅ Check internetconnectie

**Probleem: Tekst wordt niet correct geëxtraheerd**

- ✅ Voor PDFs: check of tekst selecteerbaar is (geen scan/image)
- ✅ Voor images: zorg voor goede kwaliteit
- ✅ Voor Word docs: gebruik .docx, niet .doc

### Chatbot problemen

**Probleem: Chatbot geeft geen goede antwoorden**

- ✅ Check of relevante documenten uploaded zijn
- ✅ Check of documenten status COMPLETED hebben
- ✅ Voeg meer FAQs toe voor specifieke vragen
- ✅ Verhoog aantal "context chunks" in instellingen
- ✅ Pas temperatuur aan (lager voor meer accurate antwoorden)

**Probleem: Chatbot is traag**

- ✅ Check internetconnectie
- ✅ Check OpenAI API status
- ✅ Grotere documenten kunnen langzamer zijn
- ✅ Probeer cache refresh

**Probleem: Chatbot toont geen bronnen**

- ✅ Check of "Show sources" aan staat in instellingen
- ✅ Check of er documenten zijn met relevante content
- ✅ Mogelijk geen relevante chunks gevonden (check embeddings)

### Widget problemen

**Probleem: Widget verschijnt niet op website**

- ✅ Check of embed code correct geplaatst is (voor `</body>`)
- ✅ Check browser console voor errors
- ✅ Check of domain toegevoegd is aan whitelist
- ✅ Check of assistant ID correct is
- ✅ Hard refresh (Ctrl+F5)

**Probleem: Widget laadt maar reageert niet**

- ✅ Check API key geldigheid
- ✅ Check rate limits
- ✅ Check browser console voor errors
- ✅ Test in andere browser

**Probleem: Styling conflicts**

- ✅ Widget gebruikt Shadow DOM (zou geen conflicts moeten geven)
- ✅ Check CSS !important rules op je website
- ✅ Pas custom CSS toe in widget instellingen

### Scraping problemen

**Probleem: Website scraping faalt**

- ✅ Check of URL geldig is en toegankelijk
- ✅ Sommige websites blokkeren scraping
- ✅ Check of website robots.txt scraping toestaat
- ✅ Probeer specifieke pagina URL i.p.v. homepage
- ✅ Check voor CORS-issues

**Probleem: Niet alle content wordt gescraped**

- ✅ JavaScript-rendered content is moeilijker
- ✅ Check of content in main content area zit
- ✅ Single Page Apps (SPA) kunnen problemen geven
- ✅ Probeer individuele pagina's handmatig toevoegen

### Performance problemen

**Probleem: Dashboard laadt traag**

- ✅ Veel conversaties? Filter op recente periode
- ✅ Clear browser cache
- ✅ Check internetsnelheid
- ✅ Te veel assistenten kan vertragen

**Probleem: Zoeken duurt lang**

- ✅ Grote documenten kunnen langer duren
- ✅ Veel embeddings = langere query tijd
- ✅ Check database performance (admin)

### Betaling problemen

**Probleem: Betaling wordt geweigerd**

- ✅ Check kaartgegevens
- ✅ Check saldo
- ✅ Check of internationale betalingen zijn toegestaan
- ✅ Probeer andere kaart
- ✅ Contact Stripe support

**Probleem: Abonnement niet geactiveerd na betaling**

- ✅ Webhook vertraging (wacht 5 minuten)
- ✅ Check email voor bevestiging
- ✅ Check Stripe dashboard
- ✅ Contact support met transactie ID

### Nog steeds problemen?

**Hulp nodig?**

1. Check de docs/ folder voor meer technische info
2. Open een GitHub issue met:
   - Duidelijke beschrijving van probleem
   - Screenshots
   - Browser/OS informatie
   - Stappen om te reproduceren
3. Contact developer team
4. Check de ontwikkelaarsdocumentatie in docs/

---

## Tips & Best Practices

### Content organisatie

- 📁 Groepeer gerelateerde documenten
- 🏷️ Gebruik duidelijke bestandsnamen
- 📝 Houd FAQs up-to-date
- 🔄 Update website scrapes regelmatig

### Chatbot optimalisatie

- 🎯 Begin met goede FAQs voor belangrijke vragen
- 📊 Monitor ratings en pas aan
- 🔍 Check welke vragen vaak gesteld worden
- 🎨 Test verschillende temperatuur settings
- 💬 Schrijf een duidelijke welkomstbericht

### Security

- 🔐 Gebruik sterke wachtwoorden
- 🌐 Activeer domain whitelisting
- 🚦 Stel rate limits in
- 👁️ Monitor logs regelmatig

### Performance

- ⚡ Upload alleen relevante documenten
- 🗑️ Verwijder oude/irrelevante content
- 📏 Houd documenten onder 5MB voor snelle verwerking
- 🔄 Clear cache periodiek

### Gebruikerservaring

- 🎨 Kies kleuren die passen bij je brand
- 💬 Schrijf vriendelijke fallback messages
- 🎯 Maak handige action buttons
- 📱 Test op mobiele apparaten
- 🌍 Support meerdere talen indien nodig

---

## Conclusie

Ainexo is een krachtig platform voor het creëren van intelligente, document-gestuurde chatbots. Met deze handleiding heb je alle tools en kennis om:

✅ Effectieve AI-assistenten te maken
✅ Je kennisbank optimaal te beheren
✅ Conversaties te monitoren en analyseren
✅ Het platform te integreren op je website
✅ Abonnementen en gebruikers te beheren (als SUPERUSER)

### Volgende stappen

1. **Begin klein**: Maak één assistent met een paar documenten
2. **Test grondig**: Stel verschillende vragen en check kwaliteit
3. **Itereer**: Voeg meer content toe, pas instellingen aan
4. **Monitor**: Kijk naar analytics en ratings
5. **Optimaliseer**: Blijf verbeteren op basis van feedback

### Hulp nodig?

- 📖 **Documentatie**: Bekijk de docs/ folder
- 🐛 **Issues**: Meld bugs op GitHub
- 💬 **Support**: Contact het development team
- 📧 **Email**: support@Ainexo.com (indien geconfigureerd)

---

**Veel succes met Ainexo! 🚀**

_Laatste update: Oktober 2025_
_Versie: 2.2.0_
