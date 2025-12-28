# Webhook Integration Guide

This guide covers the webhook notification system for subscription lifecycle events in the AI Chat platform.

## Table of Contents

- [Overview](#overview)
- [Event Types](#event-types)
- [Getting Started](#getting-started)
- [Webhook Configuration](#webhook-configuration)
- [Payload Structure](#payload-structure)
- [Security & Verification](#security--verification)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Webhooks allow your application to receive real-time notifications about subscription events in the AI Chat platform. When an event occurs (such as a subscription expiring), the system will send an HTTP POST request to your configured endpoint(s).

### Key Features

- **Real-time notifications** for all subscription lifecycle events
- **Automatic retries** with exponential backoff for failed deliveries
- **HMAC-SHA256 signature** verification for security
- **Comprehensive logging** and monitoring
- **Flexible configuration** per webhook endpoint
- **Event filtering** to receive only relevant events

## Event Types

The following webhook events are available:

### Trial Events

- `subscription.trial_started` - User's trial period has started
- `subscription.trial_expiring` - Trial is expiring soon (7, 3, or 1 days)
- `subscription.trial_expired` - Trial has expired

### Subscription Events

- `subscription.activated` - Paid subscription activated
- `subscription.renewed` - Subscription renewed/extended
- `subscription.expiring` - Subscription expiring soon (7, 3, or 1 days)
- `subscription.expired` - Subscription has expired
- `subscription.cancelled` - Subscription cancelled by user

### Grace Period Events

- `subscription.grace_period_started` - Grace period begins after expiration
- `subscription.grace_period_ending` - Grace period ending soon
- `subscription.grace_period_ended` - Grace period has ended

### Payment Events

- `subscription.payment_succeeded` - Payment processed successfully
- `subscription.payment_failed` - Payment failed

## Getting Started

### 1. Create a Webhook Endpoint

Create an HTTP endpoint in your application that can receive POST requests:

```javascript
// Example: Node.js/Express
app.post('/webhooks/ai-chat', async (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const timestamp = req.headers['x-webhook-timestamp'];
  const payload = req.body;

  // Verify signature (see Security section)
  if (!verifySignature(payload, signature, timestamp)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process the webhook
  console.log('Received event:', payload.event);
  console.log('User:', payload.data.user);
  console.log('Subscription:', payload.data.subscription);

  // Respond with 200 OK
  res.status(200).json({ received: true });
});
```

### 2. Configure Your Webhook

Use the API to register your webhook endpoint:

```bash
POST /api/webhooks
Authorization: Bearer YOUR_SESSION_TOKEN
Content-Type: application/json

{
  "url": "https://your-domain.com/webhooks/ai-chat",
  "events": [
    "subscription.expiring",
    "subscription.expired",
    "subscription.renewed"
  ],
  "description": "Production webhook for subscription events",
  "isActive": true
}
```

Response will include your webhook secret:

```json
{
  "success": true,
  "webhook": {
    "id": "clx...",
    "url": "https://your-domain.com/webhooks/ai-chat",
    "secret": "your-webhook-secret-store-securely",
    "events": ["subscription.expiring", "subscription.expired", "subscription.renewed"],
    "isActive": true
  },
  "message": "Webhook created successfully. Store the secret securely - it will not be shown again."
}
```

⚠️ **Important**: Store the secret securely. It's only shown once during creation.

### 3. Test Your Webhook

Send a test webhook to verify your endpoint:

```bash
POST /api/webhooks/{webhookId}/test
Authorization: Bearer YOUR_SESSION_TOKEN
```

## Webhook Configuration

### Configuration Options

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | Yes | Your webhook endpoint URL (must be HTTPS in production) |
| `events` | string[] | Yes | Array of event types to subscribe to |
| `description` | string | No | Human-readable description |
| `isActive` | boolean | No | Enable/disable webhook (default: true) |
| `maxRetries` | number | No | Maximum retry attempts (default: 3) |
| `retryDelays` | number[] | No | Delay in ms for each retry (default: [1000, 5000, 30000]) |
| `headers` | object | No | Custom headers to include in requests |

### Example: Custom Retry Configuration

```json
{
  "url": "https://your-domain.com/webhooks",
  "events": ["subscription.expired"],
  "maxRetries": 5,
  "retryDelays": [2000, 5000, 15000, 30000, 60000],
  "headers": {
    "X-Custom-Header": "value"
  }
}
```

## Payload Structure

All webhooks follow the same payload structure:

```typescript
{
  id: string;              // Unique webhook delivery ID
  event: string;           // Event type (e.g., "subscription.expired")
  timestamp: string;       // ISO 8601 timestamp
  data: {
    user: {
      id: string;
      email: string;
      name: string | null;
    };
    subscription: {
      status: string;      // TRIAL, ACTIVE, CANCELED, etc.
      plan: string | null; // Plan name
      startDate: string | null;  // ISO 8601
      endDate: string | null;    // ISO 8601
      isTrial: boolean;
      daysRemaining: number;
      gracePeriod?: {
        isInGracePeriod: boolean;
        daysRemaining: number;
        endsAt: string | null;
      };
    };
  };
  previous?: {             // Included for change events
    subscription: { ... }
  };
  metadata?: object;       // Additional event-specific data
}
```

### Example Payload

```json
{
  "id": "wh_clx123456789",
  "event": "subscription.expiring",
  "timestamp": "2025-10-26T14:30:00.000Z",
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "subscription": {
      "status": "ACTIVE",
      "plan": "PROFESSIONAL",
      "startDate": "2025-09-26T00:00:00.000Z",
      "endDate": "2025-11-26T00:00:00.000Z",
      "isTrial": false,
      "daysRemaining": 3,
      "gracePeriod": {
        "isInGracePeriod": false,
        "daysRemaining": 0,
        "endsAt": null
      }
    }
  },
  "metadata": {
    "daysRemaining": 3,
    "notificationType": "3_days"
  }
}
```

## Security & Verification

All webhook requests include HMAC-SHA256 signatures for verification.

### Request Headers

```
X-Webhook-Signature: <hmac_signature>
X-Webhook-Timestamp: <unix_timestamp>
X-Webhook-Event: <event_type>
```

### Signature Verification

#### Node.js Example

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, timestamp, secret) {
  // Check timestamp freshness (prevent replay attacks)
  const now = Math.floor(Date.now() / 1000);
  if (now - timestamp > 300) { // 5 minutes
    return false;
  }

  // Generate expected signature
  const payloadString = JSON.stringify(payload);
  const data = `${timestamp}.${payloadString}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');

  // Compare signatures (timing-safe)
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Usage
app.post('/webhooks/ai-chat', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const timestamp = parseInt(req.headers['x-webhook-timestamp']);
  const secret = process.env.WEBHOOK_SECRET;

  if (!verifyWebhookSignature(req.body, signature, timestamp, secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process webhook...
  res.status(200).json({ received: true });
});
```

#### Python Example

```python
import hmac
import hashlib
import time
import json

def verify_webhook_signature(payload, signature, timestamp, secret):
    # Check timestamp freshness
    now = int(time.time())
    if now - timestamp > 300:  # 5 minutes
        return False

    # Generate expected signature
    payload_string = json.dumps(payload, separators=(',', ':'))
    data = f"{timestamp}.{payload_string}"
    expected_signature = hmac.new(
        secret.encode(),
        data.encode(),
        hashlib.sha256
    ).hexdigest()

    # Compare signatures
    return hmac.compare_digest(signature, expected_signature)

# Usage in Flask
@app.route('/webhooks/ai-chat', methods=['POST'])
def webhook():
    signature = request.headers.get('X-Webhook-Signature')
    timestamp = int(request.headers.get('X-Webhook-Timestamp'))
    secret = os.environ['WEBHOOK_SECRET']

    if not verify_webhook_signature(request.json, signature, timestamp, secret):
        return {'error': 'Invalid signature'}, 401

    # Process webhook...
    return {'received': True}, 200
```

## API Reference

### List Webhooks

```
GET /api/webhooks
```

Returns all configured webhooks.

**Response:**
```json
{
  "success": true,
  "webhooks": [
    {
      "id": "clx...",
      "url": "https://...",
      "events": ["..."],
      "isActive": true,
      "deliveryCount": 42,
      "hasSecret": true
    }
  ]
}
```

### Create Webhook

```
POST /api/webhooks
```

**Request Body:**
```json
{
  "url": "https://your-domain.com/webhooks",
  "events": ["subscription.expired"],
  "description": "Production webhook",
  "isActive": true
}
```

### Get Webhook

```
GET /api/webhooks/{id}
```

### Update Webhook

```
PATCH /api/webhooks/{id}
```

**Request Body:**
```json
{
  "isActive": false,
  "events": ["subscription.expired", "subscription.renewed"]
}
```

### Delete Webhook

```
DELETE /api/webhooks/{id}
```

### Test Webhook

```
POST /api/webhooks/{id}/test
```

Sends a test event to your webhook endpoint.

### Get Delivery History

```
GET /api/webhooks/{id}/deliveries?page=1&limit=50&status=FAILED
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Results per page (max: 100, default: 50)
- `status` - Filter by status: PENDING, SUCCESS, FAILED, RETRYING
- `eventType` - Filter by event type

### Get Webhook Logs

```
GET /api/webhooks/logs?page=1&eventType=subscription.expired
```

### Get Webhook Statistics

```
GET /api/webhooks/stats?hours=24
```

Returns overall webhook health and performance metrics.

## Testing

### 1. Use the Test Endpoint

```bash
curl -X POST https://your-app.com/api/webhooks/{webhookId}/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Local Testing with ngrok

```bash
# Start ngrok
ngrok http 3000

# Use the ngrok URL for your webhook
https://abc123.ngrok.io/webhooks/ai-chat
```

### 3. Mock Webhook Server

Create a simple test server:

```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.post('/webhooks/test', (req, res) => {
  console.log('Received webhook:');
  console.log('Headers:', req.headers);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  res.status(200).json({ received: true });
});

app.listen(3001, () => {
  console.log('Test webhook server running on port 3001');
});
```

## Best Practices

### 1. Respond Quickly

Always respond with `200 OK` quickly (within 10 seconds). Process the webhook asynchronously:

```javascript
app.post('/webhooks', async (req, res) => {
  // Verify signature first
  if (!verifySignature(req)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Respond immediately
  res.status(200).json({ received: true });

  // Process asynchronously
  processWebhook(req.body).catch(err => {
    console.error('Webhook processing error:', err);
  });
});
```

### 2. Idempotency

Handle duplicate deliveries gracefully:

```javascript
const processedWebhooks = new Set();

async function processWebhook(payload) {
  // Check if already processed
  if (processedWebhooks.has(payload.id)) {
    console.log('Duplicate webhook, skipping');
    return;
  }

  // Process webhook
  await handleEvent(payload);

  // Mark as processed
  processedWebhooks.add(payload.id);
}
```

### 3. Error Handling

Log errors but don't fail silently:

```javascript
try {
  await processWebhook(payload);
} catch (error) {
  console.error('Webhook processing failed:', {
    webhookId: payload.id,
    event: payload.event,
    error: error.message
  });
  // Send alert to monitoring system
  await alertMonitoring(error);
}
```

### 4. Monitoring

Monitor webhook health:
- Track delivery success rates
- Alert on high failure rates
- Monitor response times
- Review failed deliveries regularly

## Troubleshooting

### Webhooks Not Received

1. **Check webhook is active**
   ```bash
   GET /api/webhooks/{id}
   ```

2. **Verify endpoint is accessible**
   - Must be publicly accessible
   - Use HTTPS in production
   - Check firewall rules

3. **Check delivery logs**
   ```bash
   GET /api/webhooks/{id}/deliveries?status=FAILED
   ```

### Signature Verification Fails

1. **Check timestamp freshness** - Must be within 5 minutes
2. **Verify secret** - Ensure you're using the correct secret
3. **Check payload format** - JSON must match exactly (no extra whitespace)
4. **Inspect headers** - Ensure headers are properly parsed

### High Failure Rate

1. **Check endpoint response time** - Must respond within 10 seconds
2. **Verify error responses** - Return proper HTTP status codes
3. **Check logs** - Review error messages in delivery logs
4. **Test endpoint** - Use the test webhook feature

### Missing Events

1. **Check event subscription** - Ensure webhook is subscribed to the event type
2. **Verify triggers** - Check if events are being generated
3. **Review event logs**
   ```bash
   GET /api/webhooks/logs?triggered=false
   ```

## Support

For additional help:
- Review delivery logs: `/api/webhooks/{id}/deliveries`
- Check webhook stats: `/api/webhooks/stats`
- Contact support with webhook ID and delivery ID for specific issues

## Migration Guide

If migrating from a previous notification system:

1. Create new webhook configuration
2. Test with non-critical events first
3. Run both systems in parallel during transition
4. Monitor delivery success rates
5. Decommission old system once stable

---

**Last Updated:** October 26, 2025
**Version:** 1.0.0
