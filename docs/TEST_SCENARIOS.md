# Test Scenarios - Subscription Protection System

Comprehensive test scenarios for all subscription protection features including email notifications, grace period, webhooks, and access control.

## Table of Contents

1. [Email Notifications](#email-notifications)
2. [Grace Period System](#grace-period-system)
3. [Subscription Dashboard Widget](#subscription-dashboard-widget)
4. [Webhook Notifications](#webhook-notifications)
5. [Subscription Access Control](#subscription-access-control)
6. [Integration Scenarios](#integration-scenarios)
7. [Edge Cases](#edge-cases)

---

## Email Notifications

### Test Scenario EN-01: Trial Expiring - 7 Days Warning
**Preconditions:**
- User has active trial subscription
- Trial end date is exactly 7 days from now
- No notification sent today for this user

**Test Steps:**
1. Run cron job: `POST /api/cron/subscription-notifications`
2. Check email sent to user
3. Check database for notification record

**Expected Results:**
- ✅ Email sent with subject: "Je proefperiode verloopt over 7 dagen"
- ✅ Email contains 7 days remaining message
- ✅ Email contains upgrade CTA with discount code TRIAL10
- ✅ Record created in `subscription_notifications` table with type "7_days"
- ✅ Cron job response includes stats: `byStatus.expiring7Days: 1`

**SQL Verification:**
```sql
-- Check notification was recorded
SELECT * FROM subscription_notifications
WHERE user_id = '{userId}'
  AND notification_type = '7_days'
  AND DATE(sent_at) = CURRENT_DATE;

-- Check user trial status
SELECT id, email, subscription_status, trial_end_date,
  EXTRACT(DAY FROM (trial_end_date - CURRENT_TIMESTAMP)) as days_remaining
FROM users
WHERE id = '{userId}';
```

---

### Test Scenario EN-02: Trial Expiring - 3 Days Warning
**Preconditions:**
- User has active trial subscription
- Trial end date is exactly 3 days from now
- No notification sent today

**Test Steps:**
1. Run cron job
2. Verify email delivery
3. Check notification record

**Expected Results:**
- ✅ Email sent with subject: "Je proefperiode verloopt over 3 dagen"
- ✅ More urgent tone in email
- ✅ Record with type "3_days" in database
- ✅ Stats: `byStatus.expiring3Days: 1`

---

### Test Scenario EN-03: Trial Expiring - 1 Day Warning
**Preconditions:**
- User has active trial
- Trial end date is tomorrow

**Test Steps:**
1. Run cron job
2. Verify email

**Expected Results:**
- ✅ Email sent with subject: "Je proefperiode verloopt over 1 dag"
- ✅ Critical urgency in message
- ✅ Record with type "1_day"

---

### Test Scenario EN-04: Trial Expired Today
**Preconditions:**
- User has trial subscription
- Trial end date is today (0 days remaining)

**Test Steps:**
1. Run cron job
2. Verify email sent

**Expected Results:**
- ✅ Email sent with subject: "Je proefperiode verloopt vandaag!"
- ✅ Mention of grace period starting
- ✅ Record with type "today"
- ✅ Webhook triggered: `subscription.trial_expired`
- ✅ Webhook triggered: `subscription.grace_period_started`

---

### Test Scenario EN-05: Trial Expired - 1 Day After (Grace Period)
**Preconditions:**
- User trial expired yesterday
- User in grace period

**Test Steps:**
1. Run cron job
2. Verify email

**Expected Results:**
- ✅ Email sent with expired subject
- ✅ Message mentions grace period remaining
- ✅ Record with type "expired_1_day"
- ✅ Stats: `byStatus.expired1Day: 1`

---

### Test Scenario EN-06: Paid Subscription Expiring - 7 Days
**Preconditions:**
- User has ACTIVE subscription (not trial)
- Subscription end date is 7 days from now

**Test Steps:**
1. Run cron job
2. Verify email

**Expected Results:**
- ✅ Email sent with "Je abonnement verloopt over 7 dagen"
- ✅ NO discount code (only for trials)
- ✅ Renewal CTA instead of upgrade
- ✅ Record with type "7_days"

---

### Test Scenario EN-07: Duplicate Prevention
**Preconditions:**
- User already received notification today for 3 days warning
- Cron job runs again

**Test Steps:**
1. Run cron job first time → email sent
2. Run cron job again (same day)
3. Check email count

**Expected Results:**
- ✅ First run: Email sent, record created
- ✅ Second run: No email sent (log shows "Notification already sent today")
- ✅ Only one record in database for today

**SQL Verification:**
```sql
SELECT COUNT(*) as notification_count
FROM subscription_notifications
WHERE user_id = '{userId}'
  AND notification_type = '3_days'
  AND DATE(sent_at) = CURRENT_DATE;
-- Should return 1, not 2
```

---

### Test Scenario EN-08: Multiple Users - Batch Processing
**Preconditions:**
- User A: Trial expires in 7 days
- User B: Trial expires in 3 days
- User C: Subscription expires in 1 day
- User D: Has 20 days remaining (no notification)

**Test Steps:**
1. Run cron job
2. Check stats response

**Expected Results:**
```json
{
  "stats": {
    "checked": 4,
    "notified": 3,
    "errors": 0,
    "byStatus": {
      "expiring7Days": 1,
      "expiring3Days": 1,
      "expiring1Day": 1,
      "expiringToday": 0,
      "expired1Day": 0
    }
  }
}
```

---

### Test Scenario EN-09: Email Delivery Failure
**Preconditions:**
- User has invalid email or email service is down
- Trial expires in 3 days

**Test Steps:**
1. Run cron job
2. Check logs and stats

**Expected Results:**
- ✅ Error logged for specific user
- ✅ Stats: `errors: 1`
- ✅ Other users still processed successfully
- ✅ Cron job completes (doesn't crash)

---

## Grace Period System

### Test Scenario GP-01: Grace Period Start
**Preconditions:**
- User trial/subscription expires today
- SUBSCRIPTION_GRACE_PERIOD_DAYS=3

**Test Steps:**
1. Call `checkGracePeriod()` function
2. Verify return values

**Expected Results:**
```javascript
{
  isExpired: true,
  isInGracePeriod: true,
  daysInGracePeriod: 0,
  daysRemainingInGrace: 3,
  gracePeriodEndsAt: Date, // 3 days from now
  shouldBlockAccess: false, // Still allowed
  canAccessFeatures: true,
  message: "Je abonnement is verlopen...",
  urgency: "warning"
}
```

---

### Test Scenario GP-02: Grace Period Mid-Point (Day 2)
**Preconditions:**
- Subscription expired 2 days ago
- Grace period: 3 days

**Test Steps:**
1. Call `checkGracePeriod()`
2. Check API response

**Expected Results:**
```javascript
{
  isExpired: true,
  isInGracePeriod: true,
  daysInGracePeriod: 2,
  daysRemainingInGrace: 1,
  shouldBlockAccess: false,
  urgency: "critical"
}
```

---

### Test Scenario GP-03: Grace Period Last Day
**Preconditions:**
- Expired 2 days ago
- Today is last day of grace period

**Test Steps:**
1. Check grace period status
2. Try to use chatbot widget
3. Check UI banner

**Expected Results:**
- ✅ `isInGracePeriod: true`
- ✅ `daysRemainingInGrace: 0`
- ✅ `shouldBlockAccess: false` (still allowed today)
- ✅ `urgency: "critical"`
- ✅ Widget still works
- ✅ Red banner displayed with animated pulse
- ✅ Message: "Laatste dag van grace period"

---

### Test Scenario GP-04: Grace Period Ended
**Preconditions:**
- Subscription expired 3 days ago
- Grace period was 3 days

**Test Steps:**
1. Check grace period status
2. Try to access chatbot widget
3. Try to open knowledge base

**Expected Results:**
- ✅ `isInGracePeriod: false`
- ✅ `shouldBlockAccess: true`
- ✅ `canAccessFeatures: false`
- ✅ Widget request returns 403 error
- ✅ User redirected to subscription page
- ✅ Knowledge base blocked

**API Response:**
```json
{
  "success": false,
  "error": "Subscription expired. Please renew to continue using this feature.",
  "redirectUrl": "/account/subscription"
}
```

---

### Test Scenario GP-05: Grace Period Banner Display
**Preconditions:**
- User in grace period (1 day remaining)

**Test Steps:**
1. Load any page with GracePeriodBanner component
2. Check banner appearance

**Expected Results:**
- ✅ Banner visible at top of page
- ✅ Red background (critical urgency)
- ✅ Animated pulse effect
- ✅ Message: "Je grace period eindigt over 1 dag"
- ✅ "Verlengen" button visible
- ✅ Dismiss (X) button works
- ✅ Banner re-appears on page reload if not permanently dismissed

---

### Test Scenario GP-06: API Response During Grace Period
**Preconditions:**
- User in grace period

**Test Steps:**
1. Call `GET /api/subscriptions`
2. Check response structure

**Expected Results:**
```json
{
  "user": {
    "id": "...",
    "subscriptionStatus": "TRIAL",
    "gracePeriod": {
      "isInGracePeriod": true,
      "daysRemaining": 2,
      "endsAt": "2025-10-29T00:00:00.000Z",
      "message": "Je proefperiode is verlopen...",
      "urgency": "warning"
    }
  }
}
```

---

### Test Scenario GP-07: Widget Access During Grace Period
**Preconditions:**
- User in grace period (day 1)

**Test Steps:**
1. POST to `/api/chat/message` (widget endpoint)
2. Check response and logs

**Expected Results:**
- ✅ Request succeeds (200 OK)
- ✅ Widget functions normally
- ✅ Log entry: "⚠️ Widget used during grace period: {userId}"
- ✅ Response includes message

---

### Test Scenario GP-08: Configurable Grace Period
**Preconditions:**
- Environment variable: `SUBSCRIPTION_GRACE_PERIOD_DAYS=5`

**Test Steps:**
1. Subscription expires
2. Check grace period calculation

**Expected Results:**
- ✅ Grace period lasts 5 days instead of default 3
- ✅ `daysRemainingInGrace` counts down from 5
- ✅ Access blocked on day 6

---

### Test Scenario GP-09: Zero Grace Period
**Preconditions:**
- `SUBSCRIPTION_GRACE_PERIOD_DAYS=0`

**Test Steps:**
1. Subscription expires
2. Check access

**Expected Results:**
- ✅ `isInGracePeriod: false`
- ✅ `shouldBlockAccess: true` (immediately)
- ✅ No grace period granted

---

## Subscription Dashboard Widget

### Test Scenario SW-01: Active Subscription - Full View
**Preconditions:**
- User has ACTIVE subscription
- 45 days remaining

**Test Steps:**
1. Render `<SubscriptionWidget compact={false} />`
2. Check displayed elements

**Expected Results:**
- ✅ Green status badge: "Actief"
- ✅ Days counter: "45 dagen resterend"
- ✅ Progress bar at ~10% (45 of ~90 days used)
- ✅ End date displayed
- ✅ Plan name shown
- ✅ "Beheer Abonnement" button visible
- ✅ No warning colors

---

### Test Scenario SW-02: Subscription Expiring Soon (5 days)
**Preconditions:**
- ACTIVE subscription
- 5 days remaining

**Test Steps:**
1. Render widget
2. Check styling

**Expected Results:**
- ✅ Yellow/orange status: "Verloopt Binnenkort"
- ✅ Days counter: "5 dagen resterend"
- ✅ Progress bar ~95% filled
- ✅ Yellow warning color scheme
- ✅ "Verlengen" button with urgent styling
- ✅ Alert icon displayed

---

### Test Scenario SW-03: In Grace Period
**Preconditions:**
- Subscription expired 1 day ago
- In grace period (2 days remaining)

**Test Steps:**
1. Render widget
2. Check warning display

**Expected Results:**
- ✅ Orange status: "Grace Period"
- ✅ Message: "Je grace period eindigt over 2 dagen"
- ✅ Orange/amber color scheme
- ✅ Progress bar at 100%
- ✅ "Verlengen Nu" button prominent
- ✅ Urgency icon (clock/warning)

---

### Test Scenario SW-04: Expired (After Grace Period)
**Preconditions:**
- Subscription expired 4 days ago
- Grace period ended

**Test Steps:**
1. Render widget
2. Check display

**Expected Results:**
- ✅ Red status badge: "Verlopen"
- ✅ Message: "Je abonnement is verlopen"
- ✅ Red error color scheme
- ✅ Progress bar full (red)
- ✅ "Upgrade Nu" button
- ✅ Warning about blocked features

---

### Test Scenario SW-05: Compact Mode
**Preconditions:**
- Active subscription, 20 days remaining

**Test Steps:**
1. Render `<SubscriptionWidget compact={true} />`
2. Check layout

**Expected Results:**
- ✅ Smaller card size
- ✅ Simplified layout (single row)
- ✅ Days remaining shown
- ✅ Status icon only (no full badge)
- ✅ Single CTA button
- ✅ No progress bar
- ✅ No detailed stats

---

### Test Scenario SW-06: Trial Subscription
**Preconditions:**
- User on trial
- 10 days remaining

**Test Steps:**
1. Render widget
2. Check messaging

**Expected Results:**
- ✅ Badge: "Proefperiode"
- ✅ "10 dagen resterend van je proefperiode"
- ✅ "Upgrade naar Premium" button
- ✅ Blue/info color scheme
- ✅ Discount code hint (TRIAL10)

---

### Test Scenario SW-07: Loading State
**Preconditions:**
- Widget mounted but API not responded yet

**Test Steps:**
1. Render widget
2. Check initial state

**Expected Results:**
- ✅ Skeleton loader displayed
- ✅ Pulsing animation
- ✅ No error shown
- ✅ Proper dimensions maintained

---

### Test Scenario SW-08: API Error Handling
**Preconditions:**
- API endpoint returns error

**Test Steps:**
1. Render widget with failing API
2. Check error handling

**Expected Results:**
- ✅ Error message displayed
- ✅ "Unable to load subscription data"
- ✅ Retry button shown
- ✅ No crash/white screen

---

### Test Scenario SW-09: No Subscription Data
**Preconditions:**
- User has no subscription dates set

**Test Steps:**
1. Render widget
2. Check fallback display

**Expected Results:**
- ✅ Default message shown
- ✅ "Geen actief abonnement"
- ✅ "Start Proefperiode" button
- ✅ Neutral color scheme

---

## Webhook Notifications

### Test Scenario WH-01: Webhook Configuration Creation
**Preconditions:**
- Admin user authenticated

**Test Steps:**
1. POST to `/api/webhooks`:
```json
{
  "url": "https://example.com/webhook",
  "events": ["subscription.expired", "subscription.renewed"],
  "description": "Test webhook"
}
```
2. Check response

**Expected Results:**
- ✅ Status 200
- ✅ Webhook created with generated ID
- ✅ Secret returned (only once)
- ✅ Record in `webhook_configs` table
- ✅ `isActive: true` by default

---

### Test Scenario WH-02: Webhook Signature Verification
**Preconditions:**
- Webhook configured with secret

**Test Steps:**
1. Trigger webhook event
2. Check request headers sent to webhook URL

**Expected Results:**
- ✅ Header: `X-Webhook-Signature` present
- ✅ Header: `X-Webhook-Timestamp` present
- ✅ Header: `X-Webhook-Event` matches event type
- ✅ Signature can be verified with secret:
```javascript
const data = `${timestamp}.${JSON.stringify(payload)}`;
const expectedSignature = crypto
  .createHmac('sha256', secret)
  .update(data)
  .digest('hex');
// expectedSignature === receivedSignature
```

---

### Test Scenario WH-03: Webhook Delivery Success
**Preconditions:**
- Webhook configured
- Endpoint returns 200 OK

**Test Steps:**
1. Trigger event (e.g., subscription expires)
2. Check delivery record

**Expected Results:**
- ✅ Webhook delivered to endpoint
- ✅ Record in `webhook_deliveries` with status: "SUCCESS"
- ✅ `attempts: 1`
- ✅ `responseStatus: 200`
- ✅ Log entry: "Webhook delivered successfully"

**SQL Verification:**
```sql
SELECT id, event_type, status, attempts, response_status, created_at
FROM webhook_deliveries
WHERE webhook_config_id = '{webhookId}'
ORDER BY created_at DESC
LIMIT 1;
```

---

### Test Scenario WH-04: Webhook Delivery Failure with Retry
**Preconditions:**
- Webhook configured
- Endpoint returns 500 error or times out

**Test Steps:**
1. Trigger event
2. Wait for retries
3. Check delivery records

**Expected Results:**
- ✅ Initial attempt fails
- ✅ Status: "RETRYING"
- ✅ Retry 1 after 1 second
- ✅ Retry 2 after 5 seconds
- ✅ Retry 3 after 30 seconds
- ✅ Final status: "FAILED" after all retries exhausted
- ✅ `attempts: 4` (1 initial + 3 retries)
- ✅ Error message logged

---

### Test Scenario WH-05: Multiple Webhooks - Same Event
**Preconditions:**
- Webhook A: subscribes to `subscription.expired`
- Webhook B: subscribes to `subscription.expired`
- Webhook C: subscribes to `subscription.renewed` (different event)

**Test Steps:**
1. Trigger `subscription.expired` event
2. Check deliveries

**Expected Results:**
- ✅ Webhook A receives event
- ✅ Webhook B receives event
- ✅ Webhook C does NOT receive event
- ✅ Both deliveries sent concurrently
- ✅ Event log shows `triggered: true` with 2 configs

---

### Test Scenario WH-06: Test Webhook Endpoint
**Preconditions:**
- Webhook configured

**Test Steps:**
1. POST to `/api/webhooks/{webhookId}/test`
2. Check test endpoint response

**Expected Results:**
- ✅ Test webhook sent to configured URL
- ✅ Payload includes `test: true` in metadata
- ✅ Event type: `subscription.test`
- ✅ Response confirms delivery
- ✅ Delivery record created

---

### Test Scenario WH-07: Webhook Event Log
**Preconditions:**
- Multiple events triggered

**Test Steps:**
1. GET `/api/webhooks/logs?page=1&limit=10`
2. Check response

**Expected Results:**
```json
{
  "success": true,
  "logs": [
    {
      "id": "...",
      "eventType": "subscription.expired",
      "userId": "...",
      "triggered": true,
      "createdAt": "..."
    }
  ],
  "pagination": { "page": 1, "total": 42, "pages": 5 },
  "statistics": {
    "total": 42,
    "triggered": 38,
    "notTriggered": 4
  }
}
```

---

### Test Scenario WH-08: Webhook Statistics
**Preconditions:**
- Various webhook deliveries over time

**Test Steps:**
1. GET `/api/webhooks/stats?hours=24`
2. Check metrics

**Expected Results:**
```json
{
  "success": true,
  "health": {
    "status": "healthy",
    "recentSuccessRate": 98.5,
    "failedDeliveriesNeedingRetry": 2
  },
  "deliveries": {
    "total": 150,
    "successful": 145,
    "failed": 5,
    "successRate": 96.67,
    "recent": {
      "total": 20,
      "successful": 19,
      "successRate": 95.0
    }
  }
}
```

---

### Test Scenario WH-09: Inactive Webhook - No Delivery
**Preconditions:**
- Webhook configured but `isActive: false`

**Test Steps:**
1. Trigger event
2. Check deliveries

**Expected Results:**
- ✅ Event logged
- ✅ NO delivery attempted
- ✅ Event log shows `triggered: false`
- ✅ No delivery record created

---

### Test Scenario WH-10: Webhook Custom Headers
**Preconditions:**
- Webhook configured with custom headers:
```json
{
  "headers": {
    "Authorization": "Bearer secret-token",
    "X-Custom-ID": "12345"
  }
}
```

**Test Steps:**
1. Trigger event
2. Check request received at webhook URL

**Expected Results:**
- ✅ Standard webhook headers present
- ✅ `Authorization: Bearer secret-token` header included
- ✅ `X-Custom-ID: 12345` header included

---

## Subscription Access Control

### Test Scenario AC-01: Active Subscription - Full Access
**Preconditions:**
- User has ACTIVE subscription
- 30 days remaining

**Test Steps:**
1. POST to `/api/chat/message` (widget)
2. GET `/api/chatbot/public-config`
3. Try to open knowledge base

**Expected Results:**
- ✅ All requests succeed (200 OK)
- ✅ Widget responds with AI message
- ✅ Config endpoint returns data
- ✅ Knowledge base accessible

---

### Test Scenario AC-02: Trial Active - Full Access
**Preconditions:**
- User on TRIAL
- 15 days remaining

**Test Steps:**
1. Use widget
2. Access all features

**Expected Results:**
- ✅ Full access granted
- ✅ No restrictions
- ✅ Trial badge shown in UI

---

### Test Scenario AC-03: Expired - Within Grace Period - Access Allowed
**Preconditions:**
- Subscription expired 1 day ago
- Grace period: 3 days

**Test Steps:**
1. POST to `/api/chat/message`
2. Check logs

**Expected Results:**
- ✅ Request succeeds (200 OK)
- ✅ Widget works normally
- ✅ Log: "⚠️ Widget used during grace period: {userId}"
- ✅ Warning banner shown in UI

---

### Test Scenario AC-04: Expired - After Grace Period - Access Blocked
**Preconditions:**
- Subscription expired 4 days ago
- Grace period was 3 days

**Test Steps:**
1. POST to `/api/chat/message`
2. Try to open assistant editor
3. Try to access knowledge base

**Expected Results:**
- ✅ Widget request returns 403 Forbidden
- ✅ Error message: "Subscription expired. Please renew..."
- ✅ `redirectUrl` provided in response
- ✅ Assistant editor blocked
- ✅ Knowledge base blocked
- ✅ User automatically redirected to `/account/subscription`

**API Response:**
```json
{
  "success": false,
  "error": "Subscription expired. Please renew to continue using this feature.",
  "errorCode": "SUBSCRIPTION_EXPIRED",
  "redirectUrl": "/account/subscription"
}
```

---

### Test Scenario AC-05: Redirect to Subscription Page
**Preconditions:**
- Expired user tries to access protected resource

**Test Steps:**
1. Click "Edit Assistant" button
2. Check navigation

**Expected Results:**
- ✅ User redirected to `/account/subscription`
- ✅ Error message displayed: "Je abonnement is verlopen"
- ✅ Subscription options shown
- ✅ Upgrade/renew CTAs visible

---

### Test Scenario AC-06: Public Endpoints - No Restriction
**Preconditions:**
- Expired subscription

**Test Steps:**
1. Access public pages (home, about, pricing)
2. Check access

**Expected Results:**
- ✅ All public pages accessible
- ✅ No redirects
- ✅ Only widget/features blocked

---

## Integration Scenarios

### Test Scenario INT-01: Complete Expiration Flow
**Day 7 Before Expiration:**
- ✅ Email notification sent: "7 days remaining"
- ✅ Webhook: `subscription.expiring` (daysRemaining: 7)
- ✅ Widget shows yellow warning

**Day 3 Before:**
- ✅ Email: "3 days remaining"
- ✅ Webhook: `subscription.expiring` (daysRemaining: 3)
- ✅ Widget more urgent

**Day 1 Before:**
- ✅ Email: "1 day remaining"
- ✅ Webhook: `subscription.expiring` (daysRemaining: 1)
- ✅ Widget critical red

**Day 0 (Expiration Day):**
- ✅ Email: "Expires today"
- ✅ Webhook: `subscription.expired`
- ✅ Webhook: `subscription.grace_period_started`
- ✅ Grace period begins
- ✅ Widget shows grace period banner
- ✅ Access still allowed

**Day 1 After (Grace Period):**
- ✅ Email: "Expired 1 day ago"
- ✅ Widget shows: "2 days grace period remaining"
- ✅ Red urgent banner
- ✅ Access still allowed

**Day 3 After (Last Day of Grace):**
- ✅ Webhook: `subscription.grace_period_ending`
- ✅ Widget: "Last day of grace period!"
- ✅ Animated critical warning
- ✅ Access still allowed

**Day 4 After (Grace Period Ended):**
- ✅ Webhook: `subscription.grace_period_ended`
- ✅ Access BLOCKED
- ✅ Widget returns 403
- ✅ Redirect to subscription page
- ✅ Knowledge base blocked

---

### Test Scenario INT-02: Renewal During Grace Period
**Initial State:**
- Subscription expired 2 days ago
- In grace period (1 day remaining)

**Test Steps:**
1. User renews subscription
2. Check all systems update

**Expected Results:**
- ✅ Subscription status: ACTIVE
- ✅ New end date set (30/90 days from now)
- ✅ Grace period cleared
- ✅ Webhook: `subscription.renewed`
- ✅ Widget returns to normal (green)
- ✅ Full access restored
- ✅ Banner disappears

---

### Test Scenario INT-03: Trial to Paid Conversion
**Initial State:**
- User on trial (3 days remaining)

**Test Steps:**
1. User upgrades to PROFESSIONAL plan
2. Check systems

**Expected Results:**
- ✅ Status changes: TRIAL → ACTIVE
- ✅ Plan set: PROFESSIONAL
- ✅ New subscription dates set
- ✅ Trial dates cleared
- ✅ Webhook: `subscription.activated`
- ✅ Widget shows paid subscription
- ✅ Email confirmation (if implemented)

---

### Test Scenario INT-04: Cron Job + Webhooks + Email Together
**Preconditions:**
- 5 users with subscriptions expiring at different intervals

**Test Steps:**
1. Run cron job: `POST /api/cron/subscription-notifications`
2. Check all outputs

**Expected Results:**
```json
{
  "stats": {
    "checked": 5,
    "notified": 5,
    "webhooksTriggered": 5,
    "errors": 0,
    "byStatus": {
      "expiring7Days": 1,
      "expiring3Days": 2,
      "expiring1Day": 1,
      "expiringToday": 1
    }
  }
}
```
- ✅ 5 emails sent
- ✅ 5 webhook events triggered
- ✅ 5 notification records created
- ✅ All event logs created

---

## Edge Cases

### Test Scenario EDGE-01: Timezone Handling
**Preconditions:**
- Subscription end date: 2025-10-27 00:00:00 UTC
- Current time: 2025-10-26 23:00:00 UTC (1 hour before)
- User timezone: UTC+2 (already Oct 27 locally)

**Test Steps:**
1. Calculate days remaining

**Expected Results:**
- ✅ Calculation uses UTC consistently
- ✅ Days remaining: 0 (expires today)
- ✅ Notification triggered appropriately

---

### Test Scenario EDGE-02: Null Subscription Dates
**Preconditions:**
- User created but no trial/subscription dates set

**Test Steps:**
1. Check grace period
2. Try to access widget

**Expected Results:**
- ✅ No crash/error
- ✅ Grace period check returns safe defaults
- ✅ Access may be blocked or allowed based on status
- ✅ Widget shows "No active subscription"

---

### Test Scenario EDGE-03: Very Long Subscription (1 Year+)
**Preconditions:**
- Subscription has 400 days remaining

**Test Steps:**
1. Run cron job
2. Check notifications

**Expected Results:**
- ✅ No notification sent (not within 7-day window)
- ✅ Widget shows "400 days remaining"
- ✅ Progress bar near 0%
- ✅ Green/normal status

---

### Test Scenario EDGE-04: Subscription Expires Exactly at Midnight
**Preconditions:**
- End date: 2025-10-27 00:00:00
- Current time: 2025-10-27 00:00:00

**Test Steps:**
1. Check subscription status
2. Calculate days remaining

**Expected Results:**
- ✅ Days remaining: 0
- ✅ Considered expired TODAY
- ✅ Grace period starts
- ✅ "Expires today" notification sent

---

### Test Scenario EDGE-05: Rapid Status Changes
**Scenario:**
- User expires → renews → cancels all in same day

**Test Steps:**
1. Expire subscription
2. Renew subscription
3. Cancel subscription
4. Check webhook deliveries

**Expected Results:**
- ✅ Webhook 1: `subscription.expired`
- ✅ Webhook 2: `subscription.renewed`
- ✅ Webhook 3: `subscription.cancelled`
- ✅ All events logged separately
- ✅ Event logs show sequence

---

### Test Scenario EDGE-06: Webhook Endpoint Timeout
**Preconditions:**
- Webhook endpoint takes 15 seconds to respond
- Timeout: 10 seconds

**Test Steps:**
1. Trigger webhook
2. Wait for response

**Expected Results:**
- ✅ Request times out after 10 seconds
- ✅ Status: "FAILED"
- ✅ Error: "Timeout after 10000ms"
- ✅ Retry scheduled

---

### Test Scenario EDGE-07: Grace Period Disabled
**Preconditions:**
- `SUBSCRIPTION_GRACE_PERIOD_DAYS=0`
- Subscription expires

**Test Steps:**
1. Check grace period
2. Try to access features

**Expected Results:**
- ✅ `isInGracePeriod: false`
- ✅ `shouldBlockAccess: true` (immediately)
- ✅ Access blocked same day as expiration
- ✅ No grace period webhooks triggered

---

### Test Scenario EDGE-08: Multiple Webhook Configs - One Fails
**Preconditions:**
- Webhook A: working endpoint
- Webhook B: failing endpoint (500 error)
- Webhook C: working endpoint

**Test Steps:**
1. Trigger event
2. Check deliveries

**Expected Results:**
- ✅ Webhook A: SUCCESS
- ✅ Webhook B: FAILED (will retry)
- ✅ Webhook C: SUCCESS
- ✅ Failures don't block successful deliveries
- ✅ Event processing completes

---

### Test Scenario EDGE-09: Concurrent Cron Jobs
**Scenario:**
- Cron job triggered twice simultaneously (race condition)

**Test Steps:**
1. Start cron job (Job A)
2. Start cron job again immediately (Job B)
3. Check notification records

**Expected Results:**
- ✅ Duplicate prevention works
- ✅ Only one notification per user per day
- ✅ Database constraint prevents duplicates
- ✅ Both jobs complete successfully

---

### Test Scenario EDGE-10: User Deleted During Grace Period
**Preconditions:**
- User in grace period
- User account deleted

**Test Steps:**
1. Delete user account
2. Check cascade deletes

**Expected Results:**
- ✅ User record deleted
- ✅ Subscription notifications deleted (CASCADE)
- ✅ Webhook event logs remain (for audit)
- ✅ No orphaned records
- ✅ No errors on next cron run

---

## Performance & Load Testing

### Test Scenario PERF-01: Bulk Notifications (1000 Users)
**Test Steps:**
1. Create 1000 test users with expiring subscriptions
2. Run cron job
3. Measure performance

**Expected Results:**
- ✅ Cron job completes within 5 minutes
- ✅ All 1000 emails sent
- ✅ All webhooks triggered
- ✅ No memory leaks
- ✅ Database connections managed properly

---

### Test Scenario PERF-02: Webhook Delivery Concurrency
**Test Steps:**
1. Configure 10 webhooks for same event
2. Trigger event
3. Monitor concurrent deliveries

**Expected Results:**
- ✅ All 10 webhooks fire concurrently
- ✅ Not sequential (should take ~10s total, not 100s)
- ✅ Promise.allSettled used correctly

---

## Summary

This test plan covers:
- ✅ **50+ test scenarios** across all features
- ✅ **Happy paths** for all functionality
- ✅ **Edge cases** and error handling
- ✅ **Integration scenarios** testing multiple systems together
- ✅ **Performance considerations**

### Test Coverage by Feature:
- Email Notifications: 9 scenarios
- Grace Period System: 9 scenarios
- Subscription Widget: 9 scenarios
- Webhook Notifications: 10 scenarios
- Access Control: 6 scenarios
- Integration Scenarios: 4 scenarios
- Edge Cases: 10 scenarios
- Performance: 2 scenarios

**Total: 59 comprehensive test scenarios**
