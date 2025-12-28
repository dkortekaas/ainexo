# GDPR Compliance Guide

## Overview

This application implements GDPR (General Data Protection Regulation) compliance features to protect EU citizens' data rights. The implementation covers the key GDPR articles: Right to Data Portability (Article 20) and Right to Erasure (Article 17).

## Implemented Features

### 1. Data Export (Article 20 - Right to Data Portability)

**Endpoint**: `GET /api/users/[id]/export`

Allows users to download all their personal data in JSON format.

**Exported Data**:
- User profile (name, email, settings)
- Subscription information
- Connected OAuth accounts
- All AI assistants/chatbots
- All conversations and messages
- All uploaded documents
- Notifications
- Invitations
- Usage statistics

**Security**:
- Requires authentication
- Users can only export their own data
- Sensitive data excluded (passwords, 2FA secrets, API tokens)
- Audit log created for each export

**Usage**:
```bash
# Export user data
curl -H "Authorization: Bearer $TOKEN" \
  https://yourapp.com/api/users/user-id/export \
  -o user-data-export.json
```

### 2. Account Deletion (Article 17 - Right to Erasure)

**Endpoint**: `DELETE /api/users/[id]/delete-account`

Permanently deletes user account and all associated data.

**Deleted Data**:
- User account
- All chatbot settings/assistants
- All conversations and messages
- All notifications
- All invitations (sent and received)
- OAuth accounts
- Login sessions
- Subscription notifications
- Personal data in all related tables

**Security**:
- Requires authentication
- Requires explicit confirmation (`{"confirmation": "DELETE"}`)
- Users can only delete their own account
- Cancels Stripe subscription automatically
- Creates audit log before deletion
- Irreversible operation

**Usage**:
```bash
# Delete account
curl -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"confirmation": "DELETE", "reason": "optional reason"}' \
  https://yourapp.com/api/users/user-id/delete-account
```

### 3. Consent Management

**Endpoints**:
- `GET /api/users/[id]/consent` - View consent status
- `POST /api/users/[id]/consent` - Update consent

**Tracked Consent**:
- Privacy Policy acceptance (with version and timestamp)
- Terms of Service acceptance (with version and timestamp)
- Marketing emails consent (opt-in/opt-out)

**Database Fields** (added to `users` table):
```sql
privacyPolicyAccepted     BOOLEAN
privacyPolicyAcceptedAt   TIMESTAMP
privacyPolicyVersion      TEXT
termsAccepted             BOOLEAN
termsAcceptedAt           TIMESTAMP
termsVersion              TEXT
marketingEmailsConsent    BOOLEAN
marketingEmailsConsentAt  TIMESTAMP
```

**Usage**:
```javascript
// Update consent
await fetch('/api/users/user-id/consent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    privacyPolicy: { accepted: true, version: '1.0' },
    terms: { accepted: true, version: '1.0' },
    marketingEmails: true
  })
});
```

## Implementation Details

### Cascading Deletion Order

When a user account is deleted, data is removed in this order to respect foreign key constraints:

1. **Conversations** - Messages, sources, feedback
2. **Action Buttons** - UI elements for assistants
3. **Chatbot Settings** - AI assistants/chatbots
4. **Notifications** - User notifications
5. **Invitations** - Sent and received
6. **Subscription Notifications** - Expiry warnings
7. **OAuth Accounts** - Google, GitHub, etc.
8. **Sessions** - Login sessions
9. **User Account** - Finally delete the user

### Audit Logging

All GDPR operations are logged:

```typescript
// Data export log
{
  level: 'INFO',
  message: 'User data exported (GDPR Article 20)',
  context: {
    userId,
    requestedBy,
    dataSize,
    exportDuration
  }
}

// Account deletion log
{
  level: 'WARNING',
  message: 'User account deletion initiated (GDPR Article 17)',
  context: {
    deletedUserId,
    deletedUserEmail,
    deletedUserName,
    requestedBy,
    reason,
    accountAge
  }
}
```

### Stripe Integration

Account deletion automatically cancels active Stripe subscriptions:

```typescript
if (user.stripeSubscriptionId) {
  await stripe.subscriptions.cancel(user.stripeSubscriptionId);
}
```

