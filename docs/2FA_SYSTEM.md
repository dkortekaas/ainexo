# Two-Factor Authentication (2FA) Systeem

Uitgebreide documentatie voor het 2FA systeem in AI Chat met TOTP, backup codes, admin reset en email recovery.

## 📋 Inhoudsopgave

1. [Overzicht](#overzicht)
2. [Voor Gebruikers](#voor-gebruikers)
3. [Voor Admins](#voor-admins)
4. [Technische Implementatie](#technische-implementatie)
5. [API Endpoints](#api-endpoints)
6. [Recovery Opties](#recovery-opties)
7. [Beveiliging](#beveiliging)

---

## Overzicht

Het 2FA systeem biedt multi-layer beveiliging met verschillende recovery opties:

### ✅ **Beschikbare Features**

1. **TOTP Authenticatie** - Time-based One-Time Password via authenticator apps
2. **Backup Codes** - 10 eenmalige herstelcodes
3. **Email Recovery** - Tijdelijke herstelcode via email (laatste redmiddel)
4. **Admin Reset** - Admins kunnen 2FA resetten voor gebruikers in hun organisatie
5. **QR Code Setup** - Eenvoudige configuratie via QR-scan
6. **Trusted Devices** - Optie om apparaten te vertrouwen (voorbereiding)

---

## Voor Gebruikers

### 🔐 2FA Instellen

#### Stap 1: Navigeer naar 2FA Setup
- Ga naar **Account Settings** → **Security** → **Two-Factor Authentication**
- Klik op **"Enable 2FA"**

#### Stap 2: Scan QR Code
1. Open een authenticator app (Google Authenticator, Authy, Microsoft Authenticator, 1Password)
2. Scan de weergegeven QR code
3. **Alternatief**: Kopieer de secret code en voer deze handmatig in

**Ondersteunde Apps:**
- Google Authenticator (iOS/Android)
- Microsoft Authenticator (iOS/Android)
- Authy (iOS/Android/Desktop)
- 1Password
- Bitwarden
- LastPass Authenticator

#### Stap 3: Verificatie
1. Voer de 6-cijferige code in uit je authenticator app
2. De code ververst elke 30 seconden

#### Stap 4: Backup Codes Opslaan
1. **10 backup codes** worden getoond (1 keer!)
2. **Kopieer** ze naar een veilige locatie
3. **Download** ze als tekstbestand
4. Bewaar ze op een veilige plaats (password manager aanbevolen)

```
Voorbeeld backup codes:
A1B2C3D4
E5F6G7H8
I9J0K1L2
M3N4O5P6
Q7R8S9T0
U1V2W3X4
Y5Z6A7B8
C9D0E1F2
G3H4I5J6
K7L8M9N0
```

⚠️ **Belangrijk**:
- Elke backup code kan **maar 1 keer** gebruikt worden
- Bewaar ze op een **veilige plek**
- Deel ze **nooit** met anderen
- Print ze uit of bewaar digitaal in een password manager

---

### 🔓 Inloggen met 2FA

#### Optie 1: Authenticator App (Primair)
1. Log in met email en wachtwoord
2. Voer de 6-cijferige code in uit je authenticator app
3. De code ververst elke 30 seconden

#### Optie 2: Backup Code
1. Klik op **"Gebruik een backup code"**
2. Voer een van je 10 backup codes in
3. De code wordt eenmalig gebruikt en daarna ongeldig

#### Optie 3: Email Recovery (Laatste redmiddel)
Als je **geen toegang** hebt tot:
- ✗ Je authenticator app
- ✗ Je backup codes

Dan kun je:
1. Klik op **"Vraag een herstelcode per email aan"**
2. Je ontvangt een **8-karakter code** per email (bijv: `A1B2C3D4`)
3. De code is **15 minuten** geldig
4. Kan **1 keer** gebruikt worden
5. ⚠️ **Na gebruik wordt je 2FA gereset** - je moet het opnieuw instellen

**Waarschuwing**: Email recovery reset je volledige 2FA configuratie uit veiligheidsoverwegingen.

---

### ❓ Veelgestelde Vragen

**Q: Wat als ik mijn telefoon verlies?**
A: Gebruik je backup codes. Heb je die niet? Gebruik email recovery.

**Q: Kan ik 2FA uitschakelen?**
A: Ja, via Account Settings → Security → Disable 2FA (vereist je huidige 2FA code).

**Q: Hoeveel backup codes heb ik?**
A: Je krijgt 10 codes. Elke code kan 1 keer gebruikt worden. Je kunt nieuwe codes genereren in je settings.

**Q: Werkt 2FA op alle apparaten?**
A: Ja, je kunt inloggen op elk apparaat met je authenticator app of backup codes.

**Q: Wat gebeurt er na email recovery?**
A: Je 2FA wordt volledig gereset uit veiligheidsoverwegingen. Je moet het opnieuw instellen voor betere beveiliging.

---

## Voor Admins

### 👨‍💼 2FA Resetten voor Gebruikers

Admins kunnen 2FA resetten voor gebruikers **binnen hun eigen organisatie**.

#### Wanneer Resetten?

- Gebruiker heeft toegang verloren tot authenticator app
- Alle backup codes zijn opgebruikt
- Email recovery niet mogelijk (email adres niet toegankelijk)
- Gebruiker vergrendeld uit account

#### Hoe te Resetten?

**Via Users Management:**
1. Ga naar **Admin Panel** → **Users**
2. Vind de gebruiker
3. Klik op **"Reset 2FA"**
4. Bevestig de actie

**Via API:**
```bash
POST /api/users/{userId}/reset-2fa
Authorization: Bearer {admin_token}
```

#### Wat Gebeurt Er?

1. ✅ 2FA volledig uitgeschakeld voor gebruiker
2. ✅ Authenticator secret verwijderd
3. ✅ Alle backup codes verwijderd
4. ✅ Trusted devices verwijderd
5. ✅ Gebruiker krijgt notificatie
6. ✅ Security log aangemaakt
7. ⚠️ Gebruiker kan direct inloggen zonder 2FA
8. ⚠️ Gebruiker moet 2FA opnieuw instellen (aanbevolen)

#### Beperkingen

**Admins kunnen ALLEEN resetten voor:**
- ✅ Gebruikers in hun eigen organisatie (`companyId` match)
- ✅ Gebruikers met 2FA enabled

**Admins kunnen NIET resetten voor:**
- ✗ Gebruikers in andere organisaties
- ✗ Andere admins (security policy)
- ✗ Superusers

#### Security Audit Log

Elke 2FA reset wordt gelogd met:
- Timestamp
- Admin ID (wie reset heeft uitgevoerd)
- User ID (wiens 2FA gereset is)
- IP adres
- User agent
- Company ID

```sql
-- Voorbeeld audit log entry
SELECT * FROM security_audit_logs
WHERE event_type = 'admin_reset_2fa'
ORDER BY timestamp DESC;
```

#### Notificatie naar Gebruiker

De gebruiker ontvangt een notificatie:

```
🔐 2FA-instellingen gereset

Je 2FA-instellingen zijn gereset door een beheerder.
Je moet 2FA opnieuw instellen.
```

#### Best Practices voor Admins

1. **Verifieer de gebruiker** - Bevestig identiteit via alternatieve methode
2. **Documenteer de reden** - Noteer waarom reset nodig was
3. **Communiceer met gebruiker** - Laat gebruiker weten dat reset uitgevoerd is
4. **Moedig opnieuw instellen aan** - Gebruiker moet 2FA weer activeren

---

## Technische Implementatie

### 🏗️ Database Schema

```prisma
model User {
  id                    String    @id @default(cuid())
  email                 String    @unique
  password              String?

  // 2FA Fields
  twoFactorEnabled      Boolean   @default(false)
  twoFactorMethod       String?   // "totp"
  twoFactorSecret       String?   // Encrypted TOTP secret
  twoFactorBackupCodes  String?   // Encrypted backup codes (JSON array)
  twoFactorVerified     Boolean   @default(false)

  // Recovery Fields
  resetToken            String?   @unique    // For email recovery
  resetTokenExpiry      DateTime?            // 15 minute expiry
}
```

### 🔒 Encryptie

**TOTP Secret:**
- Encrypted met AES-256-GCM
- User ID als salt
- Opgeslagen in database

**Backup Codes:**
- Hashed met SHA-256
- Stored as JSON array
- Verified via hash comparison

**Email Recovery Code:**
- Generated: `crypto.randomBytes(4).toString('hex')` → 8 karakters
- Hashed with SHA-256 before storage
- 15 minute TTL

### 📱 TOTP Implementatie

```typescript
// Setup
const secret = authenticator.generateSecret();
const qrCode = await QRCode.toDataURL(otpauthURL);

// Verify
const isValid = authenticator.verify({
  token: userProvidedCode,
  secret: decryptedSecret,
});
```

**Parameters:**
- Algorithm: SHA1
- Digits: 6
- Period: 30 seconds
- Window: ±1 period (tolerance)

---

## API Endpoints

### 🔧 2FA Setup

#### POST `/api/auth/2fa/setup`
Genereert nieuwe TOTP secret en QR code.

**Request:**
```json
{
  // Requires authenticated session
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,...",
    "secret": "JBSWY3DPEHPK3PXP"
  }
}
```

---

#### POST `/api/auth/2fa/verify`
Verifieert TOTP code tijdens setup en activeert 2FA.

**Request:**
```json
{
  "token": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recoveryCodes": [
      "A1B2C3D4",
      "E5F6G7H8",
      ...
    ]
  }
}
```

---

### 🔓 Login Verificatie

#### POST `/api/auth/2fa/verify-login`
Verifieert 2FA code tijdens login.

**Request:**
```json
{
  "token": "123456",
  "email": "user@example.com",
  "companyId": "comp_123",
  "trustDevice": false,
  "isRecoveryCode": false,
  "isEmailRecovery": false
}
```

**Response:**
```json
{
  "success": true,
  "twoFactorAuthenticated": true,
  "needsReset2FA": false
}
```

---

### 📧 Email Recovery

#### POST `/api/auth/2fa/request-recovery`
Vraagt email recovery code aan.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Een herstelcode is verstuurd naar je email adres."
}
```

**Email Content:**
- 8-karakter code (bijv: `A1B2C3D4`)
- 15 minuten geldig
- Beveiligd met SHA-256 hash
- Gebruiker wordt gewaarschuwd over 2FA reset

---

### 👮 Admin Reset

#### POST `/api/users/{userId}/reset-2fa`
Admin reset 2FA voor gebruiker.

**Requires:**
- Admin role
- Same company as target user

**Response:**
```json
{
  "success": true,
  "message": "2FA-instellingen succesvol gereset"
}
```

**Side Effects:**
1. User 2FA disabled
2. Security log created
3. Notification sent to user
4. Trusted devices cleared

---

## Recovery Opties

### 🛟 Recovery Flowchart

```
Gebruiker kan niet inloggen met 2FA
              |
              v
    ┌─────────────────────┐
    │  Heb je toegang tot │
    │  authenticator app? │
    └─────────────────────┘
         YES │  │ NO
             │  │
             │  v
             │  ┌─────────────────────┐
             │  │ Heb je backup codes?│
             │  └─────────────────────┘
             │       YES │  │ NO
             │           │  │
             │           │  v
             │           │  ┌─────────────────────┐
             │           │  │ Toegang tot email?  │
             │           │  └─────────────────────┘
             │           │       YES │  │ NO
             │           │           │  │
             v           v           v  v
        ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
        │ Login  │  │ Login  │  │ Email  │  │Contact │
        │met TOTP│  │met code│  │recovery│  │ Admin  │
        └────────┘  └────────┘  └────────┘  └────────┘
             │           │           │           │
             v           v           v           v
        ┌────────────────────────────────────────────┐
        │          Succesvol ingelogd                │
        └────────────────────────────────────────────┘
                             │
                             v
                    ┌─────────────────┐
                    │ Email recovery  │
                    │   gebruikt?     │
                    └─────────────────┘
                         YES │  │ NO
                             │  │
                             │  v
                             │  ┌──────────┐
                             │  │  Klaar   │
                             │  └──────────┘
                             v
                    ┌─────────────────┐
                    │ 2FA is gereset  │
                    │ Stel opnieuw in │
                    └─────────────────┘
```

---

## Beveiliging

### 🔐 Security Features

#### Rate Limiting
```typescript
// Max 5 failed 2FA attempts per 15 minuten
const isRateLimited = await checkRateLimit(
  userId,
  "2fa_login_failed",
  15, // minutes
  5   // max attempts
);
```

#### Brute Force Protection
- Failed attempts logged
- IP address tracking
- Temporary lockout na 5 mislukte pogingen
- Security events logged

#### Encryption Standards
- **TOTP Secret**: AES-256-GCM
- **Backup Codes**: SHA-256 hash
- **Email Recovery**: SHA-256 hash
- **Database**: Encrypted at rest

#### Session Security
- 2FA status in JWT token
- Session invalidated after 2FA reset
- Separate 2FA verification step
- No 2FA bypass possible

### 🚨 Security Events

Gelogd in `security_audit_logs`:

| Event Type | Description |
|------------|-------------|
| `2fa_setup_success` | User completed 2FA setup |
| `2fa_login_success` | Successful 2FA verification |
| `2fa_login_failed` | Failed 2FA verification |
| `2fa_rate_limited` | Too many failed attempts |
| `admin_reset_2fa` | Admin reset user's 2FA |
| `2fa_recovery_used` | Backup code used |
| `2fa_email_recovery` | Email recovery code requested |

### 📊 Monitoring

**Metrics to Track:**
- 2FA adoption rate
- Failed verification attempts
- Email recovery usage
- Admin resets frequency
- Average recovery codes remaining

**SQL Queries:**
```sql
-- 2FA Adoption Rate
SELECT
  COUNT(CASE WHEN two_factor_enabled THEN 1 END) * 100.0 / COUNT(*) as adoption_rate
FROM users;

-- Recent Failed Attempts
SELECT user_id, COUNT(*) as failed_attempts
FROM security_audit_logs
WHERE event_type = '2fa_login_failed'
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY user_id
ORDER BY failed_attempts DESC;

-- Email Recovery Usage (last 30 days)
SELECT COUNT(*) as email_recoveries
FROM security_audit_logs
WHERE event_type = '2fa_email_recovery'
  AND timestamp > NOW() - INTERVAL '30 days';
```

---

## Troubleshooting

### ❌ Veelvoorkomende Problemen

#### "Invalid verification code"
**Oplossingen:**
1. Check tijd synchronisatie op apparaat
2. Wacht tot nieuwe code (30 sec)
3. Probeer vorige OF volgende code
4. Gebruik backup code
5. Email recovery

#### "Rate limit exceeded"
**Oplossing:**
- Wacht 15 minuten
- Gebruik backup code
- Contact admin

#### "No recovery codes available"
**Oplossing:**
- Use email recovery
- Contact admin voor 2FA reset

#### "Recovery code expired" (Email)
**Oplossing:**
- Code geldig voor 15 minuten
- Vraag nieuwe code aan
- Check spam folder

#### QR Code scant niet
**Oplossingen:**
1. Kopieer secret code handmatig
2. Zorg voor voldoende licht
3. Gebruik andere camera
4. Zoom in/uit

---

## Development & Testing

### 🧪 Test Scenarios

```bash
# Test 2FA Setup
1. Enable 2FA
2. Scan QR code
3. Verify TOTP code
4. Save backup codes

# Test Login
1. Login met TOTP
2. Login met backup code
3. Login met email recovery

# Test Admin Reset
1. Admin reset user 2FA
2. Check notification sent
3. Check security log
4. User can login without 2FA
```

### 🛠️ Local Development

```bash
# Install dependencies
npm install otplib qrcode

# Environment variables
NEXTAUTH_SECRET=your-secret
DATABASE_URL=your-db-url

# Run tests
npm test -- 2fa

# Check 2FA status
curl http://localhost:3000/api/auth/2fa/status \
  -H "Authorization: Bearer {token}"
```

---

## Changelog

### v1.0.0 - Initial Implementation
- ✅ TOTP authentication
- ✅ QR code setup
- ✅ Backup codes (10)
- ✅ Admin reset functionality
- ✅ Email recovery flow
- ✅ Security audit logging
- ✅ Rate limiting
- ✅ User notifications

### Planned Features
- 🔜 Trusted devices (30-day trust)
- 🔜 SMS recovery (optional)
- 🔜 Hardware key support (YubiKey)
- 🔜 Backup code regeneration
- 🔜 2FA enforcement per organization

---

## Support

**Voor gebruikers:**
- Help Center: /help
- Email: support@aichat.com

**Voor admins:**
- Admin documentatie: /docs/admin
- API documentatie: /docs/api

**Voor developers:**
- GitHub: github.com/yourorg/ai-chat
- API Reference: /docs/api/2fa

---

**Laatste update:** 2025-10-26
**Versie:** 1.0.0
