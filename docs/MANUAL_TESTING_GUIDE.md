# Manual Testing Guide - Subscription Protection System

Step-by-step guide for manually testing all subscription protection features including email notifications, grace period, webhooks, and access control.

## Prerequisites

### Required Access
- ✅ Admin account in the application
- ✅ Database access (PostgreSQL)
- ✅ Access to email inbox (for notification testing)
- ✅ Ability to run cron jobs manually
- ✅ (Optional) Webhook receiver for testing webhooks

### Tools Needed
- Database client (TablePlus, pgAdmin, psql, etc.)
- API testing tool (Postman, Insomnia, curl, or browser DevTools)
- Email client
- (Optional) Local webhook receiver (webhook.site or ngrok)

---

## Setup Test Environment

### Step 1: Create Test Users

Execute this SQL to create test users with different subscription states:

```sql
-- See SQL_TEST_DATA.sql for complete test data setup
-- This creates 10 test users with various subscription states
```

### Step 2: Configure Environment Variables

Ensure `.env` contains:

```bash
# Email Configuration (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourapp.com

# Cron Secret
CRON_SECRET=your_secure_cron_secret

# Grace Period (optional, default: 3)
SUBSCRIPTION_GRACE_PERIOD_DAYS=3
```

### Step 3: Setup Webhook Receiver (Optional)

**Option A: Using webhook.site**
1. Go to https://webhook.site
2. Copy your unique URL
3. Use this URL when creating webhook configs

**Option B: Using ngrok for local testing**
```bash
# Terminal 1: Start local webhook receiver
node test-webhook-server.js

# Terminal 2: Expose local server
ngrok http 3001

# Use the ngrok URL (https://xxxx.ngrok.io) for webhook config
```

---

## Test Plan Execution

## Part 1: Email Notifications Testing

### Test 1.1: Trial Expiring - 7 Days Warning

**Setup:**
```sql
-- Create or update test user
UPDATE users
SET subscription_status = 'TRIAL',
    trial_end_date = CURRENT_TIMESTAMP + INTERVAL '7 days'
WHERE email = 'test-7days@example.com';

-- Clear any existing notifications
DELETE FROM subscription_notifications
WHERE user_id = (SELECT id FROM users WHERE email = 'test-7days@example.com');
```

**Test Steps:**
1. Open terminal or API client
2. Run cron job:
   ```bash
   curl -X POST http://localhost:3000/api/cron/subscription-notifications \
     -H "x-cron-secret: your_cron_secret"
   ```
3. Check response for stats:
   ```json
   {
     "success": true,
     "stats": {
       "checked": 1,
       "notified": 1,
       "byStatus": {
         "expiring7Days": 1
       }
     }
   }
   ```
4. Check email inbox for `test-7days@example.com`
5. Verify database record:
   ```sql
   SELECT * FROM subscription_notifications
   WHERE user_id = (SELECT id FROM users WHERE email = 'test-7days@example.com')
   ORDER BY sent_at DESC LIMIT 1;
   ```

**Expected Results:**
- ✅ Email received with subject: "Je proefperiode verloopt over 7 dagen"
- ✅ Email contains discount code: TRIAL10
- ✅ Email has "Upgrade nu" button
- ✅ Database record created with `notification_type = '7_days'`
- ✅ Cron response shows `expiring7Days: 1`

**Screenshot Checklist:**
- [ ] Email subject line
- [ ] Email body content
- [ ] Discount code visible
- [ ] Database record

---

### Test 1.2: Subscription Expiring - 3 Days Warning

**Setup:**
```sql
UPDATE users
SET subscription_status = 'ACTIVE',
    subscription_plan = 'PROFESSIONAL',
    subscription_end_date = CURRENT_TIMESTAMP + INTERVAL '3 days'
WHERE email = 'test-3days@example.com';

DELETE FROM subscription_notifications
WHERE user_id = (SELECT id FROM users WHERE email = 'test-3days@example.com');
```

