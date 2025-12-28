-- This migration only adds billing fields to companies. Other schema objects
-- already exist from earlier migrations and are intentionally omitted to
-- avoid duplicate type/table creation.

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "billingAddress" JSONB,
ADD COLUMN     "billingEmail" TEXT,
ADD COLUMN     "billingName" TEXT,
ADD COLUMN     "vatNumber" TEXT;

