-- AlterEnum
-- Add TRIAL value to SubscriptionPlan enum
ALTER TYPE "SubscriptionPlan" ADD VALUE IF NOT EXISTS 'TRIAL';