**Test Steps:**
1. Run cron job
2. Check email for `test-3days@example.com`
3. Verify notification in database

**Expected Results:**
- ✅ Email received: "Je abonnement verloopt over 3 dagen"
- ✅ NO discount code (paid subscription, not trial)
- ✅ "Verlengen" button instead of "Upgrade"
- ✅ More urgent tone than 7-day email
- ✅ Database record: `notification_type = '3_days'`

---

### Test 1.3: Expired Today + Grace Period Start

**Setup:**
```sql
UPDATE users
SET subscription_status = 'TRIAL',
    trial_end_date = CURRENT_DATE  -- Expires today
WHERE email = 'test-today@example.com';

DELETE FROM subscription_notifications
WHERE user_id = (SELECT id FROM users WHERE email = 'test-today@example.com');
```

**Test Steps:**
1. Run cron job
2. Check email
3. Check webhooks triggered (see webhook section)
4. Verify database

**Expected Results:**
- ✅ Email: "Je proefperiode verloopt vandaag!"
- ✅ Email mentions grace period starting
- ✅ Database record: `notification_type = 'today'`
- ✅ Webhook triggered: `subscription.trial_expired`
- ✅ Webhook triggered: `subscription.grace_period_started`

---

### Test 1.4: Duplicate Prevention

**Setup:**
Use user from Test 1.1 (already has notification for today)

**Test Steps:**
1. Run cron job AGAIN (second time same day)
2. Check email inbox count
3. Check database records

**Expected Results:**
- ✅ NO second email sent
- ✅ Cron log shows: "Notification already sent today"
- ✅ Only ONE notification record for today:
   ```sql
   SELECT COUNT(*) FROM subscription_notifications
   WHERE user_id = (SELECT id FROM users WHERE email = 'test-7days@example.com')
     AND DATE(sent_at) = CURRENT_DATE;
   -- Should return: 1
   ```

---

## Part 2: Grace Period Testing

### Test 2.1: Grace Period - Day 1 (Access Still Allowed)

**Setup:**
```sql
UPDATE users
SET subscription_status = 'ACTIVE',
    subscription_end_date = CURRENT_TIMESTAMP - INTERVAL '1 day'  -- Expired yesterday
WHERE email = 'test-grace1@example.com';
```

**Test Steps:**
1. Get user session token (login as test-grace1@example.com)
2. Test API access:
   ```bash
   curl -X GET http://localhost:3000/api/subscriptions \
     -H "Cookie: your_session_cookie"
   ```
3. Check grace period in response
4. Try to use chatbot widget:
   ```bash
   curl -X POST http://localhost:3000/api/chat/message \
     -H "Content-Type: application/json" \
     -d '{"message": "Test", "assistantId": "xxx"}'
   ```

**Expected Results:**
- ✅ API returns grace period data:
   ```json
   {
     "user": {
       "gracePeriod": {
         "isInGracePeriod": true,
         "daysRemaining": 2,
         "endsAt": "2025-10-29T...",
         "message": "Je abonnement is verlopen...",
         "urgency": "warning"
       }
     }
   }
   ```
- ✅ Widget request succeeds (200 OK)
- ✅ Server logs show: "⚠️ Widget used during grace period: {userId}"

---

### Test 2.2: Grace Period - Last Day

**Setup:**
```sql
UPDATE users
SET subscription_end_date = CURRENT_TIMESTAMP - INTERVAL '2 days'  -- Expired 2 days ago
WHERE email = 'test-grace-last@example.com';
```

**Test Steps:**
1. Login as test-grace-last@example.com
2. Load dashboard page
3. Check grace period banner
4. Test widget access

**Expected Results:**
- ✅ Grace period: `daysRemaining: 0` (last day)
- ✅ `urgency: "critical"`
- ✅ Red banner displayed with animated pulse
- ✅ Message: "Dit is de laatste dag van je grace period!"
- ✅ Widget still works (200 OK)

**UI Verification:**
- [ ] Banner visible at top of page
- [ ] Red background color
- [ ] Animated pulse effect
- [ ] "Verlengen" button present
- [ ] Dismiss (X) button works

