# Stripe Configuratie Guide

## Probleem

Je krijgt deze error bij het upgraden van een subscription:

```
Error: Invalid API Key provided: STRIPE_S***...
```

Dit betekent dat je Stripe API keys nog niet (correct) zijn ingesteld.

## Oplossing: Stap voor stap

### Stap 1: Stripe Account Aanmaken

1. Ga naar [stripe.com](https://stripe.com) en maak een account aan
2. Verifieer je email adres
3. Je begint automatisch in **test mode** (aanbevolen voor development)

### Stap 2: API Keys Verkrijgen

1. Ga naar [Stripe Dashboard → Developers → API Keys](https://dashboard.stripe.com/test/apikeys)
2. Je ziet twee types keys:

   **Publishable key** (begint met `pk_test_`):
   - Mag publiek zijn (in frontend code)
   - Gebruikt voor Stripe Checkout UI

   **Secret key** (begint met `sk_test_`):
   - **MOET GEHEIM BLIJVEN!**
   - Gebruikt voor server-side API calls
   - Nooit committen naar Git!

3. Klik op "Reveal test key" om je secret key te zien
4. Kopieer beide keys

### Stap 3: Producten en Prijzen Aanmaken in Stripe

Voor elke subscription tier moet je een product met prijzen aanmaken:

#### 3.1 Starter Plan

1. Ga naar [Products](https://dashboard.stripe.com/test/products)
2. Klik "Add product"
3. Vul in:
   - **Name**: Starter Plan
   - **Description**: Voor kleine teams
   - **Pricing model**: Recurring
   - **Price**: €29/month (of je gewenste prijs)
   - **Billing period**: Monthly
4. Klik "Save product"
5. **Kopieer de Price ID** (begint met `price_...`)

#### 3.2 Professional Plan

Herhaal bovenstaande stappen met:

- **Name**: Professional Plan
- **Price**: €79/month

#### 3.3 Business Plan

- **Name**: Business Plan
- **Price**: €149/month

#### 3.4 Enterprise Plan

- **Name**: Enterprise Plan
- **Price**: €299/month (of "Contact us" voor custom pricing)

### Stap 4: Webhook Instellen (Optioneel maar aanbevolen)

1. Ga naar [Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Klik "Add endpoint"
3. Vul in:
   - **Endpoint URL**: `https://jouwdomain.com/api/webhooks/stripe`
   - **Events to send**: Selecteer:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
4. Klik "Add endpoint"
5. **Kopieer de Webhook signing secret** (begint met `whsec_...`)

### Stap 5: .env.local File Maken

1. Kopieer `.env.example` naar `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

2. Vul de Stripe configuratie in:

```bash
# Stripe (Payment)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51ABC...xyz
STRIPE_SECRET_KEY=sk_test_51DEF...xyz
STRIPE_WEBHOOK_SECRET=whsec_GHI...xyz

# Stripe Price IDs (Required for subscriptions)
STRIPE_STARTER_PRICE_ID=price_1ABC123...
STRIPE_PROFESSIONAL_PRICE_ID=price_1DEF456...
STRIPE_ENTERPRISE_PRICE_ID=price_1JKL012...
```

### Stap 6: Server Herstarten

```bash
# Stop de development server (Ctrl+C)
# Start opnieuw
npm run dev
```

### Stap 7: Testen

1. Ga naar `/account` in je applicatie
2. Klik op "Upgrade" bij een plan
3. Je wordt doorgestuurd naar Stripe Checkout
4. Gebruik een [Stripe test card](https://stripe.com/docs/testing):
   - **Card number**: `4242 4242 4242 4242`
   - **Expiry**: Any future date (bijv. 12/34)
   - **CVC**: Any 3 digits (bijv. 123)
   - **ZIP**: Any 5 digits (bijv. 12345)

## Veelvoorkomende Problemen

### ❌ "Invalid API Key"

**Oorzaak**: De API key is niet correct gekopieerd of ontbreekt
**Oplossing**:

- Check dat je de **Secret Key** hebt gebruikt (niet Publishable Key)
- Verwijder eventuele spaties voor/na de key
- Controleer dat je in test mode bent en `sk_test_` gebruikt

### ❌ "Plan not configured"

**Oorzaak**: Price IDs ontbreken in .env.local
**Oplossing**: Voeg alle 4 price IDs toe zoals in Stap 5

### ❌ "No such price"

**Oorzaak**: Price ID bestaat niet in Stripe
**Oplossing**: Check dat je de juiste Price IDs hebt gekopieerd uit Stripe Dashboard

### ❌ Test payment werkt niet

**Oorzaak**: Je gebruikt een echte creditcard in test mode
**Oplossing**: Gebruik alleen [Stripe test cards](https://stripe.com/docs/testing)

## Test Mode vs Live Mode

### Test Mode (Development)

- Keys beginnen met `pk_test_` en `sk_test_`
- Geen echte betalingen
- Gebruik test cards
- Gratis te gebruiken

### Live Mode (Production)

⚠️ **Gebruik dit pas als je app productie-ready is!**

1. Activeer je account in Stripe Dashboard
2. Maak nieuwe producten aan in **live mode**
3. Gebruik keys die beginnen met `pk_live_` en `sk_live_`
4. Echte betalingen worden verwerkt
5. Stripe rekent transactiekosten (2.9% + €0.25 per transactie in Europa)

## Beveiliging Checklist

✅ Gebruik altijd `.env.local` voor lokale development
✅ Voeg `.env.local` toe aan `.gitignore` (is al gedaan)
✅ Gebruik test mode tijdens development
✅ Nooit secret keys committen naar Git
✅ Gebruik environment variables in production (Vercel, Railway, etc.)
✅ Roteer keys als ze gelekt zijn
✅ Gebruik webhook secrets voor productie

## Handige Links

- [Stripe Dashboard](https://dashboard.stripe.com)
- [API Keys](https://dashboard.stripe.com/test/apikeys)
- [Products](https://dashboard.stripe.com/test/products)
- [Webhooks](https://dashboard.stripe.com/test/webhooks)
- [Test Cards](https://stripe.com/docs/testing)
- [Stripe Documentation](https://stripe.com/docs)

## Hulp Nodig?

- Stripe Support: [support.stripe.com](https://support.stripe.com)
- Stripe Discord: [stripe.com/discord](https://stripe.com/discord)

---

**Updated:** 2025-10-27
