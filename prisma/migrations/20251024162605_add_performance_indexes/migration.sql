-- CreateEnum
CREATE TYPE "FeedbackRating" AS ENUM ('THUMBS_UP', 'THUMBS_DOWN');

-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "SuggestionType" AS ENUM ('LOW_CONFIDENCE', 'NO_SOURCES', 'INSUFFICIENT_SOURCES', 'TOO_SHORT', 'TOO_LONG', 'IRRELEVANT_CONTENT', 'INCOMPLETE_ANSWER', 'POOR_KNOWLEDGE_BASE', 'SYSTEM_ERROR');

-- CreateEnum
CREATE TYPE "SuggestionPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('PENDING', 'REVIEWED', 'IMPLEMENTED', 'DISMISSED');

-- CreateTable
CREATE TABLE "message_feedback" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "rating" "FeedbackRating" NOT NULL,
    "feedback" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poor_response_analysis" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "originalQuestion" TEXT NOT NULL,
    "originalAnswer" TEXT NOT NULL,
    "userFeedback" TEXT,
    "confidence" DOUBLE PRECISION,
    "tokensUsed" INTEGER,
    "model" TEXT,
    "sourcesUsed" INTEGER NOT NULL,
    "analysisStatus" "AnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "suggestionsCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "poor_response_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "improvement_suggestions" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "type" "SuggestionType" NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "SuggestionPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "SuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "improvement_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "message_feedback_rating_idx" ON "message_feedback"("rating");

-- CreateIndex
CREATE INDEX "message_feedback_createdAt_idx" ON "message_feedback"("createdAt");

-- CreateIndex
CREATE INDEX "message_feedback_sessionId_idx" ON "message_feedback"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "message_feedback_messageId_key" ON "message_feedback"("messageId");

-- CreateIndex
CREATE INDEX "poor_response_analysis_analysisStatus_idx" ON "poor_response_analysis"("analysisStatus");

-- CreateIndex
CREATE INDEX "poor_response_analysis_createdAt_idx" ON "poor_response_analysis"("createdAt");

-- CreateIndex
CREATE INDEX "poor_response_analysis_messageId_idx" ON "poor_response_analysis"("messageId");

-- CreateIndex
CREATE INDEX "poor_response_analysis_sessionId_idx" ON "poor_response_analysis"("sessionId");

-- CreateIndex
CREATE INDEX "improvement_suggestions_analysisId_idx" ON "improvement_suggestions"("analysisId");

-- CreateIndex
CREATE INDEX "improvement_suggestions_type_idx" ON "improvement_suggestions"("type");

-- CreateIndex
CREATE INDEX "improvement_suggestions_priority_idx" ON "improvement_suggestions"("priority");

-- CreateIndex
CREATE INDEX "improvement_suggestions_status_idx" ON "improvement_suggestions"("status");

-- CreateIndex
CREATE INDEX "ChatbotSettings_userId_idx" ON "ChatbotSettings"("userId");

-- CreateIndex
CREATE INDEX "ChatbotSettings_userId_isActive_idx" ON "ChatbotSettings"("userId", "isActive");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE INDEX "conversation_sources_documentId_idx" ON "conversation_sources"("documentId");

-- CreateIndex
CREATE INDEX "document_chunks_documentId_chunkIndex_idx" ON "document_chunks"("documentId", "chunkIndex");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_expires_idx" ON "sessions"("expires");

-- CreateIndex
CREATE INDEX "users_subscriptionStatus_idx" ON "users"("subscriptionStatus");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_companyId_idx" ON "users"("companyId");

-- AddForeignKey
ALTER TABLE "message_feedback" ADD CONSTRAINT "message_feedback_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "conversation_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "improvement_suggestions" ADD CONSTRAINT "improvement_suggestions_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "poor_response_analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