---

### Test 2.3: Grace Period Ended - Access Blocked

**Setup:**
```sql
UPDATE users
SET subscription_end_date = CURRENT_TIMESTAMP - INTERVAL '4 days'  -- Expired 4 days ago (grace period ended)
WHERE email = 'test-blocked@example.com';
```

**Test Steps:**
1. Login as test-blocked@example.com
2. Try to use widget:
   ```bash
   curl -X POST http://localhost:3000/api/chat/message \
     -H "Content-Type: application/json" \
     -d '{"message": "Test", "assistantId": "xxx"}'
   ```
3. Try to open assistant editor
4. Try to access knowledge base

**Expected Results:**
- ✅ Widget request returns **403 Forbidden**
- ✅ Error response:
   ```json
   {
     "success": false,
     "error": "Subscription expired. Please renew to continue using this feature.",
     "errorCode": "SUBSCRIPTION_EXPIRED",
     "redirectUrl": "/account/subscription"
   }
   ```
- ✅ Assistant editor: Redirected to subscription page
- ✅ Knowledge base: Access denied
- ✅ Grace period data shows:
   ```json
   {
     "isInGracePeriod": false,
     "shouldBlockAccess": true,
     "canAccessFeatures": false
   }
   ```

**UI Verification:**
- [ ] User automatically redirected to `/account/subscription`
- [ ] Error message: "Je abonnement is verlopen"
- [ ] Upgrade/renew options displayed

---

## Part 3: Subscription Widget Testing

### Test 3.1: Active Subscription - Full View

**Setup:**
```sql
UPDATE users
SET subscription_status = 'ACTIVE',
    subscription_plan = 'PROFESSIONAL',
    subscription_start_date = CURRENT_TIMESTAMP - INTERVAL '45 days',
    subscription_end_date = CURRENT_TIMESTAMP + INTERVAL '45 days'
WHERE email = 'test-active@example.com';
```

**Test Steps:**
1. Login as test-active@example.com
2. Navigate to dashboard
3. Render widget component (or view widget on page)
4. Inspect elements

**Expected Results:**
- ✅ Status badge: "Actief" (green)
- ✅ Days counter: "45 dagen resterend"
- ✅ Progress bar: ~50% filled
- ✅ Plan name: "PROFESSIONAL"
- ✅ End date displayed: [date 45 days from now]
- ✅ "Beheer Abonnement" button visible
- ✅ Green/success color scheme

**Screenshot Checklist:**
- [ ] Widget card
- [ ] Progress bar
- [ ] Status badge
- [ ] All text labels

---

### Test 3.2: Expiring Soon - Warning State

**Setup:**
```sql
UPDATE users
SET subscription_end_date = CURRENT_TIMESTAMP + INTERVAL '5 days'
WHERE email = 'test-expiring@example.com';
```

**Test Steps:**
1. Login and view widget
2. Check styling and colors

**Expected Results:**
- ✅ Status: "Verloopt Binnenkort" (yellow/orange)
- ✅ Days counter: "5 dagen resterend"
- ✅ Progress bar: ~95% filled
- ✅ Yellow/warning color scheme
- ✅ Alert icon displayed
- ✅ "Verlengen" button with urgent styling

---

### Test 3.3: Grace Period - Critical Warning

**Setup:**
```sql
UPDATE users
SET subscription_end_date = CURRENT_TIMESTAMP - INTERVAL '1 day'  -- In grace period
WHERE email = 'test-grace-widget@example.com';
```

**Test Steps:**
1. View widget
2. Check grace period display

**Expected Results:**
- ✅ Status: "Grace Period" (orange)
- ✅ Message: "Je grace period eindigt over 2 dagen"
- ✅ Orange/amber color scheme
- ✅ Progress bar: 100% (red zone)
- ✅ "Verlengen Nu" button prominent
- ✅ Urgency icon (clock/warning)

---

### Test 3.4: Expired - Error State

