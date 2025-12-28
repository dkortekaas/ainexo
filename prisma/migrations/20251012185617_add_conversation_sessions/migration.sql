-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- AlterTable
ALTER TABLE "conversation_sources" ADD COLUMN     "messageId" TEXT,
ALTER COLUMN "conversationId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "conversation_sessions" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "assistantId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "avgResponseTime" INTEGER,
    "rating" SMALLINT,
    "ratingNotes" TEXT,
    "ratedAt" TIMESTAMP(3),
    "ratedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "conversation_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "messageType" "MessageType" NOT NULL DEFAULT 'USER',
    "content" TEXT NOT NULL,
    "responseTime" INTEGER,
    "tokensUsed" INTEGER,
    "model" TEXT,
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conversation_sessions_sessionId_key" ON "conversation_sessions"("sessionId");

-- CreateIndex
CREATE INDEX "conversation_sessions_sessionId_idx" ON "conversation_sessions"("sessionId");

-- CreateIndex
CREATE INDEX "conversation_sessions_assistantId_idx" ON "conversation_sessions"("assistantId");

-- CreateIndex
CREATE INDEX "conversation_sessions_startedAt_idx" ON "conversation_sessions"("startedAt");

-- CreateIndex
CREATE INDEX "conversation_sessions_lastActivity_idx" ON "conversation_sessions"("lastActivity");

-- CreateIndex
CREATE INDEX "conversation_sessions_rating_idx" ON "conversation_sessions"("rating");

-- CreateIndex
CREATE INDEX "conversation_messages_sessionId_idx" ON "conversation_messages"("sessionId");

-- CreateIndex
CREATE INDEX "conversation_messages_messageType_idx" ON "conversation_messages"("messageType");

-- CreateIndex
CREATE INDEX "conversation_messages_createdAt_idx" ON "conversation_messages"("createdAt");

-- CreateIndex
CREATE INDEX "conversation_sources_messageId_idx" ON "conversation_sources"("messageId");

-- AddForeignKey
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "conversation_sessions"("sessionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_sources" ADD CONSTRAINT "conversation_sources_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "conversation_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
