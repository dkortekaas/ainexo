-- Add privacy policy acceptance tracking fields to users table
-- For GDPR compliance (tracking user consent)

ALTER TABLE users
ADD COLUMN IF NOT EXISTS "privacyPolicyAccepted" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "privacyPolicyAcceptedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "privacyPolicyVersion" TEXT,
ADD COLUMN IF NOT EXISTS "termsAccepted" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "termsAcceptedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "termsVersion" TEXT,
ADD COLUMN IF NOT EXISTS "marketingEmailsConsent" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "marketingEmailsConsentAt" TIMESTAMP(3);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS "users_privacyPolicyAccepted_idx" ON users("privacyPolicyAccepted");
CREATE INDEX IF NOT EXISTS "users_termsAccepted_idx" ON users("termsAccepted");

-- Add comment
COMMENT ON COLUMN users."privacyPolicyAccepted" IS 'Whether user has accepted the privacy policy (GDPR compliance)';
COMMENT ON COLUMN users."privacyPolicyAcceptedAt" IS 'When the privacy policy was accepted';
COMMENT ON COLUMN users."privacyPolicyVersion" IS 'Version of privacy policy that was accepted';
COMMENT ON COLUMN users."termsAccepted" IS 'Whether user has accepted terms of service';
COMMENT ON COLUMN users."termsAcceptedAt" IS 'When the terms were accepted';
COMMENT ON COLUMN users."termsVersion" IS 'Version of terms that was accepted';
COMMENT ON COLUMN users."marketingEmailsConsent" IS 'Whether user consented to marketing emails';
COMMENT ON COLUMN users."marketingEmailsConsentAt" IS 'When marketing consent was given';