**Setup:**
```sql
UPDATE users
SET subscription_end_date = CURRENT_TIMESTAMP - INTERVAL '5 days'  -- Past grace period
WHERE email = 'test-expired-widget@example.com';
```

**Test Steps:**
1. View widget
2. Check error state

**Expected Results:**
- ✅ Status: "Verlopen" (red)
- ✅ Message: "Je abonnement is verlopen"
- ✅ Red error color scheme
- ✅ Progress bar full (red)
- ✅ "Upgrade Nu" button
- ✅ Warning about blocked features

---

### Test 3.5: Compact Mode

**Test Steps:**
1. Render widget with `compact={true}` prop
2. Or view widget in sidebar/header location

**Expected Results:**
- ✅ Smaller card size
- ✅ Single row layout
- ✅ Days remaining shown
- ✅ Status icon (no full badge)
- ✅ Single CTA button
- ✅ NO progress bar
- ✅ NO detailed stats

---

## Part 4: Webhook Testing

### Test 4.1: Create Webhook Configuration

**Test Steps:**
1. Login as admin
2. Create webhook via API:
   ```bash
   curl -X POST http://localhost:3000/api/webhooks \
     -H "Content-Type: application/json" \
     -H "Cookie: your_admin_session" \
     -d '{
       "url": "https://webhook.site/your-unique-url",
       "events": [
         "subscription.expired",
         "subscription.grace_period_started",
         "subscription.renewed"
       ],
       "description": "Test webhook"
     }'
   ```
3. Save response (contains secret - only shown once!)

**Expected Results:**
- ✅ Response 200 OK
- ✅ Webhook ID returned
- ✅ Secret returned (save this!)
- ✅ Database record created:
   ```sql
   SELECT * FROM webhook_configs ORDER BY created_at DESC LIMIT 1;
   ```

**Save This Information:**
```
Webhook ID: clx...
Webhook Secret: abc123...
Webhook URL: https://webhook.site/...
```

---

### Test 4.2: Test Webhook Endpoint

**Test Steps:**
1. Use webhook ID from Test 4.1
2. Send test webhook:
   ```bash
   curl -X POST http://localhost:3000/api/webhooks/{webhookId}/test \
     -H "Cookie: your_admin_session"
   ```
3. Check webhook receiver (webhook.site)
4. Verify headers and payload

**Expected Results:**
- ✅ Response: "Test webhook sent successfully"
- ✅ Webhook receiver shows incoming request
- ✅ Headers present:
   - `X-Webhook-Signature`: [hmac signature]
   - `X-Webhook-Timestamp`: [unix timestamp]
   - `X-Webhook-Event`: subscription.test
- ✅ Payload structure:
   ```json
   {
     "id": "wh_...",
     "event": "subscription.test",
     "timestamp": "2025-10-26T...",
     "data": {
       "user": { "id": "...", "email": "..." },
       "subscription": { ... }
     },
     "metadata": {
       "test": true,
       "testType": "manual"
     }
   }
   ```

---

### Test 4.3: Verify Webhook Signature

**Test Steps:**
1. Copy signature, timestamp, and payload from webhook receiver
2. Verify signature using this Node.js code:
   ```javascript
   const crypto = require('crypto');

   const payload = '{"id":"..."}'; // Full payload JSON
   const signature = 'abc123...'; // From X-Webhook-Signature header
   const timestamp = 1698345678; // From X-Webhook-Timestamp header
   const secret = 'your-webhook-secret'; // From creation step

   const data = `${timestamp}.${payload}`;
   const expectedSignature = crypto
     .createHmac('sha256', secret)
     .update(data)
     .digest('hex');

   console.log('Signature valid:', signature === expectedSignature);
   ```

**Expected Results:**
- ✅ `Signature valid: true`

---

### Test 4.4: Trigger Real Webhook Event

**Setup:**
```sql
-- Create test user that expires today
UPDATE users
SET subscription_status = 'TRIAL',
    trial_end_date = CURRENT_DATE
WHERE email = 'test-webhook-trigger@example.com';
```

