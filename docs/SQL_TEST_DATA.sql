-- ============================================================================
-- SQL TEST DATA SCRIPT - Subscription Protection System
-- ============================================================================
-- This script creates test users with various subscription states for
-- testing email notifications, grace period, webhooks, and access control.
--
-- IMPORTANT: Run this on a DEVELOPMENT/TEST database only!
-- DO NOT run on production database!
--
-- Usage:
--   psql -U your_user -d your_database -f SQL_TEST_DATA.sql
--   or copy-paste into your database client
--
-- After running, test users will have credentials:
--   Password for all: Test1234!
-- ============================================================================

-- Safety check: Uncomment the following line to enable the script
-- If commented, script will not execute
DO $$ BEGIN
    RAISE NOTICE 'Starting test data creation...';
    -- Remove the following line to execute:
    -- RAISE EXCEPTION 'Safety check: Please review and uncomment this line in the script before running.';
END $$;

-- ============================================================================
-- CLEANUP SECTION
-- ============================================================================
-- Remove existing test users (optional - uncomment if needed)

-- DELETE FROM subscription_notifications WHERE user_id IN (
--     SELECT id FROM users WHERE email LIKE 'test-%@example.com'
-- );
-- DELETE FROM webhook_event_logs WHERE user_id IN (
--     SELECT id FROM users WHERE email LIKE 'test-%@example.com'
-- );
-- DELETE FROM users WHERE email LIKE 'test-%@example.com';

-- ============================================================================
-- TEST USER CREATION
-- ============================================================================

-- Note: Password hash for 'Test1234!' - adjust if your auth system differs
-- This is a bcrypt hash. Generate your own with: bcrypt.hash('Test1234!', 10)
-- The hash below is for 'Test1234!' with 10 rounds

