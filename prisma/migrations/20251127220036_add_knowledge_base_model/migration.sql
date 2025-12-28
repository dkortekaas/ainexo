-- CreateEnum
CREATE TYPE "KnowledgeBaseType" AS ENUM ('FAQ', 'WEBSITE', 'DOCUMENT');

-- CreateTable
CREATE TABLE "knowledge_bases" (
    "id" TEXT NOT NULL,
    "assistantId" TEXT NOT NULL,
    "type" "KnowledgeBaseType" NOT NULL,
    "faqId" TEXT,
    "websiteId" TEXT,
    "documentId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_bases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "knowledge_bases_assistantId_idx" ON "knowledge_bases"("assistantId");

-- CreateIndex
CREATE INDEX "knowledge_bases_type_idx" ON "knowledge_bases"("type");

-- CreateIndex
CREATE INDEX "knowledge_bases_enabled_idx" ON "knowledge_bases"("enabled");

-- CreateIndex
CREATE INDEX "knowledge_bases_createdAt_idx" ON "knowledge_bases"("createdAt");

-- AddForeignKey
ALTER TABLE "knowledge_bases" ADD CONSTRAINT "knowledge_bases_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "ChatbotSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_bases" ADD CONSTRAINT "knowledge_bases_faqId_fkey" FOREIGN KEY ("faqId") REFERENCES "faqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_bases" ADD CONSTRAINT "knowledge_bases_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_bases" ADD CONSTRAINT "knowledge_bases_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