**Test Steps:**
1. Run cron job:
   ```bash
   curl -X POST http://localhost:3000/api/cron/subscription-notifications \
     -H "x-cron-secret: your_cron_secret"
   ```
2. Check webhook receiver for incoming webhooks
3. Check database:
   ```sql
   SELECT * FROM webhook_deliveries
   WHERE webhook_config_id = '{webhookId}'
   ORDER BY created_at DESC LIMIT 2;
   ```
4. Check event logs:
   ```sql
   SELECT * FROM webhook_event_logs
   ORDER BY created_at DESC LIMIT 2;
   ```

**Expected Results:**
- ✅ 2 webhooks received:
  1. `subscription.trial_expired`
  2. `subscription.grace_period_started`
- ✅ Both webhook deliveries show `status: 'SUCCESS'`
- ✅ Both event logs show `triggered: true`
- ✅ Cron response shows `webhooksTriggered: 1` (count of users, not events)

---

### Test 4.5: Webhook Retry on Failure

**Setup:**
1. Create webhook pointing to invalid URL:
   ```bash
   curl -X POST http://localhost:3000/api/webhooks \
     -H "Content-Type: application/json" \
     -d '{
       "url": "http://localhost:9999/nonexistent",
       "events": ["subscription.expired"]
     }'
   ```

**Test Steps:**
1. Trigger subscription.expired event (run cron with expired user)
2. Wait ~40 seconds for retries to complete
3. Check delivery record:
   ```sql
   SELECT id, status, attempts, error, response_status
   FROM webhook_deliveries
   WHERE webhook_config_id = '{webhookId}'
   ORDER BY created_at DESC LIMIT 1;
   ```

**Expected Results:**
- ✅ Initial attempt fails immediately
- ✅ Retry 1 after 1 second
- ✅ Retry 2 after 5 seconds
- ✅ Retry 3 after 30 seconds
- ✅ Final status: `FAILED`
- ✅ `attempts: 4` (1 initial + 3 retries)
- ✅ Error message logged (connection refused or timeout)

---

### Test 4.6: Webhook Statistics Dashboard

**Test Steps:**
1. View webhook stats:
   ```bash
   curl -X GET http://localhost:3000/api/webhooks/stats?hours=24 \
     -H "Cookie: your_admin_session"
   ```

**Expected Results:**
```json
{
  "success": true,
  "health": {
    "status": "healthy",  // or "warning" / "critical"
    "recentSuccessRate": 95.5,
    "failedDeliveriesNeedingRetry": 2
  },
  "deliveries": {
    "total": 150,
    "successful": 140,
    "failed": 10,
    "successRate": 93.33,
    "recent": {
      "total": 20,
      "successful": 19,
      "successRate": 95.0
    }
  },
  "events": {
    "total": 150,
    "triggered": 145,
    "topTypes": [
      { "eventType": "subscription.expired", "count": 42 },
      { "eventType": "subscription.expiring", "count": 38 }
    ]
  }
}
```

---

## Part 5: Integration Testing

### Integration Test 5.1: Complete 10-Day Expiration Flow

This test simulates the entire expiration lifecycle by manually changing dates.

**Initial Setup:**
```sql
-- Day -7: Create user expiring in 7 days
UPDATE users
SET subscription_status = 'TRIAL',
    trial_end_date = CURRENT_TIMESTAMP + INTERVAL '7 days'
WHERE email = 'test-full-flow@example.com';

DELETE FROM subscription_notifications
WHERE user_id = (SELECT id FROM users WHERE email = 'test-full-flow@example.com');
```

**Day -7: Seven Days Before**
1. Run cron job
2. Expected: Email sent (7 days), webhook: `subscription.trial_expiring`
3. Widget shows yellow warning

**Day -3: Three Days Before**
```sql
UPDATE users
SET trial_end_date = CURRENT_TIMESTAMP + INTERVAL '3 days'
WHERE email = 'test-full-flow@example.com';
```
1. Run cron
2. Expected: Email (3 days), webhook triggered
3. Widget more urgent

