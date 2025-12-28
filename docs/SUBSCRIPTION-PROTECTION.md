# Subscription Protection

## Overzicht

Het AI Chatbot Platform bevat een uitgebreid subscription protection systeem dat ervoor zorgt dat gebruikers met verlopen abonnementen geen toegang hebben tot premium features. Dit geldt voor zowel trial als reguliere abonnementen.

## Beschermde Features

### 🔒 Frontend (Admin Portal)

De volgende pagina's zijn beschermd tegen toegang door gebruikers met verlopen abonnementen:

1. **Assistent Bewerken** - `/assistants/[id]/edit`
2. **Knowledge Base Hoofdpagina** - `/knowledgebase`
3. **Bestand Details** - `/knowledgebase/files/[id]`
4. **Website Details** - `/knowledgebase/websites/[id]`
5. **Website Content** - `/knowledgebase/websites/[id]/content`

### 🔒 Backend (Widget API)

De volgende API endpoints controleren de subscription status:

1. **Chat Berichten** - `POST /api/chat/message`
2. **Widget Configuratie** - `GET /api/chatbot/public-config`

## Hoe het werkt

### Subscription Status Controle

Het systeem controleert op drie manieren of een subscription verlopen is:

```typescript
// 1. Trial verlopen
const isTrialExpired =
  user.subscriptionStatus === "TRIAL" &&
  user.trialEndDate &&
  new Date(user.trialEndDate) < now;

// 2. Regulier abonnement verlopen
const isSubscriptionExpired =
  user.subscriptionEndDate &&
  new Date(user.subscriptionEndDate) < now;

// 3. Inactieve status
const isInactiveStatus = ![
  "TRIAL",
  "ACTIVE"
].includes(user.subscriptionStatus);
```

### Frontend Protection: SubscriptionGuard Component

**Locatie:** `/components/guards/TrialGuard.tsx`

De `TrialGuard` component (nu eigenlijk een volledige Subscription Guard) controleert de subscription status via de `useSubscription()` hook en:

- **Bij verlopen subscription:** Redirect naar `/account?tab=subscription`
- **Tijdens laden:** Toont loading spinner met "Abonnement wordt gecontroleerd..."
- **Bij redirect:** Toont loading spinner met "Je wordt doorgestuurd naar de abonnementpagina..."

#### Gebruik

```tsx
import { TrialGuard } from "@/components/guards/TrialGuard";

export default function ProtectedPage() {
  return (
    <TrialGuard feature="assistant">
      {/* Pagina content hier */}
    </TrialGuard>
  );
}
```

#### Props

- `children: React.ReactNode` - De te beschermen content
- `feature?: "assistant" | "document" | "website"` - Optionele feature check voor specifieke rechten
- `redirectUrl?: string` - Aangepaste redirect URL (standaard: `/account?tab=subscription`)

#### Features

- **assistant** - Controleert `subscriptionStatus.canCreateAssistant`
- **document** - Controleert `subscriptionStatus.canCreateDocument`
- **website** - Controleert `subscriptionStatus.canCreateWebsite`

### Backend Protection: API Middleware

#### Chat Message Endpoint

**Locatie:** `/app/api/chat/message/route.ts`

Controleert subscription status van de chatbot eigenaar voordat berichten worden verwerkt.

**Response bij verlopen subscription:**
```json
{
  "success": false,
  "error": "Subscription expired. Please renew your subscription to continue using the chatbot."
}
```

**HTTP Status:** `403 Forbidden`

#### Public Config Endpoint

**Locatie:** `/app/api/chatbot/public-config/route.ts`

Controleert subscription status voordat widget configuratie wordt teruggegeven.

**Response bij verlopen subscription:**
```json
{
  "success": false,
  "error": "Subscription expired. Please renew your subscription to continue using the chatbot."
}
```

**HTTP Status:** `403 Forbidden`

## Subscription Statussen

Het systeem gebruikt de volgende subscription statussen (defined in Prisma schema):

```prisma
enum SubscriptionStatus {
  TRIAL              // Trial periode
  ACTIVE             // Actief abonnement ✅
  CANCELED           // Geannuleerd
  PAST_DUE           // Betaling achterstallig
  UNPAID             // Onbetaald
  INCOMPLETE         // Incomplete setup
  INCOMPLETE_EXPIRED // Incomplete en verlopen
  PAUSED             // Gepauzeerd
}
```

**Actieve statussen:** Alleen `TRIAL` en `ACTIVE` geven toegang tot features.

**Verlopen detectie:**
- **Trial:** Check `trialEndDate < now`
- **Regulier:** Check `subscriptionEndDate < now`
- **Status:** Check of status niet `TRIAL` of `ACTIVE` is

## Database Schema

### User Model

Relevante velden voor subscription tracking:

```prisma
model User {
  subscriptionStatus    SubscriptionStatus @default(TRIAL)
  subscriptionPlan      SubscriptionPlan?
  stripeCustomerId      String?            @unique
  stripeSubscriptionId  String?            @unique
  trialStartDate        DateTime?
  trialEndDate          DateTime?
  subscriptionStartDate DateTime?
  subscriptionEndDate   DateTime?
  subscriptionCancelAt  DateTime?
  subscriptionCanceled  Boolean            @default(false)
  isActive              Boolean            @default(true)
}
```

## User Experience

### Voor Gebruikers met Verlopen Abonnement

1. **Bij toegang tot beschermde pagina's:**
   - Automatische redirect naar subscription page
   - Duidelijke melding over verlopen subscription
   - Directe mogelijkheid tot upgraden

2. **Widget op website:**
   - Widget laadt niet meer
   - Bezoekers zien geen chatbot
   - API retourneert 403 error

### Voor Actieve Gebruikers

- Geen merkbare impact
- Normale toegang tot alle features
- Snelle redirect checks (cached subscription status)

## Security Considerations

### Frontend Protection

✅ **Voordelen:**
- Directe gebruikersfeedback
- Snelle redirects
- Goede UX

⚠️ **Beperkingen:**
- Kan omzeild worden via browser tools
- Puur client-side check

### Backend Protection

✅ **Voordelen:**
- Echt beveiligd
- Kan niet omzeild worden
- Widget volledig uitgeschakeld

✅ **Resultaat:**
- Combinatie van frontend + backend = Volledige bescherming

## Testing

### Frontend Protection Testen

1. **Setup test gebruiker:**
   ```sql
   UPDATE users
   SET subscription_status = 'TRIAL',
       trial_end_date = NOW() - INTERVAL '1 day'
   WHERE email = 'test@example.com';
   ```

2. **Test scenario's:**
   - [ ] Probeer assistent te bewerken → Redirect naar subscription page
   - [ ] Probeer knowledge base te openen → Redirect naar subscription page
   - [ ] Check loading states tijdens redirect

### Backend Protection Testen

1. **Setup test chatbot:**
   ```sql
   UPDATE users
   SET subscription_status = 'CANCELED',
       subscription_end_date = NOW() - INTERVAL '1 day'
   WHERE id = (
     SELECT user_id
     FROM chatbot_settings
     WHERE api_key = 'your-test-key'
   );
   ```

2. **Test scenario's:**
   - [ ] Probeer bericht te sturen → 403 error
   - [ ] Probeer config op te halen → 403 error
   - [ ] Widget laadt niet op website

## Troubleshooting

### "Wordt constant doorgestuurd naar subscription page"

**Oorzaken:**
- Subscription is daadwerkelijk verlopen
- `trialEndDate` of `subscriptionEndDate` in het verleden
- Status is niet `TRIAL` of `ACTIVE`

**Oplossing:**
```sql
-- Check huidige status
SELECT
  email,
  subscription_status,
  trial_end_date,
  subscription_end_date,
  is_active
FROM users
WHERE email = 'user@example.com';

-- Reset trial (development only)
UPDATE users
SET subscription_status = 'TRIAL',
    trial_end_date = NOW() + INTERVAL '14 days'
WHERE email = 'user@example.com';
```

### "Widget werkt niet meer"

**Check:**
1. Subscription status van chatbot eigenaar
2. API logs voor 403 errors
3. Browser console voor error messages

**Oplossing:**
```sql
-- Check chatbot eigenaar subscription
SELECT
  u.email,
  u.subscription_status,
  u.subscription_end_date,
  cs.api_key,
  cs.is_active
FROM chatbot_settings cs
JOIN users u ON u.id = cs.user_id
WHERE cs.api_key = 'your-api-key';
```

## Implementation Checklist

Bij toevoegen van nieuwe protected features:

- [ ] Wrap pagina in `<TrialGuard>` component
- [ ] Kies juiste `feature` prop
- [ ] Test met verlopen subscription
- [ ] Test loading states
- [ ] Update documentatie

Bij toevoegen van nieuwe API endpoints:

- [ ] Haal user subscription data op
- [ ] Voeg subscription checks toe
- [ ] Return 403 bij verlopen subscription
- [ ] Test met verlopen subscription
- [ ] Update API documentatie

## Migration Guide

### Van Trial-Only naar Full Subscription Protection

Als je een oudere versie hebt die alleen trial expiration checkte:

1. **Update imports:**
   ```typescript
   // Oude code bleef TrialGuard heten
   import { TrialGuard } from "@/components/guards/TrialGuard";
   ```

2. **Geen code changes nodig:**
   - Component API blijft hetzelfde
   - Automatisch uitgebreide checks

3. **Database update:**
   ```sql
   -- Zorg dat subscription_end_date correct is voor alle users
   UPDATE users
   SET subscription_end_date = trial_end_date
   WHERE subscription_status = 'TRIAL';
   ```

## Gerelateerde Documentatie

- [Database Schema](./DATABASE.md) - User model en subscription velden
- [API Endpoints](./API.md) - Widget API specificatie
- [Components](./COMPONENTS.md) - TrialGuard component details
- [Widget Documentatie](./WIDGET.md) - Widget setup en configuratie
