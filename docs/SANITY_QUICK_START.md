# 🚨 Sanity CMS Setup Required

Het lijkt erop dat je Sanity Studio probeert te openen zonder dat de configuratie compleet is.

## Probleem

De fout die je ziet betekent dat:
- ❌ Sanity project ID niet correct is ingesteld
- ❌ Of het Sanity project bestaat niet
- ❌ Of CORS is niet geconfigureerd

## Snelle Oplossing

### Optie 1: Gebruik Setup Script

```bash
./setup-sanity.sh
```

Dit script laat je zien wat je moet doen.

### Optie 2: Handmatige Setup

#### Stap 1: Maak Sanity Project aan

1. Ga naar [https://www.sanity.io/manage](https://www.sanity.io/manage)
2. Klik **"Create project"** (of login als je nog geen account hebt)
3. Vul in:
   - Project name: `AI Chat CMS` (of een eigen naam)
   - Dataset: `production`
4. Klik **"Create project"**
5. **Kopieer je Project ID** (bijv. `abc123xyz`)

#### Stap 2: Genereer API Token

1. In je Sanity project dashboard, ga naar **Settings → API**
2. Klik **"Add API token"**
3. Vul in:
   - Name: `Production API Token`
   - Permissions: **Editor** ⚠️ (belangrijk!)
4. Klik **"Create"**
5. **Kopieer de token** (je ziet hem maar 1 keer!)

#### Stap 3: Genereer Preview Secret

```bash
openssl rand -hex 32
```

Kopieer de output.

#### Stap 4: Update .env File

Maak een `.env` file in de root van je project (als die er nog niet is):

```bash
cp .env.example .env
```

Voeg deze regels toe aan `.env`:

```env
# Sanity CMS
NEXT_PUBLIC_SANITY_PROJECT_ID=jouw-project-id-hier
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=jouw-api-token-hier
SANITY_PREVIEW_SECRET=jouw-preview-secret-hier
```

**Vervang de placeholder waarden** met je echte waarden!

#### Stap 5: Configureer CORS

⚠️ **Dit is essentieel!** Anders krijg je netwerkfouten.

1. In Sanity dashboard: **Settings → API → CORS Origins**
2. Klik **"Add CORS origin"**
3. Vul in: `http://localhost:3000`
4. Check: ✅ **Allow credentials**
5. Klik **"Add"**

Voor productie voeg ook je productie URL toe (bijv. `https://yourdomain.com`)

#### Stap 6: Herstart Dev Server

```bash
# Stop huidige server (Ctrl+C)
npm run dev
```

#### Stap 7: Test Sanity Studio

Ga naar: [http://localhost:3000/studio](http://localhost:3000/studio)

Je zou nu moeten kunnen inloggen met je Sanity account! 🎉

## Veelvoorkomende Problemen

### "Request error while attempting to reach Sanity API"

**Oorzaak:** CORS niet geconfigureerd of verkeerd project ID

**Oplossing:**
1. Check je `.env` file - is `NEXT_PUBLIC_SANITY_PROJECT_ID` correct?
2. Check CORS settings in Sanity dashboard
3. Herstart dev server na .env wijzigingen

### "Authentication failed"

**Oorzaak:** API token heeft niet genoeg permissions

**Oplossing:**
1. Maak nieuwe token met **Editor** permissions (niet Viewer!)
2. Update `SANITY_API_TOKEN` in `.env`
3. Herstart dev server

### "Module not found" errors

**Oorzaak:** Sanity packages niet geïnstalleerd

**Oplossing:**
```bash
npm install
```

## Volgende Stappen

Na succesvolle setup kun je:

1. **Content aanmaken** in Sanity Studio (`/studio`)
2. **Pages maken** voor je website
3. **Blog posts schrijven**
4. **Preview mode gebruiken** voor drafts

Zie [docs/SANITY_SETUP.md](SANITY_SETUP.md) voor complete documentatie.

## Hulp Nodig?

- 📚 Sanity Docs: https://www.sanity.io/docs
- 💬 Sanity Community: https://www.sanity.io/help
- 📖 Volledige setup guide: `docs/SANITY_SETUP.md`