**Day -1: One Day Before**
```sql
UPDATE users
SET trial_end_date = CURRENT_TIMESTAMP + INTERVAL '1 day'
WHERE email = 'test-full-flow@example.com';
```
1. Run cron
2. Expected: Email (1 day), webhook
3. Widget critical red

**Day 0: Expiration Day**
```sql
UPDATE users
SET trial_end_date = CURRENT_DATE
WHERE email = 'test-full-flow@example.com';
```
1. Run cron
2. Expected:
   - Email: "Expires today"
   - Webhook: `subscription.trial_expired`
   - Webhook: `subscription.grace_period_started`
   - Grace period begins
   - Widget shows grace period banner
   - Access STILL ALLOWED

**Day +1: First Day After (Grace Period Day 1)**
```sql
UPDATE users
SET trial_end_date = CURRENT_TIMESTAMP - INTERVAL '1 day'
WHERE email = 'test-full-flow@example.com';
```
1. Run cron
2. Expected:
   - Email: "Expired 1 day ago"
   - Widget: "2 days grace period remaining"
   - Red urgent banner
   - Access STILL ALLOWED

**Day +3: Last Day of Grace Period**
```sql
UPDATE users
SET trial_end_date = CURRENT_TIMESTAMP - INTERVAL '2 days'
WHERE email = 'test-full-flow@example.com';
```
1. Run cron
2. Expected:
   - Webhook: `subscription.grace_period_ending`
   - Widget: "Last day!"
   - Animated critical warning
   - Access STILL ALLOWED

**Day +4: Grace Period Ended**
```sql
UPDATE users
SET trial_end_date = CURRENT_TIMESTAMP - INTERVAL '4 days'
WHERE email = 'test-full-flow@example.com';
```
1. Test access:
   ```bash
   curl -X POST http://localhost:3000/api/chat/message \
     -d '{"message": "Test"}'
   ```
2. Expected:
   - Webhook: `subscription.grace_period_ended`
   - Access BLOCKED (403)
   - Widget returns error
   - Redirect to subscription page

**Verification Checklist:**
- [ ] 5 emails received total
- [ ] 6+ webhooks triggered
- [ ] 5 notification records in database
- [ ] Access allowed during grace period
- [ ] Access blocked after grace period
- [ ] All event logs created

---

### Integration Test 5.2: Renewal During Grace Period

**Setup:**
```sql
-- User in grace period
UPDATE users
SET trial_end_date = CURRENT_TIMESTAMP - INTERVAL '1 day'  -- Expired yesterday
WHERE email = 'test-renewal@example.com';
```

**Test Steps:**
1. Verify in grace period:
   ```bash
   curl http://localhost:3000/api/subscriptions
   # Check: isInGracePeriod: true
   ```
2. Simulate renewal (update subscription):
   ```sql
   UPDATE users
   SET subscription_status = 'ACTIVE',
       subscription_plan = 'PROFESSIONAL',
       subscription_start_date = CURRENT_TIMESTAMP,
       subscription_end_date = CURRENT_TIMESTAMP + INTERVAL '30 days',
       trial_end_date = NULL
   WHERE email = 'test-renewal@example.com';
   ```
3. Trigger renewal webhook manually (or via payment webhook):
   ```bash
   # Simulate Stripe/Mollie webhook calling your payment success endpoint
   ```
4. Check subscription status
5. Test access

**Expected Results:**
- ✅ Status changes: TRIAL → ACTIVE
- ✅ Grace period cleared: `isInGracePeriod: false`
- ✅ New end date: 30 days from now
- ✅ Full access restored
- ✅ Widget returns to green/normal state
- ✅ Banner disappears
- ✅ Webhook: `subscription.renewed` (or `subscription.activated`)

---

## Part 6: Edge Cases

### Edge Case 6.1: Timezone Consistency