## User Interface Integration

### Export Button Example

```tsx
async function exportMyData() {
  const response = await fetch(`/api/users/${userId}/export`);
  const blob = await response.blob();

  // Download file
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `user-data-export-${Date.now()}.json`;
  a.click();
}
```

### Delete Account Example

```tsx
async function deleteAccount() {
  const confirmed = window.confirm(
    'Are you sure? This action is irreversible!'
  );

  if (!confirmed) return;

  const response = await fetch(`/api/users/${userId}/delete-account`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      confirmation: 'DELETE',
      reason: 'User requested deletion'
    })
  });

  if (response.ok) {
    // Logout and redirect
    await signOut();
    window.location.href = '/';
  }
}
```

## Compliance Checklist

- [x] **Article 17**: Right to Erasure implemented
- [x] **Article 20**: Right to Data Portability implemented
- [x] **Consent Tracking**: Privacy policy & terms acceptance
- [x] **Audit Logging**: All GDPR operations logged
- [x] **Data Minimization**: Only collect necessary data
- [x] **Purpose Limitation**: Data used only for stated purposes
- [x] **Security**: Passwords hashed, 2FA optional, HTTPS enforced
- [ ] **Privacy Policy**: Must be written and published
- [ ] **Cookie Consent**: Must be implemented on website
- [ ] **Data Protection Officer**: Appoint if required (>250 employees)
- [ ] **Breach Notification**: Have procedures in place (72h)

## Privacy Policy Requirements

Your privacy policy must include:

1. **Data Controller**: Company name and contact
2. **Data Collected**: List all personal data collected
3. **Purpose**: Why data is collected
4. **Legal Basis**: Consent, contract, legitimate interest
5. **Storage Period**: How long data is kept
6. **User Rights**: Export, delete, modify, restrict, object
7. **Data Transfers**: If data leaves EU/EEA
8. **Security Measures**: How data is protected
9. **Contact**: How to exercise rights

## Cookie Consent

Recommended implementation:

```html
<!-- Use a library like react-cookie-consent -->
<CookieConsent
  location="bottom"
  buttonText="Accept"
  declineButtonText="Decline"
  cookieName="gdpr-consent"
  expires={365}
>
  We use cookies to enhance your experience.
  <a href="/privacy-policy">Privacy Policy</a>
</CookieConsent>
```

## Data Retention Policy

Define clear retention periods:

- **User Accounts**: Until deletion requested
- **Conversations**: Until deletion requested
- **Audit Logs**: 7 years (legal requirement)
- **Analytics**: Anonymized after 90 days
- **Backups**: 30 days, then permanently deleted

## GDPR Fines

Non-compliance can result in fines up to:
- €20 million OR
- 4% of annual global turnover

**Whichever is higher!**

## Best Practices

1. **Data Minimization**: Only ask for data you need
2. **Clear Consent**: Make opt-ins explicit and granular
3. **Easy Access**: Make data export/deletion easy to find
4. **Quick Response**: Respond to requests within 30 days
5. **Regular Audits**: Review compliance quarterly
6. **Staff Training**: Ensure team understands GDPR
7. **Vendor Compliance**: Ensure third-parties are GDPR compliant
8. **Incident Response**: Have breach notification plan

## Testing

### Test Data Export

```bash
# 1. Create test user
# 2. Add some data (assistants, conversations)
# 3. Export data
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/users/test-user-id/export

# 4. Verify JSON contains all expected data
```

### Test Account Deletion

```bash
# 1. Create test user
# 2. Add relationships (assistants, conversations)
# 3. Delete account
curl -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"confirmation": "DELETE"}' \
  http://localhost:3000/api/users/test-user-id/delete-account

# 4. Verify:
# - User deleted from database
# - All related data deleted
# - Audit log created
# - Stripe subscription canceled
```

## Related Documentation

- [Environment Validation](./ENVIRONMENT_VALIDATION.md)
- [Health Check](./HEALTH_CHECK.md)
- [Production Readiness](../PRODUCTION_READINESS.md)

---

**Last Updated**: November 3, 2025
**Maintained By**: Development Team
