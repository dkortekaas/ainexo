# Sanity CMS Troubleshooting

## Fout: "Request error while attempting to reach Sanity API"

### Symptoom
```
Error: Request error while attempting to reach is https://[PROJECT_ID].api.sanity.io/v2021-06-07/users/me
```

### Oorzaken & Oplossingen

#### 1. CORS Niet Geconfigureerd ⚠️ (Meest Voorkomend)

**Hoe te checken:**
- Open browser DevTools (F12)
- Ga naar Console tab
- Zie je een CORS error?

**Oplossing:**
1. Ga naar https://www.sanity.io/manage
2. Klik op je project
3. Settings → API → CORS Origins
4. Klik "Add CORS origin"
5. Voeg toe: `http://localhost:3000`
6. ✅ Check "Allow credentials"
7. Klik "Add"

Voor productie voeg ook je productie URL toe.

#### 2. Verkeerde Project ID

**Hoe te checken:**
```bash
# Check je .env.local
cat .env.local | grep SANITY_PROJECT_ID
```

**Oplossing:**
- Ga naar https://www.sanity.io/manage
- Klik op je project
- Kopieer de Project ID van de URL of Settings
- Update `NEXT_PUBLIC_SANITY_PROJECT_ID` in `.env.local`
- Herstart dev server

#### 3. Environment Variables Niet Geladen

**Hoe te checken:**
- Herstart je dev server compleet
- Check of `.env.local` bestaat in de root

**Oplossing:**
```bash
# Stop server (Ctrl+C)
# Herstart
npm run dev
```

**Let op:** Next.js laadt environment variabelen alleen bij opstarten!

#### 4. API Token Permissions

**Hoe te checken:**
- Ga naar Sanity Dashboard → Settings → API → Tokens
- Check de permissions van je token

**Oplossing:**
Token moet **Editor** permissions hebben (niet Viewer!)

1. Maak nieuwe token:
   - Name: "Production API Token"
   - Permissions: **Editor**
2. Kopieer token
3. Update `SANITY_API_TOKEN` in `.env.local`
4. Herstart server

#### 5. Sanity Project Bestaat Niet

**Hoe te checken:**
Ga naar https://www.sanity.io/manage - zie je je project?

**Oplossing:**
Als je project niet bestaat:
1. Maak nieuw project: https://www.sanity.io/manage
2. Project name: "AI Chat CMS"
3. Dataset: "production"
4. Kopieer Project ID
5. Update `.env.local`

#### 6. Netwerk / Firewall Issues

**Hoe te checken:**
```bash
# Test of je Sanity API kunt bereiken
curl https://uenpf8gp.api.sanity.io/v2021-06-07/data/query/production
```

**Oplossing:**
- Check je internet connectie
- Check firewall settings
- Probeer VPN uit te zetten

## Andere Veelvoorkomende Problemen

### "Module not found: Can't resolve 'sanity'"

**Oorzaak:** Packages niet geïnstalleerd

**Oplossing:**
```bash
npm install
```

### Preview Mode Werkt Niet

**Oorzaak:** Preview secret niet ingesteld

**Oplossing:**
```bash
# Genereer secret
openssl rand -hex 32

# Voeg toe aan .env.local
echo "SANITY_PREVIEW_SECRET=jouw-secret-hier" >> .env.local

# Herstart server
```

### Content Wordt Niet Getoond

**Oorzaak:** Content niet gepubliceerd of scheduled

**Oplossing:**
1. Ga naar `/studio`
2. Open je document
3. Klik "Publish"
4. Of: verwijder "Published At" datum voor onmiddellijke publicatie

### Images Laden Niet

**Oorzaak:** CORS voor images

**Oplossing:**
Voeg ook je domain toe aan CORS voor image CDN:
- Settings → API → CORS
- Voeg toe: `http://localhost:3000`
- Check "Allow credentials"

## Debug Checklist

Werk deze checklist af:

- [ ] `.env.local` bestaat en heeft Sanity variabelen
- [ ] `NEXT_PUBLIC_SANITY_PROJECT_ID` is correct
- [ ] `NEXT_PUBLIC_SANITY_DATASET` = "production"
- [ ] `SANITY_API_TOKEN` heeft Editor permissions
- [ ] CORS is geconfigureerd voor `http://localhost:3000`
- [ ] "Allow credentials" is aangevinkt in CORS
- [ ] Dev server is herstart NA .env wijzigingen
- [ ] Browser cache is geleegd (Ctrl+Shift+R)

## Nog Steeds Problemen?

### 1. Check Browser Console

Open DevTools (F12) → Console tab
Kopieer de volledige error en check:
- CORS error?
- 401 Unauthorized?
- 404 Not Found?

### 2. Check Network Tab

DevTools (F12) → Network tab
- Filter op "sanity"
- Klik op failed requests
- Check Response tab voor foutmeldingen

### 3. Check Sanity Logs

https://www.sanity.io/manage → Je Project → Activity

### 4. Gebruik Sanity CLI

```bash
# Install Sanity CLI
npm install -g @sanity/cli

# Login
sanity login

# Check project
sanity projects list

# Deploy studio (als laatste redmiddel)
cd /path/to/project
sanity deploy
```

## Contact & Hulp

- 📚 Sanity Docs: https://www.sanity.io/docs
- 💬 Sanity Slack: https://slack.sanity.io
- 🐛 Sanity GitHub: https://github.com/sanity-io/sanity/issues
- 📧 Support: https://www.sanity.io/help

## Environment Variabelen Reference

Zorg dat je `.env.local` deze variabelen heeft:

```env
# Sanity CMS (Required)
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id-here
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your-api-token-with-editor-permissions
SANITY_PREVIEW_SECRET=your-preview-secret-min-32-chars
```

**Genereer secrets met:**
```bash
openssl rand -hex 32
```

**Check variabelen zijn geladen:**
```bash
# In Next.js, log in browser console:
console.log(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID)
```

Als dit `undefined` is, zijn de env vars niet geladen!