**Test Steps:**
1. Create user with end date at midnight UTC:
   ```sql
   UPDATE users
   SET subscription_end_date = '2025-10-27 00:00:00 UTC'
   WHERE email = 'test-timezone@example.com';
   ```
2. Run cron at different times:
   - 11:00 PM UTC (1 hour before)
   - 00:00 AM UTC (exact time)
   - 01:00 AM UTC (1 hour after)

**Expected Results:**
- ✅ At 11:00 PM UTC: `daysRemaining: 0` (expires "today")
- ✅ At 00:00 AM UTC: Grace period starts
- ✅ All calculations use UTC consistently

---

### Edge Case 6.2: Null Subscription Dates

**Setup:**
```sql
UPDATE users
SET trial_end_date = NULL,
    subscription_end_date = NULL
WHERE email = 'test-null-dates@example.com';
```

**Test Steps:**
1. Call grace period check API
2. Try to use widget

**Expected Results:**
- ✅ No crashes/errors
- ✅ Grace period check returns safe defaults
- ✅ Widget shows "No active subscription"
- ✅ Access handled based on status field

---

## Summary Checklist

After completing all tests, verify:

### Emails ✅
- [ ] 7-day warning sent correctly
- [ ] 3-day warning sent correctly
- [ ] 1-day warning sent correctly
- [ ] Expiration day email sent
- [ ] Grace period email sent
- [ ] Duplicate prevention works
- [ ] Trial vs paid messaging correct

### Grace Period ✅
- [ ] Grace period starts on expiration
- [ ] Access allowed during grace period
- [ ] Access blocked after grace period
- [ ] Days remaining calculated correctly
- [ ] Urgency levels correct
- [ ] API responses include grace period data

### Webhooks ✅
- [ ] Webhook configs can be created
- [ ] Test webhooks work
- [ ] Signatures are valid
- [ ] Real events trigger webhooks
- [ ] Retries work on failures
- [ ] Statistics dashboard works
- [ ] Event logs created correctly

### Widget ✅
- [ ] Active subscription displays correctly
- [ ] Warning state (expiring soon) correct
- [ ] Grace period state correct
- [ ] Expired state correct
- [ ] Compact mode works
- [ ] Loading states work
- [ ] Error handling works

### Access Control ✅
- [ ] Active users have full access
- [ ] Trial users have full access
- [ ] Grace period users have access
- [ ] Expired users are blocked
- [ ] 403 errors returned correctly
- [ ] Redirects work properly

### Integration ✅
- [ ] Cron job processes multiple users
- [ ] Emails + webhooks work together
- [ ] Grace period + access control work together
- [ ] Renewal restores access
- [ ] All systems handle errors gracefully

---

## Troubleshooting

### Issue: Cron job returns 401 Unauthorized
**Solution:** Check `CRON_SECRET` in `.env` matches the header value

### Issue: Emails not sending
**Solution:** Verify Resend API key (`RESEND_API_KEY`) is valid and starts with `re_`. Also ensure the `RESEND_FROM_EMAIL` address is verified in your Resend domain.

### Issue: Webhooks show "Connection refused"
**Solution:** Ensure webhook URL is publicly accessible (not localhost without ngrok)

### Issue: Grace period always shows 3 days
**Solution:** Check `SUBSCRIPTION_GRACE_PERIOD_DAYS` env variable

### Issue: Database records not created
**Solution:** Run `npx prisma db push` to ensure schema is up to date

---

## Reporting Results

Document your test results using this template:

```markdown
# Test Execution Report

**Date:** 2025-10-26
**Tester:** [Your Name]
**Environment:** [Development/Staging/Production]

## Summary
- Tests Passed: X/Y
- Tests Failed: Z
- Critical Issues: N
- Minor Issues: M

## Failed Tests
1. Test ID: 1.1
   - Status: ❌ Failed
   - Issue: Email not received
   - Steps to Reproduce: [...]
   - Expected: [...]
   - Actual: [...]
   - Screenshot: [link]

## Notes
[Any additional observations]
```

---

**Test Duration Estimate:** 3-4 hours for complete manual test suite