-- User 1: Trial - Expires in 7 days
INSERT INTO users (
    id, name, email, email_verified, password, role,
    subscription_status, subscription_plan,
    trial_start_date, trial_end_date,
    is_active, created_at, updated_at
) VALUES (
    'test-user-7days',
    'Test User - 7 Days',
    'test-7days@example.com',
    NOW(),
    '$2b$10$rWxXbQhY8KpEhZfIJ2KQZeqJ7kQFMc4gZHpYqXQNZr4Gc1kQRn8Ey', -- Test1234!
    'USER',
    'TRIAL',
    NULL,
    CURRENT_TIMESTAMP - INTERVAL '23 days',  -- Started 23 days ago
    CURRENT_TIMESTAMP + INTERVAL '7 days',   -- Expires in 7 days
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    trial_end_date = CURRENT_TIMESTAMP + INTERVAL '7 days',
    updated_at = NOW();

-- User 2: Trial - Expires in 3 days
INSERT INTO users (
    id, name, email, email_verified, password, role,
    subscription_status, trial_start_date, trial_end_date,
    is_active, created_at, updated_at
) VALUES (
    'test-user-3days',
    'Test User - 3 Days',
    'test-3days@example.com',
    NOW(),
    '$2b$10$rWxXbQhY8KpEhZfIJ2KQZeqJ7kQFMc4gZHpYqXQNZr4Gc1kQRn8Ey',
    'USER',
    'TRIAL',
    CURRENT_TIMESTAMP - INTERVAL '27 days',
    CURRENT_TIMESTAMP + INTERVAL '3 days',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    trial_end_date = CURRENT_TIMESTAMP + INTERVAL '3 days',
    updated_at = NOW();

-- User 3: Trial - Expires in 1 day
INSERT INTO users (
    id, name, email, email_verified, password, role,
    subscription_status, trial_start_date, trial_end_date,
    is_active, created_at, updated_at
) VALUES (
    'test-user-1day',
    'Test User - 1 Day',
    'test-1day@example.com',
    NOW(),
    '$2b$10$rWxXbQhY8KpEhZfIJ2KQZeqJ7kQFMc4gZHpYqXQNZr4Gc1kQRn8Ey',
    'USER',
    'TRIAL',
    CURRENT_TIMESTAMP - INTERVAL '29 days',
    CURRENT_TIMESTAMP + INTERVAL '1 day',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    trial_end_date = CURRENT_TIMESTAMP + INTERVAL '1 day',
    updated_at = NOW();

-- User 4: Trial - Expires today
INSERT INTO users (
    id, name, email, email_verified, password, role,
    subscription_status, trial_start_date, trial_end_date,
    is_active, created_at, updated_at
) VALUES (
    'test-user-today',
    'Test User - Expires Today',
    'test-today@example.com',
    NOW(),
    '$2b$10$rWxXbQhY8KpEhZfIJ2KQZeqJ7kQFMc4gZHpYqXQNZr4Gc1kQRn8Ey',
    'USER',
    'TRIAL',
    CURRENT_TIMESTAMP - INTERVAL '30 days',
    CURRENT_DATE,  -- Expires today at midnight
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    trial_end_date = CURRENT_DATE,
    updated_at = NOW();

-- User 5: Trial - Expired 1 day ago (Grace Period Day 1)
INSERT INTO users (
    id, name, email, email_verified, password, role,
    subscription_status, trial_start_date, trial_end_date,
    is_active, created_at, updated_at
) VALUES (
    'test-user-grace1',
    'Test User - Grace Period Day 1',
    'test-grace1@example.com',
    NOW(),
    '$2b$10$rWxXbQhY8KpEhZfIJ2KQZeqJ7kQFMc4gZHpYqXQNZr4Gc1kQRn8Ey',
    'USER',
    'TRIAL',
    CURRENT_TIMESTAMP - INTERVAL '31 days',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    trial_end_date = CURRENT_TIMESTAMP - INTERVAL '1 day',
    updated_at = NOW();

-- User 6: Trial - Expired 2 days ago (Grace Period Last Day)
INSERT INTO users (
    id, name, email, email_verified, password, role,
    subscription_status, trial_start_date, trial_end_date,
    is_active, created_at, updated_at
) VALUES (
    'test-user-grace-last',
    'Test User - Grace Period Last Day',
    'test-grace-last@example.com',
    NOW(),
    '$2b$10$rWxXbQhY8KpEhZfIJ2KQZeqJ7kQFMc4gZHpYqXQNZr4Gc1kQRn8Ey',
    'USER',
    'TRIAL',
    CURRENT_TIMESTAMP - INTERVAL '32 days',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    trial_end_date = CURRENT_TIMESTAMP - INTERVAL '2 days',
    updated_at = NOW();

-- User 7: Trial - Expired 4 days ago (Past Grace Period - BLOCKED)
INSERT INTO users (
    id, name, email, email_verified, password, role,
    subscription_status, trial_start_date, trial_end_date,
    is_active, created_at, updated_at
) VALUES (
    'test-user-blocked',
    'Test User - Access Blocked',
    'test-blocked@example.com',
    NOW(),
    '$2b$10$rWxXbQhY8KpEhZfIJ2KQZeqJ7kQFMc4gZHpYqXQNZr4Gc1kQRn8Ey',
    'USER',
    'TRIAL',
    CURRENT_TIMESTAMP - INTERVAL '34 days',
    CURRENT_TIMESTAMP - INTERVAL '4 days',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    trial_end_date = CURRENT_TIMESTAMP - INTERVAL '4 days',
    updated_at = NOW();

-- User 8: Paid Subscription - ACTIVE, 45 days remaining
INSERT INTO users (
    id, name, email, email_verified, password, role,
    subscription_status, subscription_plan,
    subscription_start_date, subscription_end_date,
    trial_start_date, trial_end_date,
    is_active, created_at, updated_at
) VALUES (
    'test-user-active',
    'Test User - Active Subscription',
    'test-active@example.com',
    NOW(),
    '$2b$10$rWxXbQhY8KpEhZfIJ2KQZeqJ7kQFMc4gZHpYqXQNZr4Gc1kQRn8Ey',
    'USER',
    'ACTIVE',
    'PROFESSIONAL',
    CURRENT_TIMESTAMP - INTERVAL '45 days',   -- Started 45 days ago
    CURRENT_TIMESTAMP + INTERVAL '45 days',   -- 45 days remaining
    CURRENT_TIMESTAMP - INTERVAL '75 days',   -- Trial was 75 days ago
    CURRENT_TIMESTAMP - INTERVAL '45 days',   -- Trial ended when subscription started
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    subscription_status = 'ACTIVE',
    subscription_plan = 'PROFESSIONAL',
    subscription_end_date = CURRENT_TIMESTAMP + INTERVAL '45 days',
    updated_at = NOW();

-- User 9: Paid Subscription - Expiring in 5 days
INSERT INTO users (
    id, name, email, email_verified, password, role,
    subscription_status, subscription_plan,
    subscription_start_date, subscription_end_date,
    is_active, created_at, updated_at
) VALUES (
    'test-user-expiring',
    'Test User - Subscription Expiring',
    'test-expiring@example.com',
    NOW(),
    '$2b$10$rWxXbQhY8KpEhZfIJ2KQZeqJ7kQFMc4gZHpYqXQNZr4Gc1kQRn8Ey',
    'USER',
    'ACTIVE',
    'BUSINESS',
    CURRENT_TIMESTAMP - INTERVAL '85 days',
    CURRENT_TIMESTAMP + INTERVAL '5 days',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    subscription_end_date = CURRENT_TIMESTAMP + INTERVAL '5 days',
    updated_at = NOW();

-- User 10: Paid Subscription - Expired, in Grace Period
INSERT INTO users (
    id, name, email, email_verified, password, role,
    subscription_status, subscription_plan,
    subscription_start_date, subscription_end_date,
    is_active, created_at, updated_at
) VALUES (
    'test-user-grace-paid',
    'Test User - Paid Grace Period',
    'test-grace-paid@example.com',
    NOW(),
    '$2b$10$rWxXbQhY8KpEhZfIJ2KQZeqJ7kQFMc4gZHpYqXQNZr4Gc1kQRn8Ey',
    'USER',
    'ACTIVE',
    'STARTER',
    CURRENT_TIMESTAMP - INTERVAL '31 days',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    subscription_end_date = CURRENT_TIMESTAMP - INTERVAL '1 day',
    updated_at = NOW();

-- ============================================================================
-- TEST WEBHOOK CONFIGURATIONS
-- ============================================================================

-- Webhook 1: Comprehensive webhook for all events
INSERT INTO webhook_configs (
    id, url, secret, events, is_active, description,
    max_retries, retry_delays, created_at, updated_at
) VALUES (
    'test-webhook-all',
    'https://webhook.site/test-all-events',  -- Replace with your webhook.site URL
    'test-secret-all-events-abc123',
    ARRAY[
        'subscription.trial_started',
        'subscription.trial_expiring',
        'subscription.trial_expired',
        'subscription.activated',
        'subscription.renewed',
        'subscription.expiring',
        'subscription.expired',
        'subscription.cancelled',
        'subscription.grace_period_started',
        'subscription.grace_period_ending',
        'subscription.grace_period_ended',
        'subscription.payment_succeeded',
        'subscription.payment_failed'
    ]::TEXT[],
    true,
    'Test webhook - All events',
    3,
    '[1000, 5000, 30000]'::JSONB,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    url = EXCLUDED.url,
    events = EXCLUDED.events,
    updated_at = NOW();

-- Webhook 2: Expiration events only
INSERT INTO webhook_configs (
    id, url, secret, events, is_active, description,
    max_retries, retry_delays, created_at, updated_at
) VALUES (
    'test-webhook-expiration',
    'https://webhook.site/test-expiration',  -- Replace with your webhook.site URL
    'test-secret-expiration-xyz789',
    ARRAY[
        'subscription.expiring',
        'subscription.expired',
        'subscription.trial_expiring',
        'subscription.trial_expired'
    ]::TEXT[],
    true,
    'Test webhook - Expiration events only',
    3,
    '[1000, 5000, 30000]'::JSONB,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    url = EXCLUDED.url,
    events = EXCLUDED.events,
    updated_at = NOW();

-- Webhook 3: Inactive webhook (for testing that inactive webhooks don't trigger)
INSERT INTO webhook_configs (
    id, url, secret, events, is_active, description,
    max_retries, retry_delays, created_at, updated_at
) VALUES (
    'test-webhook-inactive',
    'https://webhook.site/test-inactive',
    'test-secret-inactive-disabled',
    ARRAY['subscription.expired']::TEXT[],
    false,  -- INACTIVE
    'Test webhook - Inactive (should not trigger)',
    3,
    '[1000, 5000, 30000]'::JSONB,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    is_active = false,
    updated_at = NOW();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Show all test users with their subscription status
DO $$
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'TEST USERS CREATED SUCCESSFULLY';
    RAISE NOTICE '============================================================';
END $$;

-- Display test users
SELECT
    name,
    email,
    subscription_status,
    subscription_plan,
    CASE
        WHEN subscription_status = 'TRIAL' THEN
            EXTRACT(DAY FROM (trial_end_date - CURRENT_TIMESTAMP))
        ELSE
            EXTRACT(DAY FROM (subscription_end_date - CURRENT_TIMESTAMP))
    END as days_remaining,
    CASE
        WHEN subscription_status = 'TRIAL' THEN trial_end_date
        ELSE subscription_end_date
    END as end_date,
    is_active
FROM users
WHERE email LIKE 'test-%@example.com'
ORDER BY
    CASE
        WHEN subscription_status = 'TRIAL' THEN trial_end_date
        ELSE subscription_end_date
    END DESC;

-- Show webhook configs
SELECT
    id,
    url,
    is_active,
    description,
    array_length(events, 1) as event_count
FROM webhook_configs
WHERE id LIKE 'test-webhook-%'
ORDER BY created_at;

-- ============================================================================
-- QUICK TEST QUERIES
-- ============================================================================

-- Check users expiring in the next 7 days (should trigger notifications)
-- Uncomment to run:
/*
SELECT
    email,
    subscription_status,
    CASE
        WHEN subscription_status = 'TRIAL' THEN
            CEIL(EXTRACT(EPOCH FROM (trial_end_date - CURRENT_TIMESTAMP)) / 86400)
        ELSE
            CEIL(EXTRACT(EPOCH FROM (subscription_end_date - CURRENT_TIMESTAMP)) / 86400)
    END as days_until_expiration
FROM users
WHERE email LIKE 'test-%@example.com'
  AND (
      (subscription_status = 'TRIAL' AND trial_end_date IS NOT NULL) OR
      (subscription_status = 'ACTIVE' AND subscription_end_date IS NOT NULL)
  )
  AND (
      (subscription_status = 'TRIAL' AND trial_end_date <= CURRENT_TIMESTAMP + INTERVAL '7 days') OR
      (subscription_status = 'ACTIVE' AND subscription_end_date <= CURRENT_TIMESTAMP + INTERVAL '7 days')
  )
ORDER BY days_until_expiration;
*/

-- Check grace period status for all test users
-- Uncomment to run:
/*
SELECT
    email,
    subscription_status,
    CASE
        WHEN subscription_status = 'TRIAL' THEN trial_end_date
        ELSE subscription_end_date
    END as end_date,
    CASE
        WHEN subscription_status = 'TRIAL' THEN
            FLOOR(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - trial_end_date)) / 86400)
        ELSE
            FLOOR(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - subscription_end_date)) / 86400)
    END as days_since_expiration,
    CASE
        WHEN subscription_status = 'TRIAL' AND trial_end_date < CURRENT_TIMESTAMP THEN
            CASE
                WHEN FLOOR(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - trial_end_date)) / 86400) < 3 THEN 'IN GRACE PERIOD'
                ELSE 'GRACE PERIOD ENDED - BLOCKED'
            END
        WHEN subscription_status = 'ACTIVE' AND subscription_end_date < CURRENT_TIMESTAMP THEN
            CASE
                WHEN FLOOR(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - subscription_end_date)) / 86400) < 3 THEN 'IN GRACE PERIOD'
                ELSE 'GRACE PERIOD ENDED - BLOCKED'
            END
        ELSE 'ACTIVE'
    END as access_status
FROM users
WHERE email LIKE 'test-%@example.com'
ORDER BY end_date;
*/

-- ============================================================================
-- CLEANUP SCRIPT
-- ============================================================================
-- Run this to remove all test data when done testing

/*
-- Uncomment to clean up all test data:

DELETE FROM subscription_notifications
WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'test-%@example.com');

DELETE FROM webhook_deliveries
WHERE webhook_config_id LIKE 'test-webhook-%';

DELETE FROM webhook_event_logs
WHERE webhook_config_id LIKE 'test-webhook-%';

DELETE FROM webhook_configs
WHERE id LIKE 'test-webhook-%';

DELETE FROM users
WHERE email LIKE 'test-%@example.com';

-- Verify cleanup
SELECT COUNT(*) as remaining_test_users FROM users WHERE email LIKE 'test-%@example.com';
SELECT COUNT(*) as remaining_test_webhooks FROM webhook_configs WHERE id LIKE 'test-webhook-%';
*/

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- Test User Credentials:
-- - Email: test-{scenario}@example.com (e.g., test-7days@example.com)
-- - Password: Test1234!
--
-- Test Scenarios Covered:
-- 1. test-7days@example.com       - Trial expires in 7 days (email notification)
-- 2. test-3days@example.com       - Trial expires in 3 days (email notification)
-- 3. test-1day@example.com        - Trial expires in 1 day (email notification)
-- 4. test-today@example.com       - Trial expires today (grace period starts)
-- 5. test-grace1@example.com      - In grace period (day 1) - access allowed
-- 6. test-grace-last@example.com  - In grace period (last day) - access allowed
-- 7. test-blocked@example.com     - Past grace period - access BLOCKED
-- 8. test-active@example.com      - Active paid subscription (45 days left)
-- 9. test-expiring@example.com    - Paid subscription expiring in 5 days
-- 10. test-grace-paid@example.com - Paid subscription in grace period
--
-- Webhook Configs:
-- 1. test-webhook-all         - All events, active
-- 2. test-webhook-expiration  - Expiration events only, active
-- 3. test-webhook-inactive    - Inactive (should not trigger)
--
-- To Test:
-- 1. Run this script on your test database
-- 2. Run cron job: POST /api/cron/subscription-notifications
-- 3. Check emails sent to test users
-- 4. Check webhooks triggered (view webhook.site)
-- 5. Test access control with different users
-- 6. Verify grace period calculations
--
-- ============================================================================
