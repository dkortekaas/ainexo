-- CreateEnum
CREATE TYPE "SyncLogStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "SyncEntryStatus" AS ENUM ('SUCCESS', 'FAILED', 'SKIPPED', 'ALREADY_VISITED');

-- AlterEnum
ALTER TYPE "MessageType" ADD VALUE 'FORM';

-- AlterTable
ALTER TABLE "conversation_messages" ADD COLUMN     "formId" TEXT;

-- AlterTable
ALTER TABLE "forms" ADD COLUMN     "triggers" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "website_sync_logs" (
    "id" TEXT NOT NULL,
    "websiteId" TEXT NOT NULL,
    "status" "SyncLogStatus" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "totalUrls" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "website_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "website_sync_log_entries" (
    "id" TEXT NOT NULL,
    "syncLogId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" "SyncEntryStatus" NOT NULL,
    "statusCode" INTEGER,
    "errorMessage" TEXT,
    "contentSize" INTEGER,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "website_sync_log_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_submissions" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "assistantId" TEXT,
    "data" JSONB NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "website_sync_logs_websiteId_idx" ON "website_sync_logs"("websiteId");

-- CreateIndex
CREATE INDEX "website_sync_logs_status_idx" ON "website_sync_logs"("status");

-- CreateIndex
CREATE INDEX "website_sync_logs_startedAt_idx" ON "website_sync_logs"("startedAt");

-- CreateIndex
CREATE INDEX "website_sync_log_entries_syncLogId_idx" ON "website_sync_log_entries"("syncLogId");

-- CreateIndex
CREATE INDEX "website_sync_log_entries_status_idx" ON "website_sync_log_entries"("status");

-- CreateIndex
CREATE INDEX "website_sync_log_entries_scrapedAt_idx" ON "website_sync_log_entries"("scrapedAt");

-- CreateIndex
CREATE INDEX "form_submissions_formId_idx" ON "form_submissions"("formId");

-- CreateIndex
CREATE INDEX "form_submissions_sessionId_idx" ON "form_submissions"("sessionId");

-- CreateIndex
CREATE INDEX "form_submissions_assistantId_idx" ON "form_submissions"("assistantId");

-- CreateIndex
CREATE INDEX "form_submissions_createdAt_idx" ON "form_submissions"("createdAt");

-- CreateIndex
CREATE INDEX "conversation_messages_formId_idx" ON "conversation_messages"("formId");

-- AddForeignKey
ALTER TABLE "website_sync_logs" ADD CONSTRAINT "website_sync_logs_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "website_sync_log_entries" ADD CONSTRAINT "website_sync_log_entries_syncLogId_fkey" FOREIGN KEY ("syncLogId") REFERENCES "website_sync_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
